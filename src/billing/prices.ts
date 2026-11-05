export type PlanPrices = {
  monthly: string;
  annualPerMonth: string;
  annualTotal: string;
};

export const FALLBACK_PLAN_PRICES: PlanPrices = {
  monthly: 'R$ 59,90',
  annualPerMonth: 'R$ 38,33',
  annualTotal: 'R$ 459,90',
};

export function formatYearlyAsMonthly(yearlyAmount: number, currency: string): string {
  const yearlyCents = Math.round(yearlyAmount * 100);
  const cents = Math.round(yearlyCents / 12);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(cents / 100);
}
