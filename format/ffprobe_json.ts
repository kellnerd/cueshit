import { type CueFormat, type CueSheetParser } from "../cuesheet.ts";
import { isDefined } from "../utils.ts";

/** Metadata as returned by the ffprobe JSON writer (incomplete). */
export interface FFMetadata {
  /** Information about the container format. */
  format?: FFFormat;
  /** Embedded chapters. */
  chapters?: FFChapter[];
}

/** Container format information as returned by the ffprobe JSON writer. */
export interface FFFormat {
  /** Name of the file (with extension). */
  filename: string;
  /** Number of streams in the file. */
  nb_streams: number;
  /** Number of programs in the file. */
  nb_programs: number;
  /** Short name of the format, might be a comma separated list. */
  format_name: string;
  /** Display name of the format, might be separated by spaced slashes. */
  format_long_name: string;
  /** Start time in seconds (6 decimal places). */
  start_time: string;
  /** Duration in seconds (6 decimal places). */
  duration: string;
  /** File size (in bytes). */
  size: string;
  /** Bit rate (in bps). */
  bit_rate: string;
  /** TODO: Integer, probably always 100? */
  probe_score: number;
}

/** Chapter as returned by the ffprobe JSON writer. */
export interface FFChapter {
  id: number;
  /** Time base (fractions of a second) of {@linkcode start} and {@linkcode end}. */
  time_base: "1/1000";
  /** Integer start time (unit specified by {@linkcode time_base}). */
  start: number;
  /** Start time in seconds (6 decimal places). */
  start_time: string;
  /** Integer end time (unit specified by {@linkcode time_base}). */
  end: number;
  /** End time in seconds (6 decimal places). */
  end_time: string;
  tags: {
    /** Title of the chapter. */
    title: string;
  };
}

/** Parses the output of the ffprobe JSON writer. */
export const parseFfprobeJson: CueSheetParser = function (input) {
  const {format, chapters} = JSON.parse(input) as FFMetadata;
  return {
    mediaFile: format?.filename,
    duration: format ? parseFloat(format.duration) : undefined,
    cues: chapters?.map((chapter, index) => {
      if (chapter.time_base !== "1/1000") return;
      const startTime = chapter.start / 1000;
      const endTime = chapter.end / 1000;
      return {
        position: index + 1,
        title: chapter.tags.title,
        timeOffset: startTime,
        duration: endTime - startTime,
      };
    }).filter(isDefined) ?? [],
  };
};

export default {
  name: "ffprobe Metadata with Chapters (JSON)",
  parse: parseFfprobeJson,
} as CueFormat;
