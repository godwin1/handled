const COLORS: Record<string, string> = {
  pay: "bg-amber-100 text-amber-800",
  renew: "bg-blue-100 text-blue-800",
  cancel: "bg-stone-100 text-stone-700",
  book: "bg-purple-100 text-purple-800",
  submit: "bg-teal-100 text-teal-800",
  call: "bg-pink-100 text-pink-800",
  bill: "bg-amber-100 text-amber-800",
  id: "bg-blue-100 text-blue-800",
  contract: "bg-purple-100 text-purple-800",
  warranty: "bg-teal-100 text-teal-800",
  receipt: "bg-stone-100 text-stone-700",
  medical: "bg-pink-100 text-pink-800",
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
