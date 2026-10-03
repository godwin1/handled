import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logOut } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { ReminderSync } from "@/components/ReminderSync";

const NAV = [
  { href: "/dashboard", label: "This week" },
  { href: "/documents", label: "Documents" },
  { href: "/tasks", label: "Tasks" },
  { href: "/people", label: "People" },
  { href: "/assets", label: "Assets" },
  { href: "/accounts", label: "Accounts" },
  { href: "/search", label: "Search" },
  { href: "/household", label: "Household" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const openTasks = await prisma.task.findMany({
    where: { householdId: user.householdId, status: "OPEN" },
    select: { id: true, title: true, type: true, dueDate: true },
  });
  const reminderTasks = openTasks.map((t) => ({ ...t, dueDate: t.dueDate.toISOString() }));

  return (
    <div className="min-h-screen bg-stone-50">
      <ReminderSync tasks={reminderTasks} />
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-stone-900">
              Handled
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-stone-600">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-stone-900">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span className="hidden sm:inline">{user.household.name}</span>
            <form action={logOut}>
              <button type="submit" className="hover:text-stone-900">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex sm:hidden items-center gap-4 text-sm text-stone-600 px-4 pb-2 overflow-x-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-stone-900 whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
