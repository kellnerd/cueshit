/**
 * Track listing which is understood by the [MusicBrainz] [track parser].
 *
 * Each line represents one track and includes an optional track number, title,
 * an optional artist and the duration of the track (which might be unknown).
 *
 * ```
 * 1. Test Title - Performer (2:56)
 * 2. Another Title (without performer) (1:21)
 * 3. Final Title (with unknown duration) (?:??)
 * ```
 *
 * [MusicBrainz]: https://musicbrainz.org/
 * [track parser]: https://wiki.musicbrainz.org/How_to_Add_a_Release#The_Track_Parser_.28Manual_entry.29
 */

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

/** Formats a line with a track for the MusicBrainz track parser. */
export const formatMusicBrainzTrack: CueFormatter = function (cue) {
  // TODO: Include performer (if known)
  return `${cue.position}. ${cue.title} (${
    formatDuration(cue.duration) ?? "?:??"
  })`;
};

/** Parses a MusicBrainz track parser listing into cues. */
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
