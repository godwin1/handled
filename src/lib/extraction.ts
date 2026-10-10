import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export type DocumentType = "bill" | "id" | "contract" | "warranty" | "receipt" | "medical" | "other";
export type TaskType = "pay" | "renew" | "cancel" | "book" | "submit" | "call" | "other";

export interface ExtractionResult {
  type: DocumentType;
  title: string;
  merchant?: string;
  amount?: number;
  currency?: string;
  dueDate?: Date;
  expiryDate?: Date;
  policyNumber?: string;
  suggestedTaskTitle: string;
  suggestedTaskType: TaskType;
  suggestedTaskDueDate: Date;
}

const DOCUMENT_TYPES = ["bill", "id", "contract", "warranty", "receipt", "medical", "other"] as const;
const TASK_TYPES = ["pay", "renew", "cancel", "book", "submit", "call", "other"] as const;

const ExtractionSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  title: z.string().describe("Short human-readable title, e.g. 'Car Insurance Policy - Admiral'"),
  merchant: z.string().nullable().describe("The company/provider this document is from, if any"),
  amount: z.number().nullable().describe("The monetary amount on the document, if any"),
  currency: z.string().nullable().describe("3-letter currency code, e.g. GBP, USD, EUR"),
  dueDate: z.string().nullable().describe("ISO 8601 date (YYYY-MM-DD) a payment is due, if any"),
  expiryDate: z.string().nullable().describe("ISO 8601 date (YYYY-MM-DD) the document/policy/ID expires, if any"),
  policyNumber: z.string().nullable().describe("Policy, account, or reference number, if any"),
  suggestedTaskTitle: z.string().describe("A short, concrete follow-up task for the household, e.g. 'Renew car insurance'"),
  suggestedTaskType: z.enum(TASK_TYPES),
  suggestedTaskDueDate: z.string().describe("ISO 8601 date (YYYY-MM-DD) the follow-up task should be done by"),
});

const EXTRACTION_MODEL = process.env.ANTHROPIC_EXTRACTION_MODEL || "claude-opus-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * Reads an uploaded document (photo or PDF) and proposes structured fields
 * plus one follow-up task. Falls back to a filename-keyword guess when no
 * ANTHROPIC_API_KEY is configured, or if the API call fails, so capture
 * still works end-to-end without the extraction feature wired up.
 */
export async function extractDocument(
  filename: string,
  fileBuffer: Buffer,
  mimeType: string,
  skipAi = false
): Promise<ExtractionResult> {
  // skipAi: the household has used up its plan's monthly AI extraction
  // quota - same degrade path as no API key configured at all, rather than
  // blocking the upload outright.
  if (!process.env.ANTHROPIC_API_KEY || skipAi) {
    return filenameHeuristic(filename);
  }

  const content: Anthropic.ContentBlockParam[] = [];
  const base64 = fileBuffer.toString("base64");

  if (mimeType === "application/pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
  } else if (mimeType.startsWith("image/")) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 },
    });
  } else {
    return filenameHeuristic(filename);
  }

  content.push({
    type: "text",
    text: `This is a household document (original filename: "${filename}"). Identify what kind of document it is and extract the fields in the schema. If a field isn't present or legible, return null for it rather than guessing. Propose one concrete, specific follow-up task the household should do about this document (pay it, renew it, book something, call someone, submit it, or cancel it) with a realistic due date.`,
  });

  try {
    const response = await getClient().messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(ExtractionSchema) },
    });

    const parsed = response.parsed_output;
    if (!parsed) return filenameHeuristic(filename);

    return {
      type: parsed.type,
      title: parsed.title,
      merchant: parsed.merchant ?? undefined,
      amount: parsed.amount ?? undefined,
      currency: parsed.currency ?? undefined,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
      policyNumber: parsed.policyNumber ?? undefined,
      suggestedTaskTitle: parsed.suggestedTaskTitle,
      suggestedTaskType: parsed.suggestedTaskType,
      suggestedTaskDueDate: new Date(parsed.suggestedTaskDueDate),
    };
  } catch (err) {
    console.error("Document extraction failed, falling back to filename heuristic:", err);
    return filenameHeuristic(filename);
  }
}

const KEYWORD_RULES: { keywords: string[]; type: DocumentType; taskType: TaskType }[] = [
  { keywords: ["insurance", "policy", "admiral", "aviva", "geico"], type: "bill", taskType: "renew" },
  { keywords: ["passport", "visa", "id card", "driving licence", "license"], type: "id", taskType: "renew" },
  { keywords: ["warranty", "guarantee"], type: "warranty", taskType: "renew" },
  { keywords: ["contract", "lease", "tenancy", "agreement"], type: "contract", taskType: "renew" },
  { keywords: ["receipt", "invoice"], type: "receipt", taskType: "pay" },
  { keywords: ["doctor", "clinic", "hospital", "prescription", "medical"], type: "medical", taskType: "book" },
  { keywords: ["bill", "statement", "electricity", "water", "gas", "internet", "wifi"], type: "bill", taskType: "pay" },
];

function filenameHeuristic(filename: string): ExtractionResult {
  const lower = filename.toLowerCase();
  const rule = KEYWORD_RULES.find((r) => r.keywords.some((k) => lower.includes(k)));

  const type = rule?.type ?? "other";
  const taskType = rule?.taskType ?? "other";

  const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
  const title = baseName.length > 0 ? capitalize(baseName) : "New document";

  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);

  const taskVerb: Record<TaskType, string> = {
    pay: "Pay",
    renew: "Renew",
    cancel: "Cancel",
    book: "Book",
    submit: "Submit",
    call: "Call about",
    other: "Review",
  };

  return {
    type,
    title,
    suggestedTaskTitle: `${taskVerb[taskType]} ${title}`,
    suggestedTaskType: taskType,
    suggestedTaskDueDate: defaultDueDate,
  };
}

function capitalize(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
