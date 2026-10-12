import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BackToAppLink } from "@/components/BackToAppLink";
import { SupportRequestForm } from "@/components/SupportRequestForm";

export const metadata = { title: "Support — Handled" };

export default async function SupportPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-medium text-accent-600">
            Handled
          </Link>
          <BackToAppLink loggedIn={!!user} />
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-6 sm:p-8 space-y-6 text-sm text-stone-700 leading-relaxed">
          <div>
            <h1 className="font-display text-2xl font-medium text-stone-900">Support</h1>
            <p className="text-xs text-stone-400 mt-1">Questions, billing issues, or something not working as expected.</p>
          </div>

          {user ? (
            <section className="space-y-3">
              <h2 className="font-medium text-stone-900">Send us a message</h2>
              <SupportRequestForm />
            </section>
          ) : (
            <section className="space-y-2">
              <p>
                Email{" "}
                {/* Placeholder until a domain exists (deliberately deferred - see
                    memory). Swap for a dedicated support address once one exists. */}
                <a href="mailto:godwin.sql@gmail.com" className="text-accent-600 underline hover:text-accent-700">
                  godwin.sql@gmail.com
                </a>{" "}
                and we'll get back to you — typically within a day or two. The form on this page is only available
                once you're signed in.
              </p>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Billing</h2>
            <p>
              For plan changes, payment methods, or invoices, use{" "}
              <Link href="/billing" className="text-accent-600 underline hover:text-accent-700">
                Manage billing
              </Link>{" "}
              from your account — it opens Stripe's billing portal where you can handle most things yourself without
              waiting on a reply.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Security concerns</h2>
            <p>
              If you believe your account or household data has been compromised, email{" "}
              <a href="mailto:godwin.sql@gmail.com" className="text-accent-600 underline hover:text-accent-700">
                godwin.sql@gmail.com
              </a>{" "}
              right away rather than using the form above, and include as much detail as you can — what you noticed
              and when.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
