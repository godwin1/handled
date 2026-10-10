import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logOut } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { ReminderSync } from "@/components/ReminderSync";
import { canView, type Category } from "@/lib/permissions";

const NAV: { href: string; label: string; category?: Category }[] = [
  { href: "/dashboard", label: "This week" },
  { href: "/documents", label: "Documents", category: "documents" },
  { href: "/tasks", label: "Tasks", category: "tasks" },
  { href: "/people", label: "People", category: "people" },
  { href: "/assets", label: "Assets", category: "assets" },
  { href: "/accounts", label: "Accounts", category: "accounts" },
  { href: "/search", label: "Search" },
  { href: "/household", label: "Household" },
  { href: "/billing", label: "Billing" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const nav = NAV.filter((item) => !item.category || canView(user, item.category));

  const openTasks = await prisma.task.findMany({
    where: { householdId: user.householdId, status: "OPEN" },
    select: { id: true, title: true, type: true, dueDate: true },
  });
  const reminderTasks = openTasks.map((t) => ({ ...t, dueDate: t.dueDate.toISOString() }));

  return (
    <div className="min-h-screen bg-background">
      <ReminderSync tasks={reminderTasks} />
      <header className="border-b border-stone-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-7">
            <Link href="/dashboard" className="font-display text-xl font-medium text-accent-600">
              Handled
            </Link>
            <nav className="hidden sm:flex items-center gap-5 text-sm text-stone-600">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-accent-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <span className="hidden lg:inline text-stone-400 whitespace-nowrap max-w-[12rem] truncate">
              {user.household.name}
            </span>
            <Link href="/account" className="hover:text-accent-600 transition-colors">
              Account
            </Link>
            <form action={logOut}>
              <button type="submit" className="hover:text-accent-600 transition-colors">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex sm:hidden items-center gap-4 text-sm text-stone-600 px-4 pb-3 overflow-x-auto">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent-600 whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-8 text-xs text-stone-400 space-x-3">
        <Link href="/terms" className="hover:text-stone-600 underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-stone-600 underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
