/**
 * [FFmpeg] commands to split a multimedia file into its chapters.
 *
 * [FFmpeg]: https://ffmpeg.org/ffmpeg.html
 */

import { assert } from "https://deno.land/std@0.210.0/assert/assert.ts";
import { extname } from "https://deno.land/std@0.210.0/path/extname.ts";
import { type CueFormat, type CueSheetFormatter } from "../cuesheet.ts";
import { isDefined, padNum } from "../utils.ts";

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

/** Formats cues as a series of ffmpeg chapter extraction commands. */
export const formatFFmpegCommands: CueSheetFormatter = function (cueSheet) {
  assert(
    cueSheet.mediaFile,
    "Path to the media file is required to output ffmpeg commands",
  );

  const mediaExtension = extname(cueSheet.mediaFile);
  const metadataSpecifier = tagsAtStreamLevelExtensions.has(mediaExtension)
    ? "s:a:0" // first audio stream
    : "g"; // globally

  const ffmpegCommands = cueSheet.cues.map((cue) => {
    const chapterOutputPath = `"${
      padNum(cue.position, 2)
    } - ${cue.title}${mediaExtension}"`;

    return [
      "ffmpeg",
      "-hide_banner",
      `-i "${cueSheet.mediaFile}"`,
      `-ss ${cue.timeOffset}`,
      isDefined(cue.duration) ? `-t ${cue.duration}` : undefined,
      "-c copy", // copy streams, do not re-encode
      "-map_chapters -1", // drop chapters in output files
      `-metadata:${metadataSpecifier} title="${cue.title}"`,
      isDefined(cue.performer)
        ? `-metadata:${metadataSpecifier} artist="${cue.performer}"`
        : undefined,
      chapterOutputPath,
    ].filter(isDefined).join(" ");
  });

  return ffmpegCommands.join("\n");
};

export default {
  name: "FFmpeg Split Commands",
  format: formatFFmpegCommands,
  fileExtensions: [".sh"],
} as CueFormat;
