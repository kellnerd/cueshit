import type { CueFormat } from "./cuesheet.ts";

import audacity_labels from "./format/audacity_labels.ts";
import musicbrainz_tracklist from "./format/musicbrainz_tracklist.ts";
import youtube_description from "./format/youtube_description.ts";

/** Maps format IDs to format specifications. */
const formats: Record<string, CueFormat | undefined> = {
  "audacity": audacity_labels,
  "musicbrainz": musicbrainz_tracklist,
  "youtube": youtube_description,
};

export default formats;
