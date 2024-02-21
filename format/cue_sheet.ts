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

export const formatCue: CueFormatter = function (cue) {
  const trackNumber = padNum(cue.position, 2);
  return [
    command("  TRACK", trackNumber, "AUDIO"),
    command("    TITLE", cue.title),
    command("    PERFORMER", cue.performer),
    command("    INDEX", "01", formatTimestamp(cue.timeOffset)),
  ].filter(isDefined).join("\n");
};

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
