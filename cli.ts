import { bold, red, yellow } from "https://deno.land/std@0.210.0/fmt/colors.ts";
import { toText } from "https://deno.land/std@0.210.0/streams/to_text.ts";
import {
  Command,
  EnumType,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import { MusicBrainzClient } from "jsr:@kellnerd/musicbrainz@^0.0.3";
import {
  detectFormatAndParseCueSheet,
  formatCueSheet,
  getPossibleFormatsByExtension,
  parseCueSheet,
} from "./conversion.ts";
import { type CueSheet } from "./cuesheet.ts";
import {
  type CueFormatId,
  formats,
  inputFormatIds,
  outputFormatIds,
} from "./formats.ts";
import { createFFmpegArguments } from "./format/ffmpeg_commands.ts";
import { recommendedFFProbeOptions } from "./format/ffprobe_json.ts";

const version = "0.5.0";

const userAgent = `cueshit/${version} ( https://deno.land/x/cueshit )`;

/** MusicBrainz URLs which are accepted by the CLI. */
const musicBrainzUrlPattern = new URLPattern({
  pathname: "/release/:mbid([0-9a-f-]{36})",
});

/**
 * Creates a cue sheet from the content at the given input path or URL.
 *
 * - Automatically tries to detect format from file extension if not specified.
 * - Tries to call ffprobe for (multimedia) files with an unknown extension.
 * - If the extension is ambiguous, all parsers will be tried until success.
 *
 * @param inputPath Path to the input, falls back to standard input.
 * @param options Source format and additional cue sheet properties.
 */
export async function processCueSheetInput(
  inputPath: string | undefined,
  options: {
    from?: CueFormatId;
    sheet?: Record<string, string | undefined>;
  },
): Promise<CueSheet> {
  let input: string;
  if (inputPath) {
    if (!options.from) {
      let url: URL | undefined;
      try {
        url = new URL(inputPath);
      } catch {
        url = undefined;
      }
      if (url) {
        const mbid = musicBrainzUrlPattern.exec(url)?.pathname.groups.mbid;
        if (!mbid) {
          throw new ValidationError(
            "Unsupported URL, only MusicBrainz release URLs are allowed.",
          );
        }
        const mb = new MusicBrainzClient({ userAgent });
        const release = await mb.lookup("release", mbid, [
          "recordings",
          "artist-credits",
        ]);
        input = JSON.stringify(release);
        options.from = "mb-api";
      } else {
        const possibleFormatIds = getPossibleFormatsByExtension(inputPath);
        // We do not know the extension, so we expect a multimedia file.
        if (!possibleFormatIds.length) {
          // Fail if ffprobe permission has not been configured.
          const ffprobeStatus = await Deno.permissions.query({
            name: "run",
            command: "ffprobe",
          });
          if (ffprobeStatus.state !== "granted") {
            throw new ValidationError(
              "Unknown input file extension, please specify an input format.",
            );
          }

          // If the CLI has the permission to call ffprobe, we try to do that.
          const ffprobe = new Deno.Command("ffprobe", {
            args: [...recommendedFFProbeOptions, inputPath],
          });
          const { stderr, stdout, success } = await ffprobe.output();
          const textDecoder = new TextDecoder();
          if (success) {
            input = textDecoder.decode(stdout);
            options.from = "ffprobe";
          } else {
            throw new ValidationError(
              `Failed to open input with ffprobe: ${
                textDecoder.decode(stderr)
              }You may want to explicitly specify an input format.`,
            );
          }
        }
      }
    }
    // The (text-based) input format has explicitly been specified or we know
    // the file extension. We want to directly read the text content.
    input ??= await Deno.readTextFile(inputPath);
  } else {
    input = await toText(Deno.stdin.readable);
  }

  // Parse input, detect format if not specified.
  let cueSheet: CueSheet | undefined;
  if (options.from) {
    // Specified input format is guaranteed to be supported (cliffy EnumType).
    cueSheet = parseCueSheet(input, options.from)!;
  } else {
    const result = detectFormatAndParseCueSheet(input, inputPath);
    if (result) {
      cueSheet = result.cueSheet;
    } else {
      logErrorAndExit("Input could not be parsed, unsupported format.");
    }
  }

  // Set the values of cue sheet properties via CLI options.
  for (const [key, value] of Object.entries(options.sheet ?? {})) {
    if (key === "title" || key === "performer" || key === "mediaFile") {
      cueSheet[key] = value;
    } else if (key === "duration") {
      cueSheet[key] = parseFloat(value!);
    } else {
      logErrorAndExit(`Cue sheets have no "${key}" property.`);
    }
  }

  return cueSheet;
}

/** Cliffy command specification of the CLI. */
export const cli = new Command()
  .name("cueshit")
  .version(version)
  .description(`
    Convert between different cue sheet / chapter / tracklist formats.

    Reads from standard input if no input path or URL is specified.
    Writes to standard output if no output path is specified.
    Automatically tries to detect input and output format if not specified.
  `)
  .globalType("input-format", new EnumType(inputFormatIds))
  .globalType("output-format", new EnumType(outputFormatIds))
  .option("-f, --from <format:input-format>", "ID of the input format.")
  .option("-t, --to <format:output-format>", "ID of the output format.")
  .option("-o, --output <path:file>", "Path to the output file.")
  .option("--sheet.* <value>", "Set the value of a cue sheet property.")
  .arguments("[input-path:file]")
  .action(async (options, inputPath) => {
    if (!options.to && !options.output) {
      throw new ValidationError(
        'Missing option "--to" or "--output" to determine output format.',
      );
    }

    const cueSheet = await processCueSheetInput(inputPath, options);

    // Determine output format using file extension, if not specified.
    if (!options.to) {
      const possibleOutputFormats = getPossibleFormatsByExtension(
        // We have already checked above that `options.output` is specified.
        options.output!,
      ).filter((format) =>
        // Ignore irrelevant possible input formats.
        outputFormatIds.includes(format)
      );

      if (possibleOutputFormats.length === 1) {
        options.to = possibleOutputFormats[0];
      } else {
        throw new ValidationError(
          `Missing option "--to", could not determine format by file extension.`,
        );
      }
    }

    // Try to format output.
    const output = formatCueSheet(cueSheet, options.to);
    if (!output) {
      logErrorAndExit(`No formatter for "${options.to}" exists.`);
    }

    if (options.output) {
      await Deno.writeTextFile(options.output, output);
    } else {
      console.log(output);
    }
  })
  .command("formats", "List all supported formats.")
  .action(() => {
    const supported = (value: unknown) => value ? "X" : "";
    new Table()
      .header(["ID", "Input", "Output", "Name", "Extensions"].map(bold))
      .body(
        Object.entries(formats).map(([id, format]) => [
          yellow(id),
          supported(format.parse),
          supported(format.format ?? format.formatCue),
          format.name,
          format.fileExtensions?.join(" "),
        ]),
      )
      .columns([{}, { align: "center" }, { align: "center" }])
      .padding(2)
      .render();
  });

const ffmpegStatus = await Deno.permissions.query({
  name: "run",
  command: "ffmpeg",
});

// Register command which relies on the permission to run ffmpeg.
if (ffmpegStatus.state === "granted") {
  cli
    .command("split <input-path:file>")
    .description(`
      Split a media file into its chapters (using ffmpeg).

      Accepts a multimedia file with embedded chapters or a cue file as input.
      The split media files will be numbered and output into the working directory.
    `)
    .option("-f, --from <format:input-format>", "ID of the input format.")
    .option("--sheet.* <value>", "Set the value of a cue sheet property.")
    .action(async (options, inputPath) => {
      const cueSheet = await processCueSheetInput(inputPath, options);
      const textDecoder = new TextDecoder();

      let chapterArguments: string[][];
      try {
        chapterArguments = createFFmpegArguments(cueSheet);
      } catch (error) {
        logErrorAndExit(error.message);
      }

      for (const args of chapterArguments) {
        const ffmpeg = new Deno.Command("ffmpeg", { args });
        const { stderr, success } = await ffmpeg.output();

        // FFmpeg writes all log messages to stderr
        const logMessages = textDecoder.decode(stderr).trimEnd();
        if (logMessages) {
          console.log(logMessages);
        }

        if (success) {
          const outputPath = args.at(-1);
          console.log(`Saved '${outputPath}'`);
        } else {
          logErrorAndExit("Failed to split input using ffmpeg.");
        }
      }
    });
}

function logErrorAndExit(message: string, code = 1): never {
  console.error(red(`${bold("error")}: ${message}`));
  Deno.exit(code);
}

if (import.meta.main) {
  await cli.parse();
}
