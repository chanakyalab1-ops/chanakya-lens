// Labels come from settings like "$2.99 / month". Split one so the amount can be shown big.
export function splitPriceLabel(label: string | undefined | null): { amount: string; period: string } {
  const text = (label ?? "").trim();
  const m = text.match(/^(.+?)\s*\/\s*(.+)$/);
  return m ? { amount: m[1].trim(), period: m[2].trim() } : { amount: text, period: "" };
}

const num = (amount: string): number | null => {
  const m = amount.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
};

// "Save 16%" when a yearly price beats twelve monthly ones in the same currency symbol; otherwise null.
export function yearlySavings(monthlyAmount: string, yearlyAmount: string): string | null {
  const sym = (a: string) => a.replace(/[\d.,\s]/g, "");
  if (sym(monthlyAmount) !== sym(yearlyAmount)) return null;
  const m = num(monthlyAmount);
  const y = num(yearlyAmount);
  if (m === null || y === null || m <= 0) return null;
  const pct = Math.round((1 - y / (m * 12)) * 100);
  return pct >= 5 ? `Save ${pct}%` : null;
}
