// The only logging facade (ArchBoss docs/tech-spec/logging.md). The only file allowed to use console.
type Fields = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

const SENSITIVE = new Set(["token", "cookie", "authorization", "apikey", "password"]);

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([k]) => !SENSITIVE.has(k.toLowerCase())).map(([k, v]) => [k, redact(v)]),
    );
  }
  return value;
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
