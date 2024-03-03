/**
 * [FFmpeg] commands to split a multimedia file into its chapters.
 *
 * [FFmpeg]: https://ffmpeg.org/ffmpeg.html
 */

import { assert } from "https://deno.land/std@0.210.0/assert/assert.ts";
import { extname } from "https://deno.land/std@0.210.0/path/extname.ts";
import {
  type CueFormat,
  type CueSheet,
  type CueSheetFormatter,
} from "../cuesheet.ts";
import { isDefined, padNum, quoteArgument } from "../utils.ts";

/**
 * Audio file extensions for which FFmpeg treats tags as if they are stored at
 * the (audio) stream level instead of the container level. Incomplete.
 * Behavior seems to be Ogg-specific, might even be a bug:
 * - https://superuser.com/a/1545979
 * - https://trac.ffmpeg.org/ticket/8791
 * - https://trac.ffmpeg.org/ticket/10145
 */
const tagsAtStreamLevelExtensions = new Set([
  ".ogg", // Vorbis, OPUS
  ".opus",
]);

/**
 * Turns a cue sheet into a series of ffmpeg chapter extraction arguments.
 *
 * @returns An array which contains a list of ffmpeg arguments for each chapter.
 */
export function createFFmpegArguments(cueSheet: CueSheet): string[][] {
  assert(
    cueSheet.mediaFile,
    "Path to the media file is required to create ffmpeg arguments",
  );

  const mediaExtension = extname(cueSheet.mediaFile);
  const metadataSpecifier = tagsAtStreamLevelExtensions.has(mediaExtension)
    ? "s:a:0" // first audio stream
    : "g"; // globally

  /** Creates FFmpeg arguments to set a metadata tag if its value is defined. */
  function setMetadata(tag: string, value?: string | number): string[] {
    if (isDefined(value)) {
      return [
        `-metadata:${metadataSpecifier}`,
        `${tag}=${value}`,
      ];
    } else {
      return [];
    }
  }

  return cueSheet.cues.map((cue) => {
    const chapterOutputPath = `${
      padNum(cue.position, 2)
    } - ${cue.title}${mediaExtension}`;

    return [
      "-hide_banner",
      "-i",
      cueSheet.mediaFile!,
      "-ss",
      cue.timeOffset.toFixed(6),
      ...(isDefined(cue.duration) ? ["-t", cue.duration.toFixed(6)] : []),
      // copy streams, do not re-encode
      "-c",
      "copy",
      // drop chapters in output files
      "-map_chapters",
      "-1",
      ...setMetadata("title", cue.title),
      ...setMetadata("artist", cue.performer),
      ...setMetadata("album", cueSheet.title),
      ...setMetadata("album_artist", cueSheet.performer),
      chapterOutputPath,
    ].filter(isDefined);
  });
}

/** Formats a cue sheet as a series of ffmpeg chapter extraction commands. */
export const formatFFmpegCommands: CueSheetFormatter = function (cueSheet) {
  return createFFmpegArguments(cueSheet).map((chapterArguments) =>
    ["ffmpeg", ...chapterArguments.map(quoteArgument)].join(" ")
  ).join("\n");
};

export default {
  name: "FFmpeg Split Commands",
  format: formatFFmpegCommands,
  fileExtensions: [".sh"],
} as CueFormat;
