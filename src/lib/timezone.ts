// Task/document dates are stored as bare calendar dates (parsed from a
// <input type="date"> value, so always UTC midnight of the intended day -
// see uploadDocument/createTask). "Today" for comparing against them needs
// to be the visitor's actual local calendar date, not the server's - a
// server-local startOfToday() is wrong for most users for several hours a
// day, since Vercel's functions run in UTC.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timezone);
  if (!formatter) {
    // en-CA formats as YYYY-MM-DD, which parses back as UTC midnight of
    // that date - exactly the format task/document dates are stored in.
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatterCache.set(timezone, formatter);
  }
  return formatter;
}

export function startOfTodayFor(timezone: string | null | undefined): Date {
  const tz = timezone || "UTC";
  try {
    const dateStr = getFormatter(tz).format(new Date());
    return new Date(`${dateStr}T00:00:00.000Z`);
  } catch {
    // Unrecognized timezone string (shouldn't happen via the capture flow,
    // but a stored value could predate a validation fix) - fall back
    // rather than let a page 500.
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

// Guards against trusting an arbitrary client-supplied string outright -
// only store it if Intl actually recognizes it as a real IANA timezone.
export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
