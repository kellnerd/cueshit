import type { CueFormat, CueFormatter } from "../cuesheet.ts";
import { getDurationFormatter, padNum, TimeUnit } from "../duration.ts";

const formatTimestamp = getDurationFormatter({
  largestUnit: TimeUnit.minutes,
  smallestUnit: TimeUnit.subSeconds,
  padLargestUnit: true,
  subSecondUnits: 75, // frames
});

export const formatCue: CueFormatter = function (cue) {
  const trackNumber = padNum(cue.position, 2);
  return [
    `  TRACK ${trackNumber} AUDIO`,
    `    TITLE ${cue.title}`,
    `    INDEX 01 ${formatTimestamp(cue.timeOffset)}`,
  ].join("\n");
};

export default {
  name: "Cue Sheet",
  formatCue: formatCue,
} as CueFormat;
