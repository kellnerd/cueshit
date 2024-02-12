import type {
  CueFormatter,
  CueSheetFormatter,
  CueSheetParser,
} from "./cuesheet.ts";
import { formatAudacityLabel } from "./format/audacity_labels.ts";
import { formatMusicBrainzTrack } from "./format/musicbrainz_tracklist.ts";
import {
  formatYouTubeChapter,
  parseYouTubeDescription,
} from "./format/youtube_description.ts";

export interface CueFormat {
  name: string;
  formatCue?: CueFormatter;
  format?: CueSheetFormatter;
  parse?: CueSheetParser;
}

const formats: Record<string, CueFormat | undefined> = {
  "audacity": {
    name: "Audacity Label Track",
    formatCue: formatAudacityLabel,
  },
  "musicbrainz": {
    name: "MusicBrainz Track Parser Tracklist",
    formatCue: formatMusicBrainzTrack,
  },
  "youtube": {
    name: "Youtube Description with Chapters",
    formatCue: formatYouTubeChapter,
    parse: parseYouTubeDescription,
  },
};

export default formats;
