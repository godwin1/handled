"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logOut } from "@/lib/actions/auth";

export function SettingsMenu({ householdName }: { householdName: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-accent-600 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        Settings
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-stone-200 shadow-lg py-1 z-20">
          <p className="px-3 py-1.5 text-xs text-stone-400 truncate">{householdName}</p>
          <Link
            href="/household"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Household
          </Link>
          <Link
            href="/billing"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Billing
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Account
          </Link>
          <div className="border-t border-stone-100 mt-1 pt-1">
            <form action={logOut}>
              <button type="submit" className="w-full text-left px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50">
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
