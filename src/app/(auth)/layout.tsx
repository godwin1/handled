import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
          <p className="mt-2 text-sm text-stone-500">Nothing important slips.</p>
        </div>
        {children}
      </div>
      <p className="mt-10 text-xs text-stone-400 text-center space-x-3">
        <Link href="/terms" className="hover:text-stone-600 underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-stone-600 underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
