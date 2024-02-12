import { CueFormatter } from "../cuesheet.ts";
import { formatDuration } from "../duration.ts";

export const formatMusicBrainzTrack: CueFormatter = function (cue) {
  return `${cue.position}. ${cue.title} (${formatDuration(cue.duration)})`;
};
