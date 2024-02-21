import { stringify as stringifyCsv } from "https://deno.land/std@0.210.0/csv/stringify.ts";
import { parse as parseCsv } from "https://deno.land/std@0.210.0/csv/parse.ts";
import type {
  CueFormat,
  CueSheetFormatter,
  CueSheetParser,
} from "../cuesheet.ts";
import { isDefined } from "../utils.ts";

export const formatLosslessCutCsv: CueSheetFormatter = function (cueSheet) {
  const defaultDuration = 1;
  return stringifyCsv(
    cueSheet.cues.map((cue) => [
      cue.timeOffset,
      cue.timeOffset + (cue.duration ?? defaultDuration),
      cue.title,
    ]),
    { headers: false },
  );
};

export const parseLosslessCutCsv: CueSheetParser = function (lines) {
  const segments = parseCsv(lines, { columns: ["start", "end", "label"] });
  return {
    cues: segments.map((segment, index) => {
      const timeOffset = parseFloat(segment.start);
      if (isNaN(timeOffset)) return;
      return {
        position: index + 1,
        title: segment.label,
        timeOffset,
        duration: parseFloat(segment.end) - timeOffset,
      };
    }).filter(isDefined),
  };
};

export default {
  name: "LosslessCut Segments (CSV)",
  format: formatLosslessCutCsv,
  parse: parseLosslessCutCsv,
} as CueFormat;
