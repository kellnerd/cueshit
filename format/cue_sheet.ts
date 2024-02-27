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
 */

import type {
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
export const formatCue: CueFormatter = function (cue) {
  const trackNumber = padNum(cue.position, 2);
  return [
    command("  TRACK", trackNumber, "AUDIO"),
    command("    TITLE", cue.title),
    command("    PERFORMER", cue.performer),
    command("    INDEX", "01", formatTimestamp(cue.timeOffset)),
  ].filter(isDefined).join("\n");
};

/** Formats the commands for a cue sheet. */
export const formatCueSheet: CueSheetFormatter = function (cueSheet) {
  return [
    command("TITLE", cueSheet.title),
    command("PERFORMER", cueSheet.performer),
    command("FILE", cueSheet.mediaFile ?? "unknown.wav", "WAVE"),
    ...cueSheet.cues.map(formatCue),
  ].filter(isDefined).join("\n");
};

export default {
  name: "Cue Sheet",
  formatCue: formatCue,
  format: formatCueSheet,
} as CueFormat;
