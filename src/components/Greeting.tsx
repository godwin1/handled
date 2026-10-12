"use client";

import { useEffect, useState } from "react";

// Computed in the browser, not the server: the dashboard page server
// component runs on Vercel in UTC, so a server-computed "Good morning"
// would reflect UTC's hour, not the visitor's actual local time. Starts
// as null so the server and first client render match exactly (no
// hydration warning), then fills in once mounted.
export function Greeting({ firstName }: { firstName: string }) {
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <p className="font-display text-base text-accent-600 mb-1">
      {timeOfDay ?? "Hello"}, {firstName}
    </p>
  );
}
