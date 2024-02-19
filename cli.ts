import { bold, yellow } from "https://deno.land/std@0.196.0/fmt/colors.ts";
import {
  Command,
  EnumType,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { Table } from "https://deno.land/x/cliffy@v1.0.0-rc.3/table/mod.ts";
import formats from "./formats.ts";

const inputFormatIds = Object.entries(formats)
  .filter(([_id, format]) => format?.parse)
  .map(([id, _format]) => id);
const outputFormatIds = Object.entries(formats)
  .filter(([_id, format]) => format?.format ?? format?.formatCue)
  .map(([id, _format]) => id);

export const cli = new Command()
  .name("cueshit")
  .version("0.1.0")
  .description("Convert between different cuesheet/chapter/tracklist formats.")
  .type("input-format", new EnumType(inputFormatIds))
  .type("output-format", new EnumType(outputFormatIds))
  .option("-f, --from <format:input-format>", "ID of the input format.", {
    required: true,
  })
  .option("-t, --to <format:output-format>", "ID of the output format.", {
    required: true,
  })
  .arguments("<input-path:file>")
  .action(async (options, inputPath) => {
    const inputFormat = formats[options.from];
    const parseCueSheet = inputFormat?.parse;
    if (!parseCueSheet) {
      throw new ValidationError(
        `No parser for "${inputFormat?.name ?? options.from}" exists`,
      );
    }

    const outputFormat = formats[options.to];
    let formatCueSheet = outputFormat?.format;
    if (!formatCueSheet) {
      const formatCue = outputFormat?.formatCue;
      if (!formatCue) {
        throw new ValidationError(
          `No formatter for "${outputFormat?.name ?? options.to}" exists`,
        );
      } else {
        formatCueSheet = (cuesheet) => cuesheet.cues.map(formatCue).join("\n");
      }
    }

    const input = await Deno.readTextFile(inputPath);
    const cueSheet = parseCueSheet(input);
    console.log(formatCueSheet(cueSheet));
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
