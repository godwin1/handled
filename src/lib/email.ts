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

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: "RESEND_API_KEY not configured" };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h2 style="margin-bottom:4px;">Reset your password</h2>
      <p style="font-size:14px;color:#78716c;">
        Someone requested a password reset for your Handled account. If this wasn't you, ignore this email.
      </p>
      <p style="margin-top:20px;">
        <a href="${params.resetUrl}" style="background:#1c1917;color:white;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:14px;">Reset password</a>
      </p>
      <p style="color:#a8a29e;font-size:12px;margin-top:24px;">This link expires in 1 hour.</p>
    </div>
  `;

  return getClient().emails.send({
    from: FROM,
    to: params.to,
    subject: "Reset your Handled password",
    html,
  });
}

export async function sendInviteEmail(params: {
  to: string;
  inviterName: string;
  householdName: string;
  inviteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: "RESEND_API_KEY not configured" };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h2 style="margin-bottom:4px;">You're invited to ${escapeHtml(params.householdName)}</h2>
      <p style="font-size:14px;color:#78716c;">
        ${escapeHtml(params.inviterName)} invited you to join their household on Handled — you'll share the same
        dashboard, tasks, and documents.
      </p>
      <p style="margin-top:20px;">
        <a href="${params.inviteUrl}" style="background:#1c1917;color:white;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:14px;">Join household</a>
      </p>
      <p style="color:#a8a29e;font-size:12px;margin-top:24px;">This link expires in 7 days and works once.</p>
    </div>
  `;

  return getClient().emails.send({
    from: FROM,
    to: params.to,
    subject: `${params.inviterName} invited you to ${params.householdName} on Handled`,
    html,
  });
}

export async function sendLoginAlertEmail(params: {
  to: string;
  recipientName: string;
  ipAddress: string;
  userAgent: string;
  when: Date;
}) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: "RESEND_API_KEY not configured" };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h2 style="margin-bottom:4px;">New sign-in to your account</h2>
      <p style="font-size:14px;color:#78716c;">
        Hi ${escapeHtml(params.recipientName)}, your Handled account was just signed into from a new location.
      </p>
      <table style="font-size:13px;color:#44403c;margin-top:12px;">
        <tr><td style="padding-right:12px;color:#a8a29e;">When</td><td>${escapeHtml(params.when.toUTCString())}</td></tr>
        <tr><td style="padding-right:12px;color:#a8a29e;">IP address</td><td>${escapeHtml(params.ipAddress)}</td></tr>
        <tr><td style="padding-right:12px;color:#a8a29e;">Device</td><td>${escapeHtml(params.userAgent)}</td></tr>
      </table>
      <p style="color:#78716c;font-size:13px;margin-top:20px;">
        If this was you, no action is needed. If it wasn't, reset your password immediately and review your active
        sessions from Account settings.
      </p>
    </div>
  `;

  return getClient().emails.send({
    from: FROM,
    to: params.to,
    subject: "New sign-in to your Handled account",
    html,
  });
}

export async function sendTwoFactorRecoveryEmail(params: { to: string; recoveryUrl: string }) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: "RESEND_API_KEY not configured" };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917;">
      <h2 style="margin-bottom:4px;">Turn off two-factor authentication</h2>
      <p style="font-size:14px;color:#78716c;">
        You requested this because you lost access to your authenticator app and backup codes. Clicking the link
        below will disable two-factor authentication on your account so you can sign back in.
      </p>
      <p style="margin-top:20px;">
        <a href="${params.recoveryUrl}" style="background:#1c1917;color:white;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:14px;">Disable two-factor authentication</a>
      </p>
      <p style="color:#78716c;font-size:13px;margin-top:20px;">
        If you didn't request this, ignore this email — your account stays protected and this link will simply
        expire.
      </p>
      <p style="color:#a8a29e;font-size:12px;margin-top:12px;">This link expires in 1 hour and works once.</p>
    </div>
  `;

  return getClient().emails.send({
    from: FROM,
    to: params.to,
    subject: "Disable two-factor authentication on your Handled account",
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
