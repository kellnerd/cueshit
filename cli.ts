import {
  Command,
  EnumType,
  ValidationError,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import formats from "./formats.ts";

const formatIds = Object.keys(formats);

export const cli = new Command()
  .name("cueshit")
  .version("0.1.0")
  .description("Convert between different cuesheet/chapter/tracklist formats.")
  .type("format", new EnumType(formatIds))
  .option("-f, --from <format:format>", "ID of the input format.", {
    required: true,
  })
  .option("-t, --to <format:format>", "ID of the output format.", {
    required: true,
  })
  .arguments("<input-path:file>")
  .action(async (options, inputPath) => {
    const inputFormat = formats[options.from];
    const parseCues = inputFormat?.parser;
    if (!parseCues) {
      throw new ValidationError(
        `No parser for "${inputFormat?.name ?? options.from}" exists`,
      );
    }

    const outputFormat = formats[options.to];
    const formatCue = outputFormat?.formatter;
    if (!formatCue) {
      throw new ValidationError(
        `No formatter for "${outputFormat?.name ?? options.to}" exists`,
      );
    }

    const input = await Deno.readTextFile(inputPath);
    for (const cue of parseCues(input)) {
      console.log(formatCue(cue));
    }
  });

if (import.meta.main && Deno.args.length) {
  await cli.parse();
}
