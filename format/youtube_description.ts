/**
 * YouTube description which contains chapters with timestamps.
 *
 * Each line which starts with a timestamp is treated as a chapter.
 * The remainder of such a line is treated as title of the chapter.
 *
 * ```
 * Lines which do not start with a timestamp will be skipped.
 * 00:00 Intro
 * 12:56 Test Title
 * 1:04:17 Credits
 * ```
 *
 * @module
 */

import type {
  Cue,
  CueFormat,
  CueFormatter,
  CueSheetParser,
} from "../cuesheet.ts";
import { getDurationFormatter, parseDuration } from "../duration.ts";

/** Parses a YouTube description which contains lines with timestamps. */
export const parseYouTubeDescription: CueSheetParser = function (description) {
  const chapterPattern = /^(?<timestamp>\d{1,2}:(\d{2}:)?\d{2})\s+(?<title>.+)/;
  const chapters: Cue[] = [];
  let previousChapter: Cue | undefined = undefined;

  for (const line of description.split(/\r?\n/)) {
    const chapterMatch = line.match(chapterPattern)?.groups;
    if (!chapterMatch) continue;

    const chapter: Cue = {
      title: chapterMatch.title,
      position: (previousChapter?.position ?? 0) + 1,
      timeOffset: parseDuration(chapterMatch.timestamp),
    };
    chapters.push(chapter);

    if (previousChapter) {
      previousChapter.duration = chapter.timeOffset -
        previousChapter.timeOffset;
    }
    previousChapter = chapter;
  }

  return {
    cues: chapters,
  };
};

const formatTimestamp = getDurationFormatter();

/** Formats a chapter line for a YouTube description. */
export const formatYouTubeChapter: CueFormatter = function (cue) {
  return `${formatTimestamp(cue.timeOffset)} ${cue.title}`;
};

export default {
  name: "Youtube Description with Chapters",
  formatCue: formatYouTubeChapter,
  parse: parseYouTubeDescription,
} as CueFormat;
