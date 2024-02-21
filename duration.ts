import { padNum } from "./utils.ts";

/** Parses a duration in seconds from the given `m:s` or `H:m:s` string. */
export function parseDuration(time: string): number {
  const timeComponents = time.split(":").map(Number);
  const maxIndex = timeComponents.length - 1;
  return timeComponents.reduceRight((seconds, value, index) =>
    seconds + value * (60 ** (maxIndex - index))
  );
}

/** Time units which are used by the duration formatter. */
export enum TimeUnit {
  subSeconds = -1,
  seconds = 0,
  minutes = 1,
  hours = 2,
}

/** Time value and its unit. */
interface DurationUnit {
  value: number;
  unit: TimeUnit;
}

/** Specification of a duration format. */
export interface DurationFormat {
  /** Largest time unit which is displayed, defaults to hours. */
  largestUnit: TimeUnit;
  /** Smallest time unit which is displayed, defaults to seconds. */
  smallestUnit: TimeUnit;
  /** Total count of units a second is divided into (default: 0). */
  subSecondUnits: number;
  /** Separate seconds and sub-second units by something else than a dot. */
  subSecondSeparator: string;
  /** Largest unit should be zero-padded, disabled by default. */
  padLargestUnit: boolean;
}

/**
 * Creates a function which formats a duration according to the given format.
 * @returns Function which formats a duration in seconds.
 */
export function getDurationFormatter(format: Partial<DurationFormat> = {}) {
  const {
    largestUnit = TimeUnit.hours,
    smallestUnit = TimeUnit.seconds,
    subSecondUnits = 0,
    subSecondSeparator = ".",
    padLargestUnit = false,
  } = format;
  const unitWidth = 2;
  const subSecondWidth = (subSecondUnits - 1).toFixed().length;

  function padUnit(unit: DurationUnit) {
    if (unit.unit === TimeUnit.subSeconds) {
      return subSecondSeparator + padNum(unit.value, subSecondWidth);
    } else if (unit.unit === largestUnit) {
      return padNum(unit.value, padLargestUnit ? unitWidth : 0);
    } else {
      return ":" + padNum(unit.value, unitWidth);
    }
  }

  return function (seconds?: number) {
    if (seconds !== undefined) {
      const units = toDurationUnits(seconds, { largestUnit, subSecondUnits });
      return units
        .filter((unit) => unit.unit >= smallestUnit)
        .map(padUnit)
        .join("");
    }
  };
}

/**
 * Converts a duration in seconds into an array of balanced time units.
 * Balances all units except for the specified largest unit.
 * Sub-seconds are handled according to the specified total count of sub-second units.
 */
function toDurationUnits(seconds: number, {
  largestUnit = TimeUnit.hours,
  subSecondUnits = 0,
} = {}): DurationUnit[] {
  const units: DurationUnit[] = [];
  for (let unit = largestUnit; unit >= TimeUnit.seconds; unit--) {
    let value = seconds / 60 ** unit;
    // Truncate all units except for the smallest unit.
    if (unit > TimeUnit.seconds || subSecondUnits) {
      value = Math.trunc(value);
    }
    // Balance all units except for the largest unit.
    if (unit < largestUnit) {
      value %= 60;
    }
    units.push({ value, unit });
  }
  if (subSecondUnits) {
    units.push({
      value: Math.trunc((seconds % 1) * subSecondUnits),
      unit: TimeUnit.subSeconds,
    });
  }
  return units;
}
