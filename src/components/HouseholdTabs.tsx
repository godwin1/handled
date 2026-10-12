"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/household", label: "Members" },
  { href: "/household/invite", label: "Invite" },
  { href: "/household/calendar", label: "Calendar" },
  { href: "/household/emergency-access", label: "Emergency access", adminOnly: true },
  { href: "/household/audit-log", label: "Activity log", adminOnly: true },
];

export function HouseholdTabs({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <nav className="flex gap-1 border-b border-stone-200 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              active ? "border-accent-600 text-accent-700 font-medium" : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
