/** True when `target` stays on `origin` (a "/path" or an absolute URL on it); rejects "//host" and "/\host". */
export function isSameOrigin(target: string, origin: string): boolean {
  try {
    return new URL(target, origin).origin === origin;
  } catch {
    return false;
  }
}
