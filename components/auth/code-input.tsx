"use client";
import { useState } from "react";
import { codeDigits } from "@/lib/auth-errors";

// One input, not six boxes: one-time-code autofill and pasting "123 456" both just work.
export function CodeInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <label className="auth-code">
      6-digit code
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        autoFocus
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d\s-]/g, "");
          setValue(v);
          if (codeDigits(v).length === 6) onComplete(codeDigits(v));
        }}
      />
    </label>
  );
}
