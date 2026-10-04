import Link from "next/link";

export const metadata = { title: "Privacy Policy — Handled" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="font-display text-xl font-medium text-accent-600">
          Handled
        </Link>

        <div className="mt-8 bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-stone-700 leading-relaxed">
          <div>
            <h1 className="font-display text-2xl font-medium text-stone-900">Privacy Policy</h1>
            <p className="text-xs text-stone-400 mt-1">Last updated October 4, 2026</p>
          </div>

          <section className="space-y-2">
            <p>
              This explains what information Handled collects, why, and who it's shared with. Handled is a household
              organization tool, so most of what it stores is information you and your household members choose to
              enter.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Account info</span> — name, email, and a hashed (never plaintext) password.</li>
              <li><span className="font-medium">Household data</span> — people, assets, accounts, tasks, and documents you or your household members enter or upload, plus details extracted from those documents (amounts, due dates, policy numbers, and similar).</li>
              <li><span className="font-medium">Security data</span> — session tokens, sign-in device and IP address (so you can recognize and revoke sessions), and, if you enable it, an encrypted two-factor authentication secret and hashed backup codes.</li>
              <li><span className="font-medium">Activity log</span> — a record of changes to shared household data (what changed and who changed it), visible to household admins.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">How we use it</h2>
            <p>
              Solely to run the service for you and your household: showing your dashboard, sending task reminders
              and security alerts, and extracting structured details from documents you upload so you don't have to
              enter them by hand. We don't sell your data or use it to serve ads.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Who we share it with</h2>
            <p>Handled relies on a small number of service providers to work, each handling only what it needs to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Anthropic</span> — processes uploaded document images/PDFs to extract structured details (merchant, amount, due date, etc.).</li>
              <li><span className="font-medium">Resend</span> — delivers transactional email: task digests, password resets, invites, and security alerts.</li>
              <li><span className="font-medium">Vercel</span> — hosts the application, database, and uploaded document files.</li>
            </ul>
            <p>We don't share your data with anyone else, except where required by law.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Who can see your household's data</h2>
            <p>
              Only members of your household. An admin can restrict what a given member can view or edit per
              category (people, assets, accounts, documents, tasks), but admins always retain full access, and only
              admins can view the household's activity log.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Security</h2>
            <p>
              Passwords are hashed, not stored in plaintext. Two-factor authentication secrets are encrypted at
              rest. Uploaded documents are stored privately and served only to authenticated household members.
              Sign-in attempts and sensitive actions are rate-limited. You can review and revoke your active
              sessions from your account page at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Data retention and deletion</h2>
            <p>
              We keep your data for as long as your account or household exists. Removing a member from a household
              deletes their login credentials; the household's shared data (documents, tasks, etc.) stays unless an
              admin deletes it. If you'd like your account or household's data fully deleted, contact whoever
              manages your household's Handled account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Children</h2>
            <p>
              Handled isn't directed at children, though a household may include profiles for children created and
              managed by an adult household member (e.g. to track a child's documents or tasks). We don't knowingly
              collect account login credentials from children.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Changes to this policy</h2>
            <p>We may update this policy as the service changes. Material changes will be reflected here with an updated date.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium text-stone-900">Questions</h2>
            <p>
              See our <Link href="/terms" className="text-accent-600 underline hover:text-accent-700">Terms of Service</Link>{" "}
              for the rules of using Handled, or contact whoever manages your household's Handled account with
              privacy questions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
