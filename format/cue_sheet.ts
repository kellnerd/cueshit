/**
 * Cue sheet file which describes the track layout of an audio CD.
 *
 * Supported commands: `FILE`, `TRACK`, `INDEX`, `TITLE` and `PERFORMER`
 *
 * ```cue
 * FILE test.wav WAVE
 *   TRACK 01 AUDIO
 *     TITLE "Test Title"
 *     INDEX 01 00:00:00
 *   TRACK 02 AUDIO
 *     TITLE "Another Title"
 *     INDEX 01 02:56:42
 * ```
 *
 * @module
 */

import type {
  Cue,
  CueFormat,
  CueFormatter,
  CueSheetFormatter,
} from "../cuesheet.ts";
import { getDurationFormatter, TimeUnit } from "../duration.ts";
import { isDefined, padNum } from "../utils.ts";

const formatTimestamp = getDurationFormatter({
  largestUnit: TimeUnit.minutes,
  smallestUnit: TimeUnit.subSeconds,
  padLargestUnit: true,
  subSecondSeparator: ":",
  subSecondUnits: 75, // frames
});

/** Serializes a cue sheet command if all its values are defined. */
function command(name: string, ...values: Array<string | number | undefined>) {
  if (values.every(isDefined)) {
    return `${name} ${
      values.map((value) => {
        if (typeof value === "string" && value.includes(" ")) {
          // There is no standard to escape double quotes, so we replace them.
          return `"${value.replaceAll('"', "''")}"`;
        } else {
          return value;
        }
      }).join(" ")
    }`;
  }
}

/** Formats the commands for a single cue. */
export const formatCue: CueFormatter = function (
  cue,
  index?: number,
  cues?: Cue[],
) {
  let mediaFile = cue.mediaFile;
  // Do not repeat identical FILE commands if we are writing a full cue sheet.
  if (index && cues) {
    // The media file has not changed since the last cue.
    if (mediaFile === cues[index - 1].mediaFile) {
      mediaFile = undefined;
    }
  } else if (index === 0) {
    // We have already written a global FILE command before the first cue.
    mediaFile = undefined;
  }

  return [
    command("FILE", mediaFile, "WAVE"),
    command("  TRACK", padNum(cue.position, 2), "AUDIO"),
    command("    TITLE", cue.title),
    command("    PERFORMER", cue.performer),
    command("    INDEX", "01", formatTimestamp(cue.timeOffset)),
  ].filter(isDefined).join("\n");
};

/** Formats the commands for a cue sheet. */
export const formatCueSheet: CueSheetFormatter = function (cueSheet) {
  // Prefer media file of the first cue over global media file.
  const mediaFile = cueSheet.cues[0].mediaFile ?? cueSheet.mediaFile;

  return [
    command("TITLE", cueSheet.title),
    command("PERFORMER", cueSheet.performer),
    command("FILE", mediaFile ?? "unknown.wav", "WAVE"),
    ...cueSheet.cues.map(formatCue),
  ].filter(isDefined).join("\n");
};

export default {
  name: "Cue Sheet",
  formatCue: formatCue,
  format: formatCueSheet,
  fileExtensions: [".cue"],
} as CueFormat;
