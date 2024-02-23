import {
  type CueFormat,
  type CueFormatter,
  type CueSheetParser,
  defaultCueDuration,
} from "../cuesheet.ts";
import { isDefined } from "../utils.ts";

export const formatAudacityLabel: CueFormatter = function (cue) {
  return [
    cue.timeOffset,
    cue.timeOffset + (cue.duration ?? defaultCueDuration),
    cue.title,
  ].join("\t");
};

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
