import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { decryptSecret, buildOtpauthUrl } from "@/lib/totp";
import { ConfirmEnrollmentForm } from "@/components/ConfirmEnrollmentForm";
import { cancelEnrollment } from "@/lib/actions/twoFactor";

export default async function EnrollTwoFactorPage() {
  const user = await requireUser();
  // Only gated on having a secret to show - not on totpEnabled. Next.js
  // refreshes this server component right after confirmEnrollment resolves
  // (even though that action never redirects), so a totpEnabled check here
  // would fire the instant enrollment succeeds and bounce the user away
  // before they ever see their backup codes.
  if (!user.totpSecret) redirect("/account");

  const secret = decryptSecret(user.totpSecret);
  const otpauthUrl = buildOtpauthUrl({ secret, email: user.email });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Set up two-factor authentication</h1>
        <p className="text-sm text-stone-500 mt-1">
          Scan this with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit
          code it shows.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-4">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Scan with your authenticator app" width={220} height={220} />
        </div>
        <details className="text-xs text-stone-500">
          <summary className="cursor-pointer hover:text-stone-900">Can&apos;t scan? Enter manually</summary>
          <p className="mt-2 font-mono break-all bg-stone-50 rounded-md p-2 text-stone-700">{secret}</p>
        </details>

        <ConfirmEnrollmentForm />

        <form action={cancelEnrollment}>
          <button type="submit" className="text-xs text-stone-500 hover:text-stone-900">
            Cancel
          </button>
        </form>
      </section>
    </div>
  );
}
