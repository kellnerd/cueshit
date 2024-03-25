/**
 * [MusicBrainz] API release lookup result in JSON format.
 *
 * The lookup has to specify the include parameters `recordings` and `artist-credits`.
 *
 * [MusicBrainz]: https://musicbrainz.org/
 *
 * @module
 */

import type {
  ArtistCredit,
  Release,
} from "jsr:@kellnerd/musicbrainz@^0.0.3/api_types";
import type { Cue, CueFormat, CueSheetParser } from "../cuesheet.ts";

function joinArtistCredit(credits?: ArtistCredit[]): string | undefined {
  if (!credits) return;
  return credits.flatMap((credit) => [credit.name, credit.joinphrase]).join("");
}

/** Parses a MusicBrainz track parser listing into cues. */
export const parseMusicBrainzRelease: CueSheetParser = function (body) {
  const release: Release<"recordings" | "artist-credits"> = JSON.parse(body);
  const cues: Cue[] = [];
  let previousCue: Cue | undefined = undefined;

  for (const medium of release.media ?? []) {
    for (const track of medium.tracks ?? []) {
      const cue: Cue = {
        title: track.title,
        performer: joinArtistCredit(track["artist-credit"]),
        position: track.position,
        duration: track.length / 1000,
        timeOffset: previousCue
          ? previousCue.timeOffset + previousCue.duration!
          : 0,
      };
      cues.push(cue);
      previousCue = cue;
    }
  }

  return {
    title: release.title,
    performer: joinArtistCredit(release["artist-credit"]),
    cues,
  };
};

export default {
  name: "MusicBrainz API Release (JSON)",
  parse: parseMusicBrainzRelease,
  fileExtensions: [".json"],
} as CueFormat;
