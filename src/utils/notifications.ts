import type { MonthData, SavingsFund, Debt, LifeGoal, ExpenseEntry } from '../types';

export interface AppAlert {
  id: string;
  type: 'budget-overspend' | 'goal-near' | 'savings-milestone' | 'debt-progress' | 'green-month';
  severity: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  monthIndex?: number;
}

interface AlertInput {
  months: Record<number, MonthData>;
  recurringExpenses: ExpenseEntry[];
  savingsFunds: SavingsFund[];
  debts: Debt[];
  lifeGoals: LifeGoal[];
  currentMonthIndex: number;
}

export function computeAlerts(input: AlertInput): AppAlert[] {
  const alerts: AppAlert[] = [];
  const { months, recurringExpenses, savingsFunds, debts, lifeGoals, currentMonthIndex } = input;

  // 1. Budget overspend in current month
  const md = months[currentMonthIndex];
  if (md) {
    const allExpenses = [...(md.expenses ?? []), ...recurringExpenses.filter((e) => e.isRecurring)];
    for (const [catId, budgeted] of Object.entries(md.budget ?? {})) {
      if (!budgeted || budgeted <= 0) continue;
      const spent = allExpenses
        .filter((e) => e.categoryId === catId && !e.isFuture && !e.isPending)
        .reduce((s, e) => s + e.amount, 0);
      const pct = spent / budgeted;
      if (pct >= 1.0) {
        alerts.push({
          id: `overspend-${catId}`,
          type: 'budget-overspend',
          severity: 'warning',
          title: 'חריגה מהתקציב',
          message: `חרגת מהתקציב בקטגוריה — ${Math.round((pct - 1) * 100)}% מעל המגבלה`,
          monthIndex: currentMonthIndex,
        });
      }
    }
  }

  // 2. Life goal near completion (>80%)
  for (const goal of lifeGoals) {
    if (goal.targetAmount <= 0) continue;
    const pct = goal.savedAmount / goal.targetAmount;
    if (pct >= 0.8 && pct < 1) {
      alerts.push({
        id: `goal-near-${goal.id}`,
        type: 'goal-near',
        severity: 'success',
        title: 'יעד כמעט הושג!',
        message: `${goal.emoji} ${goal.name} — ${Math.round(pct * 100)}% הושג`,
      });
    } else if (pct >= 1) {
      alerts.push({
        id: `goal-done-${goal.id}`,
        type: 'goal-near',
        severity: 'success',
        title: 'יעד הושג!',
        message: `${goal.emoji} ${goal.name} — הגעת ליעד! כל הכבוד!`,
      });
    }
  }

  // 3. Savings fund milestone (50% or 100%)
  for (const fund of savingsFunds) {
    if (fund.targetAmount <= 0) continue;
    const pct = fund.savedAmount / fund.targetAmount;
    if (pct >= 1) {
      alerts.push({
        id: `fund-full-${fund.id}`,
        type: 'savings-milestone',
        severity: 'success',
        title: 'קרן חיסכון מלאה!',
        message: `${fund.name} — הגעת ליעד החיסכון!`,
      });
    } else if (pct >= 0.5 && pct < 0.6) {
      alerts.push({
        id: `fund-half-${fund.id}`,
        type: 'savings-milestone',
        severity: 'info',
        title: 'חצי הדרך!',
        message: `${fund.name} — הגעת ל-50% מהיעד`,
      });
    }
  }

  // 4. Debt under control (balance < 20% of original would require original tracking; skip for now)
  // Instead: alert if total debt is decreasing relative to last month
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  if (totalDebt > 0 && totalDebt < 10000) {
    alerts.push({
      id: 'debt-low',
      type: 'debt-progress',
      severity: 'success',
      title: 'חובות נמוכים!',
      message: `סך החובות שלך פחות מ-₪10,000 — כמעט חופשי!`,
    });
  }

  // 5. Green month (income > expenses in current month)
  if (md) {
    const totalIncome = (md.income ?? []).filter((e) => !e.isFuture).reduce((s, e) => s + e.amount, 0);
    const totalExpenses = [...(md.expenses ?? []), ...recurringExpenses.filter((e) => e.isRecurring)]
      .filter((e) => !e.isFuture && !e.isPending)
      .reduce((s, e) => s + e.amount, 0);
    if (totalIncome > 0 && totalExpenses < totalIncome) {
      const surplus = totalIncome - totalExpenses;
      alerts.push({
        id: `green-month-${currentMonthIndex}`,
        type: 'green-month',
        severity: 'success',
        title: 'חודש ירוק!',
        message: `יש לך עודף של ₪${Math.round(surplus).toLocaleString('he-IL')} החודש`,
        monthIndex: currentMonthIndex,
      });
    }
  }

  return alerts.slice(0, 8);
}
