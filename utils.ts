/** Checks whether the given value is not undefined. */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/** Pads the given number with zeros to reach the given length. */
export function padNum(value: number, maxLength: number) {
  return value.toFixed().padStart(maxLength, "0");
}

/** Wraps a command line argument in single quotes and escapes single quotes. */
export function quoteArgument(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** Replaces characters which are not allowed in a Windows filename. */
export function sanitizeFilename(baseName: string): string {
  // https://learn.microsoft.com/en-gb/windows/win32/fileio/naming-a-file#naming-conventions
  // deno-lint-ignore no-control-regex
  const illegalCharacters = /[\u0000-\u001F<>:"/\\|?*]/g;
  return baseName.replaceAll(illegalCharacters, "_");
}
