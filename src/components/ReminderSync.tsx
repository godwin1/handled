"use client";

import { useEffect } from "react";
import { syncReminders, type ReminderTask } from "@/lib/notifications";

export function ReminderSync({ tasks }: { tasks: ReminderTask[] }) {
  useEffect(() => {
    syncReminders(tasks).catch(() => {});
  }, [tasks]);

  return null;
}
