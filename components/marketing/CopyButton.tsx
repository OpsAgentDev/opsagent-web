"use client";

import { useEffect, useState } from "react";

/** Copies `text` to the clipboard and announces the result in an aria-live region beside the button. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 2000);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch {
      setStatus("Copy failed");
    }
  }

  return (
    <>
      <span className="copy-status" aria-live="polite">{status}</span>
      <button type="button" className="copy-btn" aria-label={label} onClick={copy}>
        Copy
      </button>
    </>
  );
}
