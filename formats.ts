import type { CueFormatter, CueParser } from "./cuesheet.ts";
import { formatAudacityLabel } from "./format/audacity_labels.ts";
import { formatMusicBrainzTrack } from "./format/musicbrainz_tracklist.ts";
import {
  formatYouTubeChapter,
  parseYouTubeDescription,
} from "./format/youtube_description.ts";

export interface CueFormat {
  name: string;
  formatter?: CueFormatter;
  parser?: CueParser;
}

const formats: Record<string, CueFormat | undefined> = {
  "audacity": {
    name: "Audacity Label Track",
    formatter: formatAudacityLabel,
  },
  "musicbrainz": {
    name: "MusicBrainz Track Parser Tracklist",
    formatter: formatMusicBrainzTrack,
  },
  "youtube": {
    name: "Youtube Description with Chapters",
    formatter: formatYouTubeChapter,
    parser: parseYouTubeDescription,
  },
};

export default formats;
