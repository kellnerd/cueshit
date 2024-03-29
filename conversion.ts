import { extname } from "https://deno.land/std@0.210.0/path/extname.ts";
import type { CueSheet } from "./cuesheet.ts";
import {
  type CueFormatId,
  formatIds,
  formats,
  inputFormatIds,
} from "./formats.ts";

/**
 * Parses a cue sheet with the given format.
 *
 * @param content Serialized content of the cue sheet.
 * @param formatId ID of the input format.
 * @returns Parsed cue sheet or `undefined` if the given format has no parser.
 */
export function parseCueSheet(
  content: string,
  formatId: CueFormatId,
): CueSheet | undefined {
  return formats[formatId].parse?.(content);
}

/** Result of a cue sheet format detection. */
export interface DetectionResult {
  /** Parsed cue sheet. */
  cueSheet: CueSheet;
  /** ID of the detected format which was successfully parsed. */
  formatId: CueFormatId;
}

/**
 * Detects the format of the given cue sheet and parses it.
 *
 * Tries to parse the serialized content with all supported input formats.
 * Exits as soon as a parser was successful and returned a non-empty cue sheet.
 *
 * If a path is given, the file extension will be used to prioritize the formats
 * which are using this file extension.
 *
 * @param content Serialized content of the cue sheet.
 * @param path Path to the cue sheet file (including extension).
 * @returns Parsed cue sheet and its format ID or `undefined` if detection failed.
 */
export function detectFormatAndParseCueSheet(
  content: string,
  path?: string,
): DetectionResult | undefined {
  const prioritizedFormatIds = new Set([
    ...(path ? getPossibleFormatsByExtension(path) : []),
    ...inputFormatIds,
  ]);

  let cueSheet: CueSheet | undefined;
  for (const formatId of prioritizedFormatIds) {
    try {
      cueSheet = parseCueSheet(content, formatId);
      if (cueSheet?.cues.length) {
        return { cueSheet, formatId };
      }
    } catch {
      continue;
    }
  }
}

/**
 * Serializes a cue sheet into the given format.
 *
 * If no cue sheet formatter exists, a cue sheet will be generated by joining
 * the individual formatted cues together with newlines.
 *
 * @param cueSheet Cue sheet object.
 * @param formatId ID of the output format.
 * @returns Serialized cue sheet or `undefined` if the given format has neither
 * a cue sheet nor a cue formatter.
 */
export function formatCueSheet(
  cueSheet: CueSheet,
  formatId: CueFormatId,
): string | undefined {
  const { format, formatCue } = formats[formatId];
  if (format) {
    return format(cueSheet);
  } else if (formatCue) {
    return cueSheet.cues.map(formatCue).join("\n");
  } else {
    return undefined;
  }
}

/** Maps file extensions to formats which use that extension. */
const extensionToFormatIds: Record<string, CueFormatId[]> = {};

/** Returns a list of possible formats for the given extension. */
export function getPossibleFormatsByExtension(path: string): CueFormatId[] {
  if (!Object.keys(extensionToFormatIds).length) {
    // Initialize file extension lookup table.
    for (const formatId of formatIds) {
      for (const extension of formats[formatId].fileExtensions ?? []) {
        if (!(extension in extensionToFormatIds)) {
          extensionToFormatIds[extension] = [formatId];
        } else {
          extensionToFormatIds[extension].push(formatId);
        }
      }
    }
  }

  // Lookup format IDs.
  const extension = extname(path);
  return extensionToFormatIds[extension] ?? [];
}
