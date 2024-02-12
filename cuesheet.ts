export interface Cue {
  position: number;
  title: string;
  timeOffset: number;
  duration?: number;
}

export type CueFormatter = (cue: Cue) => string;

export type CueParser = (input: string) => Cue[];
