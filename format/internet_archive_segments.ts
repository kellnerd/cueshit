/**
 * [Internet Archive] digitized audio segment data in JSON format.
 *
 * These files should exist for all items in the [Long Playing Records] collection
 * and can be obtained from the `SEGMENT DATA` download option of an item.
 *
 * [Internet Archive]: https://archive.org/
 * [Long Playing Records]: https://archive.org/details/album_recordings
 *
 * @module
 */

import type { Cue, CueFormat, CueSheetParser } from "../cuesheet.ts";

/** Segment data for a digitized audio file, usually one side of a record. */
export interface IAFileSegmentData {
  /** Tracks which are contained in the audio file. */
  tracks: IATrack[];
  /** Name of the audio file, including directory. */
  file: string;
  /** Directory of the audio file, usually one per disc. */
  target_dir: string;
  segmenter_version: string;
  archivelp_version: string;
}

/** Audio track which is contained in a digitized audio file. */
export interface IATrack {
  /** Basic metadata of the track. */
  file_md: IATrackMetadata;
  segments: IASegments;
  /** Metadata tags of the track, names seem to be upper case Vorbis comments. */
  file_tags: Record<string, string | string[]>;
}

/** Basic metadata of an audio track. */
export interface IATrackMetadata {
  /** Number of the track, numbering is reset per file. */
  track: string;
  /** Name of the track. */
  title: string;
  /** Artist(s) of the track. */
  artist: string;
  /** Name of the release. */
  album: string;
  /** Number of the disc. */
  disc: string;
}

/** Possible audio segments of a track in a digitized audio file. */
export interface IASegments {
  /** Initial segment description with a confidence value. */
  initial: IASegment;
  /**
   * Final segment description without a confidence value.
   * Times are usually identical to the `initial` segment description.
   */
  final: IASegment;
}

/** Corresponding audio segment of a track in a digitized audio file. */
export interface IASegment {
  /** Duration in milliseconds. */
  duration: number;
  /** Start time in milliseconds. */
  start: number;
  /** Confidence value (floating point), usually 0.0? */
  confidence?: number;
  /** End time in milliseconds. */
  end: number;
}

/** Parses an Internet Archive segment data JSON document into cues. */
export const parseInternetArchiveSegments: CueSheetParser = function (body) {
  const mediumSides: IAFileSegmentData[] = JSON.parse(body);
  const cues: Cue[] = [];

  for (const side of mediumSides) {
    for (const track of side.tracks) {
      const meta = track.file_md;
      const segment = track.segments.final;
      const cue: Cue = {
        title: meta.title,
        performer: meta.artist,
        position: parseInt(meta.track),
        duration: segment.duration / 1000,
        timeOffset: segment.start / 1000,
        mediaFile: side.file,
      };
      cues.push(cue);
    }
  }

  // Release level tags should be the same for all tracks.
  const firstTrackTags = mediumSides[0].tracks[0].file_tags;
  return {
    cues,
    title: joinMultiValueTag(firstTrackTags["ALBUM"]),
    performer: joinMultiValueTag(firstTrackTags["ALBUMARTIST"]),
  };
};

function joinMultiValueTag(value: string | string[], separator = "; "): string {
  return typeof value === "string" ? value : value.join(separator);
}

export default {
  name: "Internet Archive Segment Data (JSON)",
  parse: parseInternetArchiveSegments,
  fileExtensions: [".json"],
} as CueFormat;
