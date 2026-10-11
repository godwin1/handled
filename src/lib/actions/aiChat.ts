"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canView } from "@/lib/permissions";
import { hasAiChatQuota, getLimits } from "@/lib/billing";

const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || "claude-opus-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

const MAX_ROWS = 150;
const EXCERPT_LENGTH = 1500;

// Answers a free-text question grounded only in this household's own data -
// no web access, no general knowledge beyond what's needed to read the
// data. Each category is included only if the asking member can view it,
// same permission boundary as browsing that category directly.
export async function askHouseholdQuestion(question: string): Promise<{ answer?: string; error?: string }> {
  const user = await requireUser();
  const trimmed = question.trim();
  if (!trimmed) return { error: "Ask a question first." };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "AI chat isn't set up on this server yet." };
  }

  if (!(await hasAiChatQuota(user.householdId, user.household))) {
    return { error: `Your plan allows ${getLimits(user.household).aiChatQueries} AI chat questions per month. Upgrade for more.` };
  }

  const [people, assets, accounts, tasks, documents] = await Promise.all([
    canView(user, "people") ? prisma.person.findMany({ where: { householdId: user.householdId } }) : [],
    canView(user, "assets") ? prisma.asset.findMany({ where: { householdId: user.householdId } }) : [],
    canView(user, "accounts") ? prisma.account.findMany({ where: { householdId: user.householdId } }) : [],
    canView(user, "tasks")
      ? prisma.task.findMany({ where: { householdId: user.householdId }, orderBy: { dueDate: "desc" }, take: MAX_ROWS })
      : [],
    canView(user, "documents")
      ? prisma.document.findMany({
          where: { householdId: user.householdId, status: { not: "SUPERSEDED" } },
          orderBy: { createdAt: "desc" },
          take: MAX_ROWS,
        })
      : [],
  ]);

  const context = {
    people: people.map((p) => ({ name: p.name, relationship: p.relationship, dateOfBirth: p.dateOfBirth })),
    assets: assets.map((a) => ({ name: a.name, type: a.type, details: a.details })),
    accounts: accounts.map((a) => ({
      name: a.name,
      provider: a.provider,
      type: a.type,
      amount: a.amount,
      currency: a.currency,
      billingCycle: a.billingCycle,
    })),
    tasks: tasks.map((t) => ({ title: t.title, type: t.type, status: t.status, dueDate: t.dueDate, recurrence: t.recurrence })),
    documents: documents.map((d) => ({
      title: d.title,
      type: d.type,
      merchant: d.merchant,
      amount: d.amount,
      currency: d.currency,
      dueDate: d.dueDate,
      expiryDate: d.expiryDate,
      policyNumber: d.policyNumber,
      excerpt: d.extractedText?.slice(0, EXCERPT_LENGTH),
    })),
  };

  let response;
  try {
    response = await getClient().messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: `You are a helpful assistant answering questions about a household's own data in the Handled app. Today's date is ${new Date().toISOString().slice(0, 10)}. Answer only from the JSON data provided below - if the answer isn't in it, say so rather than guessing. Be concise and specific (dates, amounts, names).\n\nThe household's data:\n${JSON.stringify(context)}`,
      messages: [{ role: "user", content: trimmed }],
    });
  } catch (err) {
    console.error("AI chat request failed:", err);
    return { error: "Something went wrong answering that - try again in a moment." };
  }

  const answer = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  await prisma.aiChatQuery.create({ data: { householdId: user.householdId, userId: user.id, question: trimmed } });

  return { answer: answer || "I couldn't come up with an answer to that." };
}
