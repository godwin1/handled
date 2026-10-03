"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type ReminderTask = {
  id: string;
  title: string;
  type: string;
  dueDate: string; // ISO
};

const STORAGE_KEY = "handled:scheduledReminders";

// Renewals (and anything with a hard lapse date) get warned well ahead, per
// the product spec's 90/30/7-day cadence. Everything else just needs a
// nudge in the days right before it's due.
const OFFSET_DAYS: Record<string, number[]> = {
  renew: [90, 30, 7, 0],
  other: [3, 0],
};

function offsetsFor(type: string) {
  return OFFSET_DAYS[type] ?? OFFSET_DAYS.other;
}

// Local notification ids must be 32-bit ints; derive one deterministically
// from the task id + offset so re-syncing never double-schedules.
function hashToId(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function loadScheduledMap(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveScheduledMap(map: Record<string, number[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

/**
 * Reconciles on-device local notifications against the household's current
 * open tasks: cancels reminders for tasks that are done/deleted, and
 * schedules reminders for newly-seen tasks. Safe to call on every page load.
 * No-ops outside a native Capacitor shell (web has no local notification API).
 */
export async function syncReminders(tasks: ReminderTask[]) {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== "granted") return;
  }

  const scheduledMap = loadScheduledMap();
  const currentTaskIds = new Set(tasks.map((t) => t.id));

  const toCancel: { id: number }[] = [];
  for (const taskId of Object.keys(scheduledMap)) {
    if (!currentTaskIds.has(taskId)) {
      toCancel.push(...scheduledMap[taskId].map((id) => ({ id })));
      delete scheduledMap[taskId];
    }
  }
  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel });
  }

  const toSchedule: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
  }[] = [];

  for (const task of tasks) {
    if (scheduledMap[task.id]) continue; // already scheduled

    const due = new Date(task.dueDate);
    const ids: number[] = [];

    for (const offset of offsetsFor(task.type)) {
      const fireDate = new Date(due);
      fireDate.setDate(fireDate.getDate() - offset);
      fireDate.setHours(9, 0, 0, 0);
      if (fireDate.getTime() <= Date.now()) continue;

      const notifId = hashToId(`${task.id}:${offset}`);
      ids.push(notifId);
      toSchedule.push({
        id: notifId,
        title: offset === 0 ? `Due today: ${task.title}` : `${task.title} — due in ${offset}d`,
        body: task.title,
        schedule: { at: fireDate },
      });
    }

    if (ids.length > 0) scheduledMap[task.id] = ids;
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }

  saveScheduledMap(scheduledMap);
}
