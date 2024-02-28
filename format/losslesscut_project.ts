/**
 * [LosslessCut] project (LLC) format, JSON5 based.
 *
 * [LosslessCut]: https://github.com/mifi/lossless-cut
 */

import {
  type CueFormat,
  type CueSheetFormatter,
  defaultCueDuration,
} from "../cuesheet.ts";

/** LosslessCut segment. */
export interface LosslessCutSegment {
  /** Start time offset (in seconds). */
  start: number;
  /** End time offset (in seconds). */
  end: number;
  /** Name of the segment. */
  name: string;
}

/** LosslessCut project (LLC) document. */
export interface LosslessCutProject {
  version: 1;
  /** Name of the media file to which the cut segments refer. */
  mediaFileName?: string;
  /** List of cut segments. */
  cutSegments: LosslessCutSegment[];
}

/** Formats cues as LosslessCut project (LLC) JSON document. */
export const formatLosslessCutProject: CueSheetFormatter = function (cueSheet) {
  const project: LosslessCutProject = {
    version: 1,
    mediaFileName: cueSheet.mediaFile,
    cutSegments: cueSheet.cues.map((cue) => ({
      start: cue.timeOffset,
      end: cue.timeOffset + (cue.duration ?? defaultCueDuration),
      name: cue.title,
    })),
  };

  // Regular JSON with indentation is also valid JSON5.
  return JSON.stringify(project, null, 2);
};

export default {
  name: "LosslessCut Project (LLC)",
  format: formatLosslessCutProject,
  fileExtensions: [".llc"],
} as CueFormat;
