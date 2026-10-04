import { redirect } from "next/navigation";
import { getPendingTwoFactorUser } from "@/lib/auth";
import { VerifyCodeForm } from "@/components/VerifyCodeForm";

export default async function LoginVerifyPage() {
  const pending = await getPendingTwoFactorUser();
  if (!pending) redirect("/login");

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-stone-900 mb-1">Two-factor verification</h2>
      <p className="text-sm text-stone-500 mb-4">
        Enter the 6-digit code from your authenticator app, or one of your backup codes.
      </p>
      <VerifyCodeForm />
    </div>
  );
}
