export type BillableAccount = {
  amount: number | null;
  billingCycle: string | null;
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
