import { Resend } from "resend";

// Sandbox sender: without a verified domain, Resend only delivers mail sent
// from this address, and only to the email the Resend account itself was
// signed up with. Swap to a verified-domain address (e.g.
// reminders@yourdomain.com) once one is added to unlock delivery to any
// household member.
const FROM = "Handled <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export type DigestItem = {
  title: string;
  dueLabel: string;
  overdue: boolean;
};

export async function sendDigestEmail(params: {
  to: string;
  recipientName: string;
  householdName: string;
  overdueItems: DigestItem[];
  dueThisWeekItems: DigestItem[];
  pendingDocuments: number;
  dashboardUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: "RESEND_API_KEY not configured" };
  }

  const { to, recipientName, householdName, overdueItems, dueThisWeekItems, pendingDocuments, dashboardUrl } = params;
  const totalCount = overdueItems.length + dueThisWeekItems.length;

  const renderItem = (item: DigestItem) =>
    `<li style="margin-bottom:4px;${item.overdue ? "color:#dc2626;" : ""}">${escapeHtml(item.title)} — ${escapeHtml(
      item.dueLabel
    )}</li>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h2 style="margin-bottom:4px;">This week for ${escapeHtml(householdName)}</h2>
      <p style="color:#78716c;font-size:14px;margin-top:0;">
        ${totalCount} thing${totalCount === 1 ? "" : "s"} need${totalCount === 1 ? "s" : ""} attention.
      </p>
      ${
        overdueItems.length > 0
          ? `<h3 style="font-size:14px;margin-bottom:4px;">Overdue</h3><ul style="padding-left:18px;font-size:14px;">${overdueItems
              .map(renderItem)
              .join("")}</ul>`
          : ""
      }
      ${
        dueThisWeekItems.length > 0
          ? `<h3 style="font-size:14px;margin-bottom:4px;">Due this week</h3><ul style="padding-left:18px;font-size:14px;">${dueThisWeekItems
              .map(renderItem)
              .join("")}</ul>`
          : ""
      }
      ${
        pendingDocuments > 0
          ? `<p style="font-size:14px;">${pendingDocuments} document${pendingDocuments === 1 ? "" : "s"} waiting for review.</p>`
          : ""
      }
      <p style="margin-top:20px;">
        <a href="${dashboardUrl}" style="background:#1c1917;color:white;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:14px;">Open Handled</a>
      </p>
      <p style="color:#a8a29e;font-size:12px;margin-top:24px;">Hi ${escapeHtml(recipientName)} — you're getting this because you're part of ${escapeHtml(
        householdName
      )} on Handled.</p>
    </div>
  `;

  const result = await getClient().emails.send({
    from: FROM,
    to,
    subject: `${totalCount} thing${totalCount === 1 ? "" : "s"} due this week`,
    html,
  });

  return result;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
