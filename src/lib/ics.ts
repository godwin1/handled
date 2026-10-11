// RFC 5545 escaping - backslash first, so it doesn't double-escape the
// characters escaped after it.
function escapeICSText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export type ICSEvent = { uid: string; title: string; date: Date; description?: string };

// All-day events: DTEND is exclusive per spec, so a single-day event's end
// is the next calendar day, not the same day repeated.
export function buildICS(calendarName: string, events: ICSEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Handled//Household Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
  ];

  for (const e of events) {
    const end = new Date(e.date);
    end.setDate(end.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@handled.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatDateOnly(e.date)}`,
      `DTEND;VALUE=DATE:${formatDateOnly(end)}`,
      `SUMMARY:${escapeICSText(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${escapeICSText(e.description)}`] : []),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
