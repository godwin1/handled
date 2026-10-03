import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Choose a new password</h2>
      <ResetPasswordForm token={token} />
    </div>
  );
}
