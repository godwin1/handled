import type { CapacitorConfig } from "@capacitor/cli";

// Handled runs as a server-rendered Next.js app (sessions, server actions,
// file uploads, SQLite/Prisma) — it can't be statically exported into the
// app bundle. The native shell instead loads the hosted app over HTTPS, the
// same way a browser would; `webDir` just needs to exist for `cap sync`.
//
// Point CAPACITOR_SERVER_URL at:
//   - your LAN IP (e.g. http://192.168.1.23:3000) to test against `npm run dev`
//     from a device/emulator on the same network
//   - the deployed production URL before shipping a store build
const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.handled.app",
  appName: "Handled",
  webDir: "www",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
      }
    : undefined,
};

export default config;
