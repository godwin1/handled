"use client";

import { useEffect, useRef } from "react";

// Set after mount, not in the render body - computing it inline would
// differ between the server's render (always empty/UTC) and the
// browser's, triggering a hydration mismatch on this input's value.
export function TimezoneField() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (ref.current) ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      // Intl unsupported - timezone just stays unset, falls back to UTC server-side.
    }
  }, []);

  return <input ref={ref} type="hidden" name="timezone" />;
}
