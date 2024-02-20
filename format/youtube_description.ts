import type {
  Cue,
  CueFormat,
  CueFormatter,
  CueSheetParser,
} from "../cuesheet.ts";
import { getDurationFormatter, parseDuration } from "../duration.ts";

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

export const formatYouTubeChapter: CueFormatter = function (cue) {
  return `${formatTimestamp(cue.timeOffset)} ${cue.title}`;
};

export default {
  name: "Youtube Description with Chapters",
  formatCue: formatYouTubeChapter,
  parse: parseYouTubeDescription,
} as CueFormat;
