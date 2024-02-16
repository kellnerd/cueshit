import type { CueFormat, CueFormatter, CueSheetParser } from "../cuesheet.ts";
import { isDefined } from '../utils.ts';

export const formatAudacityLabel: CueFormatter = function (cue) {
  const defaultDuration = 1;
  return [
    cue.timeOffset,
    cue.timeOffset + (cue.duration ?? defaultDuration),
    cue.title,
  ].join("\t");
};

export const parseAudacityLabels: CueSheetParser = function (lines) {
  return {
    cues: lines.split("\n").map((line, index) => {
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
  name: "Audacity Label Track",
  formatCue: formatAudacityLabel,
  parse: parseAudacityLabels,
} as CueFormat;
