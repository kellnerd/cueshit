import type { CueFormat, CueFormatter } from "../cuesheet.ts";
import { getDurationFormatter, TimeUnit } from "../duration.ts";

const formatDuration = getDurationFormatter({
  largestUnit: TimeUnit.minutes,
});

export const formatMusicBrainzTrack: CueFormatter = function (cue) {
  return `${cue.position}. ${cue.title} (${
    formatDuration(cue.duration) ?? "?:??"
  })`;
};

export default {
  name: "MusicBrainz Track Parser Listing",
  formatCue: formatMusicBrainzTrack,
} as CueFormat;
