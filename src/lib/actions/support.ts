"use server";

import { requireUser } from "@/lib/auth";
import { sendSupportRequestEmail } from "@/lib/email";
import { isRateLimited, recordAttempt } from "@/lib/rateLimit";

const TOPICS = ["general", "billing", "security", "bug"];

export async function submitSupportRequest(
  _prevState: { sent?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ sent?: boolean; error?: string }> {
  const user = await requireUser();

  const topicRaw = String(formData.get("topic") || "general");
  const topic = TOPICS.includes(topicRaw) ? topicRaw : "general";
  const message = String(formData.get("message") || "").trim();
  if (!message) {
    return { error: "Please enter a message." };
  }

  const rateLimitKey = `support:${user.id}`;
  if (await isRateLimited(rateLimitKey, 5, 60)) {
    return { error: "You've sent several requests recently. Please wait a bit before sending another." };
  }
  await recordAttempt(rateLimitKey);

  await sendSupportRequestEmail({
    fromName: user.name,
    fromEmail: user.email,
    householdName: user.household.name,
    topic,
    message,
  });

  return { sent: true };
}
