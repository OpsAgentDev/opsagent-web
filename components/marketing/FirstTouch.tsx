"use client";
import { useEffect } from "react";
import { recordFirstTouch } from "@/lib/source";

/** Remembers where a visitor first came from, for the sign-up source. Renders nothing. */
export function FirstTouch() {
  useEffect(() => recordFirstTouch(new URL(location.href), document.referrer), []);
  return null;
}
