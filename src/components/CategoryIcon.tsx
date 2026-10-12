import {
  Wallet,
  RefreshCw,
  XCircle,
  CalendarDays,
  Send,
  Phone,
  Receipt,
  IdCard,
  FileText,
  ShieldCheck,
  HeartPulse,
  Tag,
  Zap,
  Wifi,
  Landmark,
  GraduationCap,
  Home,
  Building2,
  Car,
  Bike,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

// Same category keys and color families as Badge.tsx, so an icon and its
// text label always read as the same category wherever they appear together.
const ICONS: Record<string, LucideIcon> = {
  pay: Wallet,
  renew: RefreshCw,
  cancel: XCircle,
  book: CalendarDays,
  submit: Send,
  call: Phone,
  bill: Receipt,
  id: IdCard,
  contract: FileText,
  warranty: ShieldCheck,
  receipt: Receipt,
  medical: HeartPulse,
  other: Tag,
  utility: Zap,
  internet: Wifi,
  insurance: ShieldCheck,
  bank: Landmark,
  school: GraduationCap,
  home: Home,
  rental: Building2,
  car: Car,
  scooter: Bike,
  phone: Smartphone,
};

const COLORS: Record<string, string> = {
  pay: "bg-sage-100 text-sage-700",
  renew: "bg-accent-100 text-accent-700",
  cancel: "bg-stone-100 text-stone-600",
  book: "bg-amber-100 text-amber-800",
  submit: "bg-stone-200 text-stone-700",
  call: "bg-rust-100 text-rust-700",
  bill: "bg-amber-100 text-amber-800",
  id: "bg-accent-100 text-accent-700",
  contract: "bg-sage-100 text-sage-700",
  warranty: "bg-amber-100 text-amber-800",
  receipt: "bg-stone-100 text-stone-600",
  medical: "bg-rust-100 text-rust-700",
  other: "bg-stone-100 text-stone-700",
  utility: "bg-amber-100 text-amber-800",
  internet: "bg-accent-100 text-accent-700",
  insurance: "bg-sage-100 text-sage-700",
  bank: "bg-stone-100 text-stone-600",
  school: "bg-accent-100 text-accent-700",
  home: "bg-sage-100 text-sage-700",
  rental: "bg-accent-100 text-accent-700",
  car: "bg-stone-100 text-stone-600",
  scooter: "bg-amber-100 text-amber-800",
  phone: "bg-rust-100 text-rust-700",
};

const SIZES = {
  sm: { box: "h-7 w-7", icon: 14 },
  md: { box: "h-9 w-9", icon: 17 },
} as const;

export function CategoryIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const Icon = ICONS[type] ?? Tag;
  const color = COLORS[type] ?? COLORS.other;
  const { box, icon } = SIZES[size];
  return (
    <span className={`inline-flex items-center justify-center rounded-full shrink-0 ${box} ${color}`}>
      <Icon size={icon} strokeWidth={2} />
    </span>
  );
}
