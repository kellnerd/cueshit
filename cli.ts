import { bold, yellow } from "https://deno.land/std@0.210.0/fmt/colors.ts";
import { toText } from "https://deno.land/std@0.210.0/streams/to_text.ts";
import {
  Command,
  EnumType,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import {
  detectFormatAndParseCueSheet,
  formatCueSheet,
  getPossibleFormatsByExtension,
  parseCueSheet,
} from "./conversion.ts";
import { type CueSheet } from "./cuesheet.ts";
import { formats, inputFormatIds, outputFormatIds } from "./formats.ts";
import { recommendedFFProbeOptions } from "./format/ffprobe_json.ts";

export const cli = new Command()
  .name("cueshit")
  .version("0.4.0-dev")
  .description(`
    Convert between different cue sheet / chapter / tracklist formats.

    Reads from standard input if no input path is specified.
    Writes to standard output if no output path is specified.
    Automatically tries to detect input and output format if not specified.
  `)
  .type("input-format", new EnumType(inputFormatIds))
  .type("output-format", new EnumType(outputFormatIds))
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

    let input: string;
    if (inputPath) {
      if (!options.from) {
        const possibleFormatIds = getPossibleFormatsByExtension(inputPath);
        // We do not know the extension, expect multimedia file and call ffprobe.
        if (!possibleFormatIds.length) {
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
        throw new ValidationError("Unsupported input format.");
      }
    }

    // Set the values of cue sheet properties via CLI options.
    for (const [key, value] of Object.entries(options.sheet ?? {})) {
      if (key === "title" || key === "performer" || key === "mediaFile") {
        cueSheet[key] = value;
      } else if (key === "duration") {
        cueSheet[key] = parseFloat(value!);
      } else {
        throw new ValidationError(`Cue sheets have no "${key}" property.`);
      }
    }

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
      throw new ValidationError(`No formatter for "${options.to}" exists.`);
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

if (import.meta.main) {
  await cli.parse();
}
