// The only logging facade (ArchBoss docs/tech-spec/logging.md). The only file allowed to use console.
type Fields = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

const SENSITIVE = /token|cookie|authorization|api[_-]?key|password|secret/i;

export function redact(value: unknown, path = new WeakSet<object>()): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (!value || typeof value !== "object") return value;
  if (path.has(value)) return "[Circular]";
  path.add(value);
  const out = Array.isArray(value)
    ? value.map((v) => redact(v, path))
    : Object.fromEntries(
        Object.entries(value).filter(([k]) => !SENSITIVE.test(k)).map(([k, v]) => [k, redact(v, path)]),
      );
  path.delete(value); // only ancestors count, so shared (non-cyclic) references still print
  return out;
}

function emit(level: Level, message: string, fields?: Fields) {
  const clean = (fields ? redact(fields) : {}) as Fields;
  if (typeof window === "undefined") {
    const line = JSON.stringify({ ...clean, level, msg: message, ts: new Date().toISOString() });
    (level === "warn" || level === "error" ? process.stderr : process.stdout).write(line + "\n");
    return;
  }
  if ((level === "debug" || level === "info") && process.env.NODE_ENV === "production") return;
  console[level](message, clean);
}

export const log = {
  debug: (message: string, fields?: Fields) => emit("debug", message, fields),
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, fields?: Fields) => emit("error", message, fields),
};
