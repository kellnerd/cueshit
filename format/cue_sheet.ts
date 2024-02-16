import type {
  CueFormat,
  CueFormatter,
  CueSheetFormatter,
} from "../cuesheet.ts";
import { getDurationFormatter, padNum, TimeUnit } from "../duration.ts";

const formatTimestamp = getDurationFormatter({
  largestUnit: TimeUnit.minutes,
  smallestUnit: TimeUnit.subSeconds,
  padLargestUnit: true,
  subSecondUnits: 75, // frames
});

function command(name: string, ...values: Array<string | number | undefined>) {
  return values.every(Boolean) ? `${name} ${values.join(" ")}` : undefined;
}

export const formatCue: CueFormatter = function (cue) {
  const trackNumber = padNum(cue.position, 2);
  return [
    command("  TRACK", trackNumber, "AUDIO"),
    command("    TITLE", cue.title),
    command("    INDEX", "01", formatTimestamp(cue.timeOffset)),
  ].filter(Boolean).join("\n");
};

export const formatCueSheet: CueSheetFormatter = function (cueSheet) {
  return [
    command("TITLE", cueSheet.title),
    // command("FILE", cueSheet.file, "WAVE"),
    ...cueSheet.cues.map(formatCue),
  ].filter(Boolean).join("\n");
};

export default {
  name: "Cue Sheet",
  formatCue: formatCue,
  format: formatCueSheet,
} as CueFormat;
