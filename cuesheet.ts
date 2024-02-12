export interface Cue {
  position: number;
  title: string;
  timeOffset: number;
  duration?: number;
}

export type CueFormatter = (cue: Cue) => string;

export interface CueSheet {
  cues: Cue[];
  title?: string;
  duration?: number;
}

export type CueSheetFormatter = (cuesheet: CueSheet) => string;

export type CueSheetParser = (input: string) => CueSheet;
