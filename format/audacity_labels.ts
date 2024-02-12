import { CueFormatter } from "../cuesheet.ts";

export const formatAudacityLabel: CueFormatter = function (cue) {
  const defaultDuration = 1;
  return [
    cue.timeOffset,
    cue.timeOffset + (cue.duration ?? defaultDuration),
    cue.title,
  ].join("\t");
};
