import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildICS, type ICSEvent } from "@/lib/ics";

// Unauthenticated by design, like the document share links - the token
// itself is the credential, since calendar apps can't carry a session
// cookie when they poll this URL on their own schedule.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const household = await prisma.household.findUnique({
    where: { calendarToken: token },
    select: { id: true, name: true },
  });
  if (!household) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [tasks, documents] = await Promise.all([
    prisma.task.findMany({
      where: { householdId: household.id, status: "OPEN" },
      select: { id: true, title: true, dueDate: true, type: true },
    }),
    prisma.document.findMany({
      where: {
        householdId: household.id,
        status: { not: "SUPERSEDED" },
        OR: [{ dueDate: { not: null } }, { expiryDate: { not: null } }],
      },
      select: { id: true, title: true, dueDate: true, expiryDate: true },
    }),
  ]);

  const events: ICSEvent[] = [];
  for (const task of tasks) {
    events.push({ uid: `task-${task.id}`, title: task.title, date: task.dueDate, description: `Handled task (${task.type})` });
  }
  for (const doc of documents) {
    if (doc.dueDate) events.push({ uid: `doc-due-${doc.id}`, title: `Due: ${doc.title}`, date: doc.dueDate });
    if (doc.expiryDate) events.push({ uid: `doc-expiry-${doc.id}`, title: `Expires: ${doc.title}`, date: doc.expiryDate });
  }

  const ics = buildICS(`${household.name} (Handled)`, events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="handled.ics"',
      "Cache-Control": "private, max-age=1800",
    },
  });
}
