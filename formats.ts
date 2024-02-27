import type { CueFormat } from "./cuesheet.ts";

import audacity_labels from "./format/audacity_labels.ts";
import cue_sheet from "./format/cue_sheet.ts";
import ffprobe_json from './format/ffprobe_json.ts';
import internal_json from './format/internal_json.ts';
import losslesscut_csv from './format/losslesscut_csv.ts';
import musicbrainz_tracklist from "./format/musicbrainz_tracklist.ts";
import ogm_chapters from "./format/ogm_chapters.ts";
import youtube_description from "./format/youtube_description.ts";

/** Maps format IDs to format specifications. */
const formats: Record<string, CueFormat | undefined> = {
  "audacity": audacity_labels,
  "cue": cue_sheet,
  "ffprobe": ffprobe_json,
  "internal": internal_json,
  "losslesscut": losslesscut_csv,
  "musicbrainz": musicbrainz_tracklist,
  "ogm": ogm_chapters,
  "youtube": youtube_description,
};

export default formats;
