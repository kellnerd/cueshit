/**
 * CD-DA metadata as returned by the `cd-info` utility from [libcdio].
 *
 * [libcdio]: https://www.gnu.org/software/libcdio/libcdio.html
 *
 * @module
 */

import { assert } from "https://deno.land/std@0.210.0/assert/assert.ts";
import type { Cue, CueFormat, CueSheet, CueSheetParser } from "../cuesheet.ts";
import { parseCdFrameDuration } from "../duration.ts";

enum InputState {
  UNKNOWN,
  TOC,
  CD_TEXT_FOR_DISC,
  CD_TEXT_FOR_TRACK,
}

/** Parses the output of the `cd-info` utility. */
export const parseCdInfo: CueSheetParser = function (input) {
  assert(input.startsWith("cd-info"), "cd-info header is missing");
  const sheet: CueSheet = {
    cues: [],
  };
  let previousTimeOffset = 0;
  let currentCue: Cue | undefined = undefined;
  let currentInput: InputState = InputState.UNKNOWN;
  for (let line of input.split(/\r?\n/)) {
    if (line.startsWith("CD-ROM Track List")) {
      currentInput = InputState.TOC;
      continue;
    }
    const cdTextFor = line.match(/^CD-TEXT for (Disc|Track\s+\d+)/)?.[1];
    if (cdTextFor) {
      if (cdTextFor === "Disc") {
        currentInput = InputState.CD_TEXT_FOR_DISC;
      } else {
        currentInput = InputState.CD_TEXT_FOR_TRACK;
        const trackNumber = parseInt(cdTextFor.replace("Track", ""), 10);
        currentCue = sheet.cues.find((cue) => cue.position === trackNumber);
      }
      continue;
    }
    switch (currentInput) {
      case InputState.TOC: {
        line = line.trimStart();
        if (line.startsWith("#")) {
          // Skip TOC table header.
          continue;
        }
        const trackMatch = line.match(/^(\d{1,3}): (\d{2}:\d{2}:\d{2})\b/);
        if (trackMatch) {
          const trackNumber = parseInt(trackMatch[1]);
          const timeOffset = parseCdFrameDuration(trackMatch[2]);
          if (currentCue) {
            // Each TOC has a leadout pseudo-track 170 which guarantees this
            // cleanup step is also performed for the last proper track.
            currentCue.duration = timeOffset - previousTimeOffset;
            sheet.cues.push(currentCue);
          }
          currentCue = {
            position: trackNumber,
            title: `Track ${trackNumber}`,
            timeOffset,
          };
          previousTimeOffset = timeOffset;
        } else {
          currentInput = InputState.UNKNOWN;
        }
        break;
      }
      case InputState.CD_TEXT_FOR_DISC:
        parseMetadataLine(line, sheet);
        break;
      case InputState.CD_TEXT_FOR_TRACK:
        if (currentCue) {
          parseMetadataLine(line, currentCue);
        }
        break;
    }
  }
  return sheet;
};

function parseMetadataLine(line: string, target: Cue | CueSheet) {
  const metadataMatch = line.match(/(?<key>[A-Z]+): (?<value>.+)/);
  if (metadataMatch) {
    const { key, value } = metadataMatch.groups!;
    switch (key) {
      case "TITLE":
        target.title = value;
        break;
      case "PERFORMER":
        target.performer = value;
        break;
    }
  }
}

export default {
  name: "cd-info CD-TEXT and TOC",
  parse: parseCdInfo,
} as CueFormat;
