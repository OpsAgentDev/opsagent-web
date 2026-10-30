import { describe, expect, it } from "vitest";
import { isUuid, linkify, parseSse } from "@/lib/chat";

const ID = "0b9d6f7e-3c1a-4e2b-9f00-1234567890ab";

describe("chat", () => {
  it("linkify turns finding ids into links and leaves other text", () => {
    expect(linkify(`Newest is finding:${ID} (check s3.public). See finding:${ID}.`)).toEqual([
      { text: "Newest is " },
      { finding: ID },
      { text: " (check s3.public). See " },
      { finding: ID },
      { text: "." },
    ]);
    expect(linkify("finding:not-a-uuid <b>x</b>")).toEqual([{ text: "finding:not-a-uuid <b>x</b>" }]);
    expect(linkify("")).toEqual([]);
  });

  it("isUuid accepts only a whole uuid", () => {
    expect(isUuid(ID)).toBe(true);
    expect(isUuid(`${ID}x`)).toBe(false);
    expect(isUuid("1234")).toBe(false);
  });

  it("parses split SSE frames", () => {
    const first = parseSse('event: tool\ndata: {"name":"list_findings"}\n\n: keep-alive\n\nevent: delta\nda');
    expect(first.events).toEqual([{ type: "tool", name: "list_findings" }]);
    const second = parseSse(first.rest + 'ta: {"text":"Hi"}\n\nevent: done\r\ndata: {"message_id":"m","partial":true,"partial_reason":"time_limit"}\r\n\r\n');
    expect(second.events).toEqual([
      { type: "delta", text: "Hi" },
      { type: "done", message_id: "m", partial: true, partial_reason: "time_limit" },
    ]);
    expect(second.rest).toBe("");
    expect(parseSse('event: error\ndata: {"code":"ai_unavailable"}\n\n').events).toEqual([
      { type: "error", code: "ai_unavailable" },
    ]);
    expect(parseSse('event: delta\ndata: {"text":"a"}\n\nevent: delta\ndata: {broken\n\n').events).toEqual([
      { type: "delta", text: "a" },
      { type: "error", code: "bad_frame" },
    ]);
  });
});
