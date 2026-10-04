// Lightweight heuristic label, not a full UA parser - good enough to help
// someone recognize "is this my phone or a stranger" in a session list.
export function friendlyUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua) && !/Chrome/.test(ua)
          ? "Safari"
          : "Browser";

  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iOS/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";

  return os ? `${browser} on ${os}` : browser;
}
