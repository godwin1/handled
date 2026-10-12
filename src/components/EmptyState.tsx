import { Inbox, type LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, label }: { icon?: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="flex items-center justify-center h-10 w-10 rounded-full bg-stone-100 text-stone-400">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <p className="text-sm text-stone-400">{label}</p>
    </div>
  );
}
