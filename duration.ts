/** Parses a duration in seconds from the given `m:s` or `H:m:s` string. */
export function parseDuration(time: string): number {
  const timeComponents = time.split(":").map(Number);
  const maxIndex = timeComponents.length - 1;
  return timeComponents.reduceRight((seconds, value, index) =>
    seconds + value * (60 ** (maxIndex - index))
  );
}

export enum TimeUnit {
  subSeconds = -1,
  seconds = 0,
  minutes = 1,
  hours = 2,
}

interface DurationUnit {
  value: number;
  unit: TimeUnit;
}

export function getDurationFormatter({
  largestUnit = TimeUnit.hours,
  smallestUnit = TimeUnit.seconds,
  subSecondUnits = 0, // 1000 for ms, 75 for cue sheet frames
  subSecondSeparator = ".",
  padLargestUnit = false,
} = {}) {
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

/** Pads the given number with zeros to reach the given length. */
export function padNum(value: number, maxLength: number) {
  return value.toFixed().padStart(maxLength, "0");
}
