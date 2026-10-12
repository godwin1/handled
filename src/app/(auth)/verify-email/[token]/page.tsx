import { VerifyEmailConfirm } from "@/components/VerifyEmailConfirm";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Confirm your email</h2>
      <VerifyEmailConfirm token={token} />
    </div>
  );
}
