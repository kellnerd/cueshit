import type { CueFormat } from "./cuesheet.ts";

import audacity_labels from "./format/audacity_labels.ts";
import cue_sheet from "./format/cue_sheet.ts";
import ffmpeg_commands from "./format/ffmpeg_commands.ts";
import ffprobe_json from "./format/ffprobe_json.ts";
import internal_json from "./format/internal_json.ts";
import losslesscut_csv from "./format/losslesscut_csv.ts";
import losslesscut_project from "./format/losslesscut_project.ts";
import musicbrainz_tracklist from "./format/musicbrainz_tracklist.ts";
import ogm_chapters from "./format/ogm_chapters.ts";
import youtube_description from "./format/youtube_description.ts";

/** Maps format IDs to format specifications. */
export const formats = {
  "audacity": audacity_labels,
  "cue": cue_sheet,
  "ffmpeg": ffmpeg_commands,
  "ffprobe": ffprobe_json,
  "internal": internal_json,
  "llc": losslesscut_project,
  "losslesscut": losslesscut_csv,
  "musicbrainz": musicbrainz_tracklist,
  "ogm": ogm_chapters,
  "youtube": youtube_description,
} satisfies Record<string, CueFormat>;

/** Type of supported format IDs. */
export type CueFormatId = keyof typeof formats;

/** List of supported format IDs. */
export const formatIds = Object.keys(formats) as CueFormatId[];

/** List of supported input format IDs. */
export const inputFormatIds = Object.entries(formats)
  .filter(([_id, format]) => format?.parse)
  .map(([id, _format]) => id) as CueFormatId[];

/** List of supported output format IDs. */
export const outputFormatIds = Object.entries(formats)
  .filter(([_id, format]) => format?.format ?? format?.formatCue)
  .map(([id, _format]) => id) as CueFormatId[];

export default formats;
