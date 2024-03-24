/**
 * Internal representation of a {@linkcode CueSheet}, serialized as JSON.
 *
 * @module
 */

import type { CueFormat, CueSheet } from "../cuesheet.ts";

export default {
  name: "Internal Representation (JSON)",
  format: (cueSheet: CueSheet) => JSON.stringify(cueSheet),
  fileExtensions: [".json"],
} as CueFormat;
