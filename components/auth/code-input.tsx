"use client";
import { useState } from "react";
import { codeDigits } from "@/lib/auth-errors";

// One input, not six boxes: one-time-code autofill and pasting "123 456" both just work.
export function CodeInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  function change(raw: string) {
    const digits = codeDigits(raw);
    setValue(digits);
    if (digits.length === 6) onComplete(digits);
  }
  return (
    <label className="auth-code">
      6-digit code
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        autoFocus
        value={value}
        disabled={disabled}
        onChange={(e) => change(e.target.value)}
        // Take the digits from a pasted "123 456" (codeDigits keeps six).
        onPaste={(e) => { e.preventDefault(); change(e.clipboardData.getData("text")); }}
      />
    </label>
  );
}
