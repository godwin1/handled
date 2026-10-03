export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-stone-900">Handled</h1>
          <p className="mt-1 text-sm text-stone-500">Nothing important slips.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
