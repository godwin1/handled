export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
          <p className="mt-2 text-sm text-stone-500">Nothing important slips.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
