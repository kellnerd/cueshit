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
  parseCueSheet,
} from "./conversion.ts";
import { type CueSheet } from "./cuesheet.ts";
import { formats, inputFormatIds, outputFormatIds } from "./formats.ts";

export const cli = new Command()
  .name("cueshit")
  .version("0.3.0-dev")
  .description(`
    Convert between different cue sheet / chapter / tracklist formats.

    Reads from standard input if no input path is specified.
    Writes to standard output if no output path is specified.
  `)
  .type("input-format", new EnumType(inputFormatIds))
  .type("output-format", new EnumType(outputFormatIds))
  .option("-f, --from <format:input-format>", "ID of the input format.")
  .option("-t, --to <format:output-format>", "ID of the output format.", {
    required: true,
  })
  .option("-o, --output <path:file>", "Path to the output file.")
  .option("--sheet.* <value>", "Set the value of a cue sheet property.")
  .arguments("[input-path:file]")
  .action(async (options, inputPath) => {
    const input = await (inputPath
      ? Deno.readTextFile(inputPath)
      : toText(Deno.stdin.readable));

    let cueSheet: CueSheet | undefined;
    if (options.from) {
      // Specified input format is guaranteed to be supported (cliffy EnumType).
      cueSheet = parseCueSheet(input, options.from)!;
    } else {
      const result = detectFormatAndParseCueSheet(input, inputPath);
      if (result) {
        cueSheet = result.cueSheet;
      } else {
        throw new ValidationError("Unsupported input format");
      }
    }

    for (const [key, value] of Object.entries(options.sheet ?? {})) {
      if (key === "title" || key === "performer" || key === "mediaFile") {
        cueSheet[key] = value;
      } else if (key === "duration") {
        cueSheet[key] = parseFloat(value!);
      } else {
        throw new ValidationError(`Cue sheets have no "${key}" property`);
      }
    }

    // Specified output format is guaranteed to be supported (cliffy EnumType).
    const output = formatCueSheet(cueSheet, options.to)!;

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
      .header(["ID", "Name", "Input", "Output"].map(bold))
      .body(
        Object.entries(formats).map(([id, format]) => [
          yellow(id),
          format?.name,
          supported(format?.parse),
          supported(format?.format ?? format?.formatCue),
        ]),
      )
      .columns([{}, {}, { align: "center" }, { align: "center" }])
      .padding(2)
      .render();
  });

if (import.meta.main && Deno.args.length) {
  await cli.parse();
}
