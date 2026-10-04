import { RecoverTwoFactorConfirm } from "@/components/RecoverTwoFactorConfirm";

export default async function RecoverTwoFactorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Recover your account</h2>
      <RecoverTwoFactorConfirm token={token} />
    </div>
  );
}
