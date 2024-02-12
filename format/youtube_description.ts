import { Cue, CueFormatter, CueSheetParser } from "../cuesheet.ts";
import { formatDuration, parseDuration } from "../duration.ts";

export const parseYouTubeDescription: CueSheetParser = function (description) {
  const chapterPattern = /^(?<timestamp>(\d+:)?\d{2}:\d{2})\s+(?<title>.+)/;
  const chapters: Cue[] = [];
  let previousChapter: Cue | undefined = undefined;

  for (const line of description.split("\n")) {
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

export const formatYouTubeChapter: CueFormatter = function (cue) {
  return `${formatDuration(cue.duration)} ${cue.title}`;
};
