"use client";
import { useEffect, type RefObject } from "react";

/** While `open`: Escape closes and returns focus to `button`; a click outside `root` closes. Shared by the drawer and the organisation switcher. */
export function useDismiss(open: boolean, close: () => void, root: RefObject<HTMLElement | null>, button: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      button.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs and `close` are stable for the open period.
  }, [open]);
}
