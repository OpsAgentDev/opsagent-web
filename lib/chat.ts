// Chat helpers: citation links in model text and the Server-Sent Events frame parser for streamChat.

/** One event of a streamed chat turn, as brain sends it (`event:` name plus its JSON `data:`). */
export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "done"; message_id: string; partial: boolean; partial_reason: string | null }
  | { type: "error"; code: string };

export type TextPart = { text: string } | { finding: string };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const FINDING = new RegExp(`finding:(${UUID})`, "gi");

export const isUuid = (s: string) => new RegExp(`^${UUID}$`, "i").test(s);

/** Splits untrusted model text so only `finding:<uuid>` becomes a link; everything else stays text. */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let at = 0;
  for (const m of text.matchAll(FINDING)) {
    if (m.index > at) parts.push({ text: text.slice(at, m.index) });
    parts.push({ finding: m[1]!.toLowerCase() });
    at = m.index + m[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  return parts;
}

const EVENTS = new Set(["delta", "tool", "done", "error"]);

/** Parses the complete frames in `buffer`; `rest` is the unfinished tail to prepend to the next chunk. */
export function parseSse(buffer: string): { events: ChatEvent[]; rest: string } {
  const frames = buffer.replace(/\r\n/g, "\n").split("\n\n");
  const rest = frames.pop() ?? "";
  const events: ChatEvent[] = [];
  for (const frame of frames) {
    let name = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) name = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    // Keep-alive comments and unknown events carry nothing for the thread.
    if (!EVENTS.has(name) || !data.length) continue;
    try {
      events.push({ type: name, ...JSON.parse(data.join("\n")) } as ChatEvent);
    } catch {
      // A garbled frame ends the answer like a stream error; the frames before it still count.
      events.push({ type: "error", code: "bad_frame" });
    }
  }
  return { events, rest };
}
