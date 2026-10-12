export type BillableAccount = {
  amount: number | null;
  billingCycle: string | null;
  currency?: string | null;
};

// one_time accounts are excluded from the recurring total on purpose - a
// single deposit or upfront fee isn't a monthly obligation.
export function monthlyEquivalent(account: BillableAccount): number {
  if (!account.amount || !account.billingCycle) return 0;
  switch (account.billingCycle) {
    case "weekly":
      return (account.amount * 52) / 12;
    case "yearly":
      return account.amount / 12;
    case "monthly":
      return account.amount;
    default:
      return 0;
  }
}

export function formatMoney(amount: number, currency?: string | null): string {
  const rounded = Math.round(amount * 100) / 100;
  const symbol = !currency || currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  return `${symbol}${rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Summing amounts across different currencies without converting them is
// meaningless (and labeling the sum with a single "$" is actively
// misleading) - group by currency instead, so a household with both USD
// and EUR accounts gets two totals rather than one wrong one.
export function monthlyTotalsByCurrency(accounts: BillableAccount[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const account of accounts) {
    const amount = monthlyEquivalent(account);
    if (amount === 0) continue;
    const currency = (account.currency || "USD").toUpperCase();
    totals[currency] = (totals[currency] ?? 0) + amount;
  }
  return totals;
}

// Renders each currency's total on its own, e.g. "$50.00/month · EUR 20.00/month".
export function formatMoneyTotals(totals: Record<string, number>, suffix: string): string {
  const entries = Object.entries(totals);
  if (entries.length === 0) return "";
  return entries.map(([currency, amount]) => `${formatMoney(amount, currency)}${suffix}`).join(" · ");
}
