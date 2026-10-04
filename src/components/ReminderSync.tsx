"use client";

import { useEffect } from "react";
import { syncReminders, syncPushRegistration, type ReminderTask } from "@/lib/notifications";

export function ReminderSync({ tasks }: { tasks: ReminderTask[] }) {
  useEffect(() => {
    syncReminders(tasks).catch(() => {});
  }, [tasks]);

  useEffect(() => {
    syncPushRegistration().catch(() => {});
  }, []);

  return null;
}
