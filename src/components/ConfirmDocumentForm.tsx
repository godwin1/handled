"use client";

import { useActionState } from "react";
import { confirmDocument } from "@/lib/actions/documents";

const DOC_TYPES = ["bill", "id", "contract", "warranty", "receipt", "medical", "other"];
const TASK_TYPES = ["pay", "renew", "cancel", "book", "submit", "call", "other"];

type Option = { id: string; name: string };

type DocumentForForm = {
  id: string;
  status: string;
  title: string;
  type: string;
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  dueDate: Date | null;
  expiryDate: Date | null;
  policyNumber: string | null;
  suggestedTaskTitle: string | null;
  suggestedTaskType: string | null;
  suggestedTaskDueDate: Date | null;
  personId: string | null;
  assetId: string | null;
  accountId: string | null;
};

function toInputDate(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function ConfirmDocumentForm({
  document,
  people,
  assets,
  accounts,
}: {
  document: DocumentForForm;
  people: Option[];
  assets: Option[];
  accounts: Option[];
}) {
  const action = confirmDocument.bind(null, document.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const fallbackTaskDue = new Date();
  fallbackTaskDue.setDate(fallbackTaskDue.getDate() + 14);
  const isPending = document.status === "PENDING_REVIEW";

  // Extraction already proposed a task when the document was uploaded;
  // these are only reached for documents from before that was tracked.
  const defaultTaskTitle = document.suggestedTaskTitle ?? `Review ${document.title}`;
  const defaultTaskType = document.suggestedTaskType ?? "other";
  const defaultTaskDueDate =
    toInputDate(document.suggestedTaskDueDate) ||
    toInputDate(document.dueDate) ||
    toInputDate(document.expiryDate) ||
    toInputDate(fallbackTaskDue);

  return (
    <form action={formAction} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <p className="text-xs text-stone-500">
        {isPending
          ? "We guessed a few fields from the filename — check them and confirm."
          : "Confirmed. You can still edit the details below."}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-stone-600 mb-1">Title</label>
          <input name="title" defaultValue={document.title} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
          <select name="type" defaultValue={document.type} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Merchant / provider</label>
          <input name="merchant" defaultValue={document.merchant ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Amount</label>
          <input name="amount" type="number" step="0.01" defaultValue={document.amount ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Currency</label>
          <input name="currency" defaultValue={document.currency ?? ""} placeholder="GBP" className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Due date</label>
          <input type="date" name="dueDate" defaultValue={toInputDate(document.dueDate)} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Expiry date</label>
          <input type="date" name="expiryDate" defaultValue={toInputDate(document.expiryDate)} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Policy / reference number</label>
          <input name="policyNumber" defaultValue={document.policyNumber ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Person</label>
          <select name="personId" defaultValue={document.personId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Asset</label>
          <select name="assetId" defaultValue={document.assetId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
            <option value="">—</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Account</label>
          <select name="accountId" defaultValue={document.accountId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-stone-900">
            <input type="checkbox" name="createTask" defaultChecked className="rounded border-stone-300" />
            Create a task for this
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">Task title</label>
              <input
                name="taskTitle"
                defaultValue={defaultTaskTitle}
                className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Task type</label>
              <select name="taskType" defaultValue={defaultTaskType} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Task due date</label>
              <input
                type="date"
                name="taskDueDate"
                defaultValue={defaultTaskDueDate}
                className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-2 hover:bg-stone-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : isPending ? "Confirm" : "Save changes"}
      </button>
    </form>
  );
}
