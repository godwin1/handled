const COLORS: Record<string, string> = {
  pay: "bg-sage-100 text-sage-700",
  renew: "bg-accent-100 text-accent-700",
  cancel: "bg-stone-100 text-stone-600",
  book: "bg-amber-100 text-amber-800",
  submit: "bg-stone-700 text-stone-50",
  call: "bg-rust-100 text-rust-700",
  bill: "bg-amber-100 text-amber-800",
  id: "bg-accent-100 text-accent-700",
  contract: "bg-sage-100 text-sage-700",
  warranty: "bg-amber-100 text-amber-800",
  receipt: "bg-stone-100 text-stone-600",
  medical: "bg-rust-100 text-rust-700",
  other: "bg-stone-100 text-stone-700",
};

export function Badge({ label }: { label: string }) {
  const color = COLORS[label] ?? COLORS.other;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${color}`}>
      {label}
    </span>
  );
}
