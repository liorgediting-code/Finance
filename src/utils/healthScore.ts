import type { SavingsFund, Mortgage, Debt, LifeGoal, MonthData, IncomeEntry, ExpenseEntry } from '../types';

export interface HealthBreakdown {
  savingsRate: number;       // 0-30
  debtRatio: number;         // 0-25
  goalsProgress: number;     // 0-20
  budgetAdherence: number;   // 0-15
  savingsFundProgress: number; // 0-10
}

export interface HealthScoreResult {
  score: number;
  breakdown: HealthBreakdown;
  savingsRatePct: number;
  debtRatioLabel: string;
  goalsAvgPct: number;
  positiveMonths: number;
  savingsFundAvgPct: number;
}

interface ScoreInput {
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  mortgages: Mortgage[];
  debts: Debt[];
  lifeGoals: LifeGoal[];
  savingsFunds: SavingsFund[];
  currentMonthOverride?: number;
}

export function computeHealthScore(input: ScoreInput): HealthScoreResult {
  const {
    months, recurringIncomes, recurringExpenses,
    mortgages, debts, lifeGoals, savingsFunds,
    currentMonthOverride,
  } = input;

  // Monthly income/expense helpers
  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const currentMonth = currentMonthOverride !== undefined ? currentMonthOverride : new Date().getMonth();
  const currentMonthData = months[currentMonth];
  const monthlyIncome = recurringIncome + (currentMonthData?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = recurringExpense + (currentMonthData?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthlyIncome - monthlyExpense;

  // 1. Savings rate (0-30): net/income * 100, clamped to 0-30
  const savingsRatePct = monthlyIncome > 0 ? (net / monthlyIncome) * 100 : 0;
  const savingsRate = Math.min(30, Math.max(0, savingsRatePct));

  // 2. Debt-to-income ratio (0-25): lower monthly debt payments = better
  const totalMonthlyDebt = [
    ...mortgages.flatMap((m) => m.tracks.map((t) => t.monthlyPayment)),
    ...debts.map((d) => d.minimumPayment),
  ].reduce((s, v) => s + v, 0);
  const debtRatioPct = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0;
  const debtRatioLabel = debtRatioPct < 20 ? 'נמוך' : debtRatioPct < 35 ? 'מתון' : 'גבוה';
  const debtRatio = Math.max(0, 25 - (debtRatioPct / 100) * 50);

  // 3. Goals progress (0-20): average % of all goals
  const goalsAvgPct = lifeGoals.length > 0
    ? lifeGoals.reduce((s, g) => s + (g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0), 0) / lifeGoals.length
    : 0;
  const goalsProgress = (goalsAvgPct / 100) * 20;

  // 4. Budget adherence (0-15): fraction of year's months where income > expenses
  const positiveMonths = Object.values(months).filter((md) => {
    const inc = recurringIncome + md.income.reduce((s, e) => s + e.amount, 0);
    const exp = recurringExpense + md.expenses.reduce((s, e) => s + e.amount, 0);
    return inc > exp;
  }).length;
  const budgetAdherence = (positiveMonths / 12) * 15;

  // 5. Savings fund progress (0-10): average saved/target across all funds
  const savingsFundAvgPct = savingsFunds.length > 0
    ? savingsFunds.reduce((s, f) => s + (f.targetAmount > 0 ? Math.min(100, (f.savedAmount / f.targetAmount) * 100) : 0), 0) / savingsFunds.length
    : 0;
  const savingsFundProgress = (savingsFundAvgPct / 100) * 10;

  const breakdown: HealthBreakdown = {
    savingsRate: Math.round(savingsRate * 10) / 10,
    debtRatio: Math.round(debtRatio * 10) / 10,
    goalsProgress: Math.round(goalsProgress * 10) / 10,
    budgetAdherence: Math.round(budgetAdherence * 10) / 10,
    savingsFundProgress: Math.round(savingsFundProgress * 10) / 10,
  };

  const score = Math.round(
    breakdown.savingsRate + breakdown.debtRatio + breakdown.goalsProgress +
    breakdown.budgetAdherence + breakdown.savingsFundProgress
  );

  return {
    score,
    breakdown,
    savingsRatePct: Math.round(savingsRatePct),
    debtRatioLabel,
    goalsAvgPct: Math.round(goalsAvgPct),
    positiveMonths,
    savingsFundAvgPct: Math.round(savingsFundAvgPct),
  };
}
