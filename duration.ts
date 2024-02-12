/** Parses a duration in seconds from the given `m:s` or `H:m:s` string. */
export function parseDuration(time: string): number {
  const timeComponents = time.split(":").map(Number);
  const maxIndex = timeComponents.length - 1;
  return timeComponents.reduceRight((seconds, value, index) =>
    seconds + value * (60 ** (maxIndex - index))
  );
}

/** Formats the given duration in seconds as `mm:ss` string. */
export function formatDuration(seconds?: number): string {
  if (seconds) {
    return `${Math.floor(seconds / 60)}:${padNum(seconds % 60, 2)}`;
  } else {
    return "?:??";
  }
}

function padNum(value: number, maxLength: number) {
  return value.toFixed().padStart(maxLength, "0");
}
