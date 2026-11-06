/** A person's name as brain accepts it: trimmed, 1 to 80 characters, no control characters. Null when unusable. */
export function cleanName(raw: string): string | null {
  const name = raw.trim();
  const length = [...name].length;
  return length >= 1 && length <= 80 && !/\p{Cc}/u.test(name) ? name : null;
}
