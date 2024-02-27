/**
 * Audacity [label track], serialized as TSV (tab-separated values) document.
 *
 * Each row contains one label with three columns for start time, end time
 * (both expressed in seconds) and the label annotation:
 *
 * ```tsv
 * 2.150000	2.150000	Point label at 2.15 seconds
 * 3.400000	6.100000	Region label from 3.4 to 6.1 seconds
 * ```
 *
 * [label track]: https://manual.audacityteam.org/man/label_tracks.html
 */

import {
  type CueFormat,
  type CueFormatter,
  type CueSheetParser,
  defaultCueDuration,
} from "../cuesheet.ts";
import { isDefined } from "../utils.ts";

/** Formats a cue as Audacity region label (TSV row). */
export const formatAudacityLabel: CueFormatter = function (cue) {
  return [
    cue.timeOffset,
    cue.timeOffset + (cue.duration ?? defaultCueDuration),
    cue.title,
  ].join("\t");
};

/** Parses an Audacity label track TSV document into cues. */
export const parseAudacityLabels: CueSheetParser = function (lines) {
  return {
    cues: lines.split(/\r?\n/).map((line, index) => {
      const [startTime, endTime, label] = line.split("\t");
      const timeOffset = parseFloat(startTime);
      if (!label || isNaN(timeOffset)) return;
      return {
        position: index + 1,
        title: label,
        timeOffset,
        duration: parseFloat(endTime) - timeOffset,
      };
    }).filter(isDefined),
  };
};

export default {
  name: "Audacity Label Track (TSV)",
  formatCue: formatAudacityLabel,
  parse: parseAudacityLabels,
} as CueFormat;
