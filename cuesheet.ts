/** Representation of a cue (aka chapter / track). */
export interface Cue {
  /** Position of the cue in a list. */
  position: number;
  /** Title of the cue. */
  title: string;
  /** Time offset of the cue (in seconds). */
  timeOffset: number;
  /** Performer of the title. */
  performer?: string;
  /** Duration of the cue (in seconds). */
  duration?: number;
}

/** Function which serializes a cue into a string. */
export type CueFormatter = (cue: Cue) => string;

/**
 * Fallback value for the duration of a cue (in seconds).
 * While the duration is generally optional, some output formats require it.
 */
export const defaultCueDuration = 1;

/** Representation of a cue sheet, a list of cues. */
export interface CueSheet {
  /** List of cues, ordered by time offset. */
  cues: Cue[];
  /** Title of the cue sheet. */
  title?: string;
  /** Performer of the cue sheet. */
  performer?: string;
  /** Path to a media file to which the time offsets relate. */
  mediaFile?: string;
  /** Total duration of the media file (in seconds). */
  duration?: number;
}

/** Function which serializes a cue sheet into a string. */
export type CueSheetFormatter = (cueSheet: CueSheet) => string;

/** Function which extracts a cue sheet from a string. */
export type CueSheetParser = (input: string) => CueSheet;

/** Specification of a cue format. */
export interface CueFormat {
  /** Descriptive name of the format. */
  name: string;
  /** Formatter for a single cue. */
  formatCue?: CueFormatter;
  /**
   * Formatter for a full cue sheet.
   *
   * If no cue sheet formatter is specified, a cue sheet may be generated by
   * joining the individual formatted cues together with newlines.
   */
  format?: CueSheetFormatter;
  /** Parser which extracts a cue sheet. */
  parse?: CueSheetParser;
  /**
   * Standard file extension(s) of the format, in order of preference.
   */
  fileExtensions?: string[];
}
