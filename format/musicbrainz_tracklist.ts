import type {
  Cue,
  CueFormat,
  CueFormatter,
  CueSheetParser,
} from "../cuesheet.ts";
import { getDurationFormatter, parseDuration, TimeUnit } from "../duration.ts";

const formatDuration = getDurationFormatter({
  largestUnit: TimeUnit.minutes,
});

export const formatMusicBrainzTrack: CueFormatter = function (cue) {
  return `${cue.position}. ${cue.title} (${
    formatDuration(cue.duration) ?? "?:??"
  })`;
};

export const parseMusicBrainzTrackListing: CueSheetParser = function (listing) {
  const trackPattern =
    /((?<position>\d+)?\.\s+)?(?<title>.+)\s+\((?<duration>\d+:\d{2})\)/;
  const tracks: Cue[] = [];
  let previousTrack: Cue | undefined = undefined;

  for (const line of listing.split(/\r?\n/)) {
    const trackMatch = line.match(trackPattern)?.groups;
    if (!trackMatch) continue;

    // Try to extract trailing performer from title.
    const performerMatch = trackMatch.title.match(/(.+) - (.+)/);
    const [title, performer] = performerMatch?.slice(1) ?? [trackMatch.title];

    const track: Cue = {
      title,
      performer,
      position: parseInt(trackMatch.position) ||
        (previousTrack ? previousTrack.position + 1 : 1),
      duration: parseDuration(trackMatch.duration),
      timeOffset: previousTrack
        ? previousTrack.timeOffset + previousTrack.duration!
        : 0,
    };
    tracks.push(track);
    previousTrack = track;
  }

  return {
    cues: tracks,
  };
};

export default {
  name: "MusicBrainz Track Parser Listing",
  formatCue: formatMusicBrainzTrack,
  parse: parseMusicBrainzTrackListing,
} as CueFormat;
