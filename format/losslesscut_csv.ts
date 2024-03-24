/**
 * [LosslessCut] segments, exported in the LosslessCut CSV format.
 *
 * Each row contains one segment with three columns for start time, end time
 * (both expressed in seconds or empty) and label:
 *
 * ```csv
 * ,56.9568,First segment starting at 0
 * 70,842.33,"Another quoted label"
 * 1234,,Last segment
 * ```
 *
 * [LosslessCut]: https://github.com/mifi/lossless-cut
 *
 * @module
 */

import { stringify as stringifyCsv } from "https://deno.land/std@0.210.0/csv/stringify.ts";
import { parse as parseCsv } from "https://deno.land/std@0.210.0/csv/parse.ts";
import {
  type CueFormat,
  type CueSheetFormatter,
  type CueSheetParser,
  defaultCueDuration,
} from "../cuesheet.ts";
import { isDefined } from "../utils.ts";

/** Formats cues as LosslessCut CSV document. */
export const formatLosslessCutCsv: CueSheetFormatter = function (cueSheet) {
  return stringifyCsv(
    cueSheet.cues.map((cue) => [
      cue.timeOffset,
      cue.timeOffset + (cue.duration ?? defaultCueDuration),
      cue.title,
    ]),
    { headers: false },
  );
};

/** Parses a LosslessCut CSV document into cues. */
export const parseLosslessCutCsv: CueSheetParser = function (csv) {
  const segments = parseCsv(csv, { columns: ["start", "end", "label"] });
  return {
    cues: segments.map((segment, index) => {
      const timeOffset = parseFloat(segment.start || "0");
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
  fileExtensions: [".csv"],
} as CueFormat;
