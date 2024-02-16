import type { CueFormat, CueFormatter } from "../cuesheet.ts";

export const formatAudacityLabel: CueFormatter = function (cue) {
  const defaultDuration = 1;
  return [
    cue.timeOffset,
    cue.timeOffset + (cue.duration ?? defaultDuration),
    cue.title,
  ].join("\t");
};

export default {
  name: "Audacity Label Track",
  formatCue: formatAudacityLabel,
} as CueFormat;
