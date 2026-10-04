"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken } from "@/lib/actions/push";
import { FcmToken } from "@/lib/nativePlugins";

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

let pushListenersAttached = false;

/**
 * Requests push permission and registers this device's FCM token with the
 * server, so it can receive server-triggered pushes (daily digest, task
 * assignment) in addition to the locally-scheduled reminders above - those
 * only fire for due dates already known at the device's last sync, while
 * these can reach a device that hasn't opened the app in a while.
 * No-ops outside a native Capacitor shell.
 */
export async function syncPushRegistration() {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    const req = await PushNotifications.requestPermissions();
    if (req.receive !== "granted") return;
  }

  if (!pushListenersAttached) {
    pushListenersAttached = true;

    PushNotifications.addListener("registration", async (token) => {
      // Android's token here is already a real FCM token. iOS's is the raw
      // APNs token - swap it for the real FCM one via FcmTokenPlugin, which
      // by now can resolve it since AppDelegate set apnsToken before this
      // event fired.
      if (Capacitor.getPlatform() === "ios") {
        try {
          const { token: fcmToken } = await FcmToken.getToken();
          await registerPushToken(fcmToken, "ios");
        } catch (err) {
          console.error("Failed to resolve FCM token on iOS:", err);
        }
      } else {
        await registerPushToken(token.value, "android").catch(() => {});
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration failed:", err);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = action.notification.data?.url as string | undefined;
      if (url) window.location.href = url;
    });
  }

  await PushNotifications.register();
}
