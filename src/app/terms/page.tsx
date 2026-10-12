import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BackToAppLink } from "@/components/BackToAppLink";

export const metadata = { title: "Terms of Service — Handled" };

export default async function TermsPage() {
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
            <h1 className="font-display text-2xl font-medium text-stone-900">Terms of Service</h1>
            <p className="text-xs text-stone-400 mt-1">Last updated October 12, 2026</p>
          </div>

          <section className="space-y-2">
            <p>
              Handled is a household organization tool for tracking documents, bills, renewals, and tasks shared
              between the members of a household. By creating an account or accepting an invite, you agree to these
              terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Your account and household</h2>
            <p>
              You're responsible for the accuracy of the information you enter and for keeping your password and
              any two-factor authentication method secure. Anyone you invite into your household can see and, unless
              you restrict their permissions, edit the data in that household — only invite people you trust with
              that information.
            </p>
            <p>
              The person who creates a household starts as its admin and can manage other members' permissions and
              admin status. A household must always have at least one admin.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Your content</h2>
            <p>
              You keep ownership of the documents, notes, and other information you upload or enter ("your content").
              You're solely responsible for it, including making sure you have the right to upload any document you
              add. We use your content only to provide the service back to you and your household — to extract
              details from uploaded documents, generate reminders, and display your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Billing and subscriptions</h2>
            <p>
              Handled offers a free tier and paid Plus/Family subscriptions, billed monthly or annually through
              Stripe. By subscribing, you authorize recurring charges to your payment method until you cancel.
            </p>
            <p>
              You can cancel anytime from the Billing page, which opens Stripe&rsquo;s secure billing portal — no
              need to contact us. Your paid access continues through the end of the period you&rsquo;ve already paid
              for; we don&rsquo;t prorate or refund partial periods except where required by law or at our
              discretion. When a subscription ends, the household drops to the Free tier&rsquo;s limits going
              forward — existing people, assets, accounts, tasks, and documents aren&rsquo;t deleted, but adding
              more beyond the Free tier&rsquo;s limits, and any Plus/Family-only features, become unavailable until
              you resubscribe.
            </p>
            <p>Prices are shown before you subscribe and may change with notice; changes don&rsquo;t apply retroactively to a period you&rsquo;ve already paid for.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Acceptable use</h2>
            <p>
              Don't use Handled to store or share content you don't have the right to, to attempt to access another
              household's data, or to interfere with the normal operation of the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">No warranty</h2>
            <p>
              Handled is provided as-is. Document extraction is automated and can make mistakes — always check
              extracted dates, amounts, and other details before relying on them, especially for anything with a
              real deadline or financial consequence. We don't guarantee the service will be uninterrupted,
              error-free, or available at all times.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Handled and its operator aren't liable for any indirect,
              incidental, or consequential damages arising from your use of the service, including missed deadlines,
              late payments, or lost or inaccurate data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Ending your account</h2>
            <p>
              You can stop using Handled at any time. An admin can remove members from a household, and members can
              ask an admin to remove them. Removing a member deletes their login but not the household's shared
              data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Changes to these terms</h2>
            <p>
              We may update these terms as the service changes. Continuing to use Handled after an update means you
              accept the revised terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Questions</h2>
            <p>
              See our <Link href="/privacy" className="text-accent-600 underline hover:text-accent-700">Privacy Policy</Link>{" "}
              for how your data is handled, or contact whoever manages your household's Handled account with
              questions about these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
