/**
 * [OGM tools] chapter format which is also supported by [MKVToolNix].
 *
 * It is also called [simple chapter format] by MKVToolNix and consists of pairs
 * of lines that specify the timestamp and the name of the chapter:
 *
 * ```
 * CHAPTER01=00:00:00.000
 * CHAPTER01NAME=Intro
 * ```
 *
 * [MKVToolNix]: https://mkvtoolnix.download/doc/mkvmerge.html#mkvmerge.chapters
 * [OGM tools]: https://www.bunkus.org/videotools/ogmtools/
 * [simple chapter format]: https://mkvtoolnix.download/doc/mkvmerge.html#mkvmerge.chapters.simple
 */

import type { CueFormat, CueFormatter } from "../cuesheet.ts";
import { getDurationFormatter, TimeUnit } from "../duration.ts";
import { padNum } from "../utils.ts";

const formatTimestamp = getDurationFormatter({
  largestUnit: TimeUnit.hours,
  smallestUnit: TimeUnit.subSeconds,
  padLargestUnit: true,
  subSecondUnits: 1000, // ms
});

/** Formats a pair of lines which describes a chapter. */
export const formatOgmChapter: CueFormatter = function (cue) {
  const chapterNumber = padNum(cue.position, 2);
  return [
    `CHAPTER${chapterNumber}=${formatTimestamp(cue.timeOffset)}`,
    `CHAPTER${chapterNumber}NAME=${cue.title}`,
  ].join("\n");
};

export default {
  name: "OGM Tools Chapters / MKVToolNix Simple Chapters",
  formatCue: formatOgmChapter,
  fileExtensions: [".txt"],
} as CueFormat;
