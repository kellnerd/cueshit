/**
 * Metadata as returned by the [ffprobe] JSON writer.
 *
 * ffprobe is part of the FFmpeg multimedia framework and can extract
 * information from various multimedia formats.
 *
 * Mandatory ffprobe options: `-of json` and `-show_chapters`
 *
 * In order to extract additional metadata (like media filename and tags),
 * the `-show_format` and `-show_streams` options should also be specified.
 *
 * [ffprobe]: https://ffmpeg.org/ffprobe.html
 */

import { type CueFormat, type CueSheetParser } from "../cuesheet.ts";

/** Metadata as returned by the ffprobe JSON writer (incomplete). */
export interface FFMetadata {
  /** Information about the container format. */
  format?: FFFormat;
  /** Information about the streams inside the container. */
  streams?: FFStream[];
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
  /** Metadata tags. */
  tags?: Record<string, string | undefined>;
}

/** Stream information as returned by the ffprobe JSON writer (incomplete). */
export interface FFStream {
  index: number;
  /** Short name of the codec. */
  codec_name: string;
  /** Display name of the codec. */
  codec_long_name: string;
  /** Type of the codec. */
  codec_type: "video" | "audio" | "subtitle" | "data";
  /** Start time in seconds (6 decimal places). */
  start_time: string;
  /** Duration in seconds (6 decimal places). */
  duration: string;
  /** Metadata tags. */
  tags?: Record<string, string | undefined>;
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
export const parseFFProbeJson: CueSheetParser = function (input) {
  const { format, streams, chapters } = JSON.parse(input) as FFMetadata;
  // Tags are either stored as format property or as stream property.
  const tags = format?.tags ?? streams?.find((stream) => stream.tags)?.tags ??
    {};

  return {
    title: tags.title,
    performer: tags.artist ?? tags.ARTIST,
    mediaFile: format?.filename,
    duration: format ? parseFloat(format.duration) : undefined,
    cues: chapters?.map((chapter, index) => {
      const startTime = parseFloat(chapter.start_time);
      const endTime = parseFloat(chapter.end_time);
      return {
        position: index + 1,
        title: chapter.tags.title,
        timeOffset: startTime,
        duration: endTime - startTime,
      };
    }) ?? [],
  };
};

/** Recommended ffprobe CLI options to produce the desired JSON output. */
export const recommendedFFProbeOptions = [
  "-v",
  "error",
  "-of",
  "json",
  "-show_format",
  "-show_streams",
  "-show_chapters",
];

export default {
  name: "ffprobe Metadata with Chapters (JSON)",
  parse: parseFFProbeJson,
  fileExtensions: [".json"],
} as CueFormat;
