const COLORS = [
  "bg-accent-100 text-accent-700",
  "bg-sage-100 text-sage-700",
  "bg-amber-100 text-amber-800",
  "bg-rust-100 text-rust-700",
  "bg-stone-200 text-stone-700",
];

// Deterministic so the same name always lands on the same color, without
// needing to persist a color choice anywhere.
function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const SIZES = {
  sm: { box: "h-7 w-7", text: "text-[10px]" },
  md: { box: "h-9 w-9", text: "text-xs" },
} as const;

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const { box, text } = SIZES[size];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 font-semibold ${box} ${text} ${colorForName(name)}`}
    >
      {initials(name)}
    </span>
  );
}
