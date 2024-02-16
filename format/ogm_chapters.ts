import type { CueFormat, CueFormatter } from "../cuesheet.ts";
import { getDurationFormatter, TimeUnit } from "../duration.ts";
import { padNum } from "../utils.ts";

const formatTimestamp = getDurationFormatter({
  largestUnit: TimeUnit.hours,
  smallestUnit: TimeUnit.subSeconds,
  padLargestUnit: true,
  subSecondUnits: 1000, // ms
});

export const formatOgmChapter: CueFormatter = function (cue) {
  const chapterNumber = padNum(cue.position, 2);
  return [
    `CHAPTER${chapterNumber}=${formatTimestamp(cue.timeOffset)}`,
    `CHAPTER${chapterNumber}NAME=${cue.title}`,
  ].join("\n");
};

export default {
  name: "OGM Tools Chapters",
  formatCue: formatOgmChapter,
} as CueFormat;
