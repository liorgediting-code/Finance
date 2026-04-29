import type { MonthData, IncomeEntry, ExpenseEntry, SavingsFund, Mortgage, Debt, LifeGoal, Installment } from '../types';
import { CATEGORIES } from '../config/categories';

export type InsightSeverity = 'success' | 'info' | 'warning' | 'danger';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  value?: string;
  category?: string;
}

interface InsightInput {
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  savingsFunds: SavingsFund[];
  mortgages: Mortgage[];
  debts: Debt[];
  lifeGoals: LifeGoal[];
  installments: Installment[];
  currentMonth: number;
  currentYear: number;
}

function fmt(n: number) {
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

function getCategoryName(categoryId: string): string {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return cat?.nameHe ?? categoryId;
}

export function generateInsights(input: InsightInput): Insight[] {
  const {
    months, recurringIncomes, recurringExpenses,
    savingsFunds, mortgages, debts, lifeGoals, installments,
    currentMonth,
  } = input;

  const insights: Insight[] = [];
  const currentMd = months[currentMonth];
  const prevMonthIdx = (currentMonth - 1 + 12) % 12;
  const prevMd = months[prevMonthIdx];

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const monthIncome = recurringIncome + (currentMd?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthExpense = recurringExpense + (currentMd?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? (net / monthIncome) * 100 : 0;

  // 1. Savings rate insight
  if (monthIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'savings-rate-great',
        severity: 'success',
        title: 'שיעור חיסכון מצוין',
        description: `אתה חוסך ${Math.round(savingsRate)}% מההכנסה החודשית שלך. המלצת הזהב היא 20% — אתה עומד ביעד!`,
        value: `${Math.round(savingsRate)}%`,
      });
    } else if (savingsRate >= 10) {
      insights.push({
        id: 'savings-rate-ok',
        severity: 'info',
        title: 'שיעור חיסכון סביר',
        description: `אתה חוסך ${Math.round(savingsRate)}% מההכנסה. שאוף ל-20% — עוד ${fmt(monthIncome * 0.2 - net)} לחודש.`,
        value: `${Math.round(savingsRate)}%`,
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'savings-rate-low',
        severity: 'warning',
        title: 'שיעור חיסכון נמוך',
        description: `אתה חוסך רק ${Math.round(savingsRate)}% מההכנסה. נסה להגדיל ל-10% לפחות — עוד ${fmt(monthIncome * 0.1 - net)} לחודש.`,
        value: `${Math.round(savingsRate)}%`,
      });
    } else if (net < 0) {
      insights.push({
        id: 'negative-net',
        severity: 'danger',
        title: 'הוצאות עולות על ההכנסות',
        description: `הוצאות החודש גבוהות בהכנסות ב-${fmt(Math.abs(net))}. כדאי לבדוק איפה ניתן לצמצם.`,
        value: fmt(net),
      });
    }
  }

  // 2. Fixed expenses ratio
  if (monthIncome > 0) {
    const fixedRatio = (recurringExpense / monthIncome) * 100;
    if (fixedRatio > 60) {
      insights.push({
        id: 'fixed-high',
        severity: 'warning',
        title: 'הוצאות קבועות גבוהות',
        description: `הוצאות קבועות הן ${Math.round(fixedRatio)}% מההכנסה (${fmt(recurringExpense)}). מעל 50% מצמצם את גמישות התקציב.`,
        value: `${Math.round(fixedRatio)}%`,
      });
    } else if (fixedRatio > 0) {
      insights.push({
        id: 'fixed-ok',
        severity: 'info',
        title: 'הוצאות קבועות',
        description: `הוצאות קבועות חודשיות: ${fmt(recurringExpense)} (${Math.round(fixedRatio)}% מההכנסה).`,
        value: fmt(recurringExpense),
      });
    }
  }

  // 3. Month-over-month category changes
  if (currentMd && prevMd) {
    const catTotals: Record<string, { cur: number; prev: number }> = {};

    for (const exp of currentMd.expenses) {
      if (!catTotals[exp.categoryId]) catTotals[exp.categoryId] = { cur: 0, prev: 0 };
      catTotals[exp.categoryId].cur += exp.amount;
    }
    for (const exp of prevMd.expenses) {
      if (!catTotals[exp.categoryId]) catTotals[exp.categoryId] = { cur: 0, prev: 0 };
      catTotals[exp.categoryId].prev += exp.amount;
    }

    const bigJumps = Object.entries(catTotals)
      .filter(([, v]) => v.prev > 200 && v.cur > v.prev * 1.3)
      .sort((a, b) => (b[1].cur - b[1].prev) - (a[1].cur - a[1].prev))
      .slice(0, 2);

    for (const [catId, v] of bigJumps) {
      const pct = Math.round(((v.cur - v.prev) / v.prev) * 100);
      insights.push({
        id: `cat-jump-${catId}`,
        severity: 'warning',
        title: `עלייה בהוצאות: ${getCategoryName(catId)}`,
        description: `הוצאות בקטגוריה זו עלו ב-${pct}% לעומת חודש שעבר (${fmt(v.prev)} → ${fmt(v.cur)}).`,
        value: `+${pct}%`,
        category: catId,
      });
    }

    const bigDrops = Object.entries(catTotals)
      .filter(([, v]) => v.prev > 300 && v.cur < v.prev * 0.7 && v.cur > 0)
      .sort((a, b) => (a[1].cur - a[1].prev) - (b[1].cur - b[1].prev))
      .slice(0, 1);

    for (const [catId, v] of bigDrops) {
      const saved = v.prev - v.cur;
      insights.push({
        id: `cat-drop-${catId}`,
        severity: 'success',
        title: `חיסכון בקטגוריה: ${getCategoryName(catId)}`,
        description: `הוצאות ב${getCategoryName(catId)} ירדו החודש וחסכת ${fmt(saved)} לעומת חודש שעבר.`,
        value: `-${fmt(saved)}`,
        category: catId,
      });
    }
  }

  // 4. Budget adherence for current month
  if (currentMd?.budget) {
    const overBudgetCats: Array<{ name: string; over: number }> = [];
    for (const [catId, budgetAmt] of Object.entries(currentMd.budget)) {
      if (budgetAmt <= 0) continue;
      const spent = (currentMd.expenses ?? [])
        .filter((e) => e.categoryId === catId)
        .reduce((s, e) => s + e.amount, 0);
      if (spent > budgetAmt) {
        overBudgetCats.push({ name: getCategoryName(catId), over: spent - budgetAmt });
      }
    }
    if (overBudgetCats.length > 0) {
      const worst = overBudgetCats.sort((a, b) => b.over - a.over)[0];
      insights.push({
        id: 'over-budget',
        severity: 'danger',
        title: `חריגה מתקציב: ${worst.name}`,
        description: `חרגת מהתקציב ב${worst.name} ב-${fmt(worst.over)}${overBudgetCats.length > 1 ? ` ועוד ${overBudgetCats.length - 1} קטגוריות` : ''}.`,
        value: fmt(worst.over),
      });
    }
  }

  // 5. Emergency fund coverage
  if (savingsFunds.length > 0 && monthExpense > 0) {
    const totalSaved = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
    const monthsCovered = totalSaved / monthExpense;
    if (monthsCovered >= 6) {
      insights.push({
        id: 'emergency-great',
        severity: 'success',
        title: 'קרן חירום חזקה',
        description: `קרן החירום שלך מכסה ${monthsCovered.toFixed(1)} חודשי הוצאות. מצוין — היעד המומלץ הוא 6 חודשים.`,
        value: `${monthsCovered.toFixed(1)} חודשים`,
      });
    } else if (monthsCovered >= 3) {
      insights.push({
        id: 'emergency-ok',
        severity: 'info',
        title: 'קרן חירום בינונית',
        description: `קרן החירום מכסה ${monthsCovered.toFixed(1)} חודשים. שאוף ל-6 חודשים — עוד ${fmt(monthExpense * 6 - totalSaved)}.`,
        value: `${monthsCovered.toFixed(1)} חודשים`,
      });
    } else {
      insights.push({
        id: 'emergency-low',
        severity: 'warning',
        title: 'קרן חירום נמוכה',
        description: `קרן החירום מכסה רק ${monthsCovered.toFixed(1)} חודשי הוצאות. מומלץ לחסוך לפחות 3 חודשים.`,
        value: `${monthsCovered.toFixed(1)} חודשים`,
      });
    }
  } else if (savingsFunds.length === 0) {
    insights.push({
      id: 'no-emergency-fund',
      severity: 'warning',
      title: 'אין קרן חירום',
      description: 'לא הגדרת קרן חירום. מומלץ לחסוך לפחות 3 חודשי הוצאות לכיסוי מצבי חירום.',
    });
  }

  // 6. Debt payoff insights
  for (const debt of debts.slice(0, 2)) {
    if (debt.balance > 0 && debt.minimumPayment > 0) {
      const monthsToPayoff = debt.balance / debt.minimumPayment;
      if (monthsToPayoff <= 6) {
        insights.push({
          id: `debt-close-${debt.id}`,
          severity: 'success',
          title: `קרוב לסיום: ${debt.name}`,
          description: `עוד כ-${Math.ceil(monthsToPayoff)} תשלומים לסיום חוב "${debt.name}" (יתרה: ${fmt(debt.balance)}).`,
          value: `${Math.ceil(monthsToPayoff)} חודשים`,
        });
      }
    }
  }

  // 7. Goal projections
  for (const goal of lifeGoals.slice(0, 2)) {
    if (goal.targetAmount > 0 && goal.savedAmount < goal.targetAmount && goal.monthlyContribution > 0) {
      const remaining = goal.targetAmount - goal.savedAmount;
      const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
      const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
      if (pct >= 75) {
        insights.push({
          id: `goal-close-${goal.id}`,
          severity: 'success',
          title: `יעד קרוב: ${goal.name}`,
          description: `הגעת ל-${pct}% מהיעד "${goal.name}". עוד ${monthsNeeded} חודשים להשלמה!`,
          value: `${pct}%`,
        });
      } else if (monthsNeeded > 36) {
        insights.push({
          id: `goal-far-${goal.id}`,
          severity: 'info',
          title: `הגדל תרומה: ${goal.name}`,
          description: `ביצב הנוכחי תגיע ליעד "${goal.name}" בעוד ${monthsNeeded} חודשים. הגדלת התרומה תזרז את ההשגה.`,
          value: `${monthsNeeded} חודשים`,
        });
      }
    }
  }

  // 8. Mortgage-to-income ratio
  if (mortgages.length > 0 && monthIncome > 0) {
    const totalMortgagePayment = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.monthlyPayment, 0);
    const mortgageRatio = (totalMortgagePayment / monthIncome) * 100;
    if (mortgageRatio > 35) {
      insights.push({
        id: 'mortgage-high',
        severity: 'warning',
        title: 'תשלום משכנתה גבוה',
        description: `המשכנתה שלך היא ${Math.round(mortgageRatio)}% מההכנסה (${fmt(totalMortgagePayment)}). יחס מומלץ: עד 28-30%.`,
        value: `${Math.round(mortgageRatio)}%`,
      });
    }
  }

  // 9. Installments insight
  const activeInstallments = installments.filter((i) => i.paidPayments < i.numPayments);
  if (activeInstallments.length > 0) {
    const totalMonthly = activeInstallments.reduce((s, i) => s + i.totalAmount / i.numPayments, 0);
    insights.push({
      id: 'installments-summary',
      severity: 'info',
      title: 'תשלומים פעילים',
      description: `יש לך ${activeInstallments.length} תשלומים פעילים. עלות חודשית כוללת: ${fmt(totalMonthly)}.`,
      value: fmt(totalMonthly),
    });
  }

  // 10. Savings vehicles
  if (monthIncome > 0) {
    const posMonths = Object.values(months).filter((md) => {
      const inc = recurringIncome + md.income.reduce((s, e) => s + e.amount, 0);
      const exp = recurringExpense + md.expenses.reduce((s, e) => s + e.amount, 0);
      return inc > exp;
    }).length;
    if (posMonths >= 9) {
      insights.push({
        id: 'positive-streak',
        severity: 'success',
        title: 'שמירה על תקציב חיובי',
        description: `ב-${posMonths} מתוך 12 חודשים ההכנסות עלו על ההוצאות. כל הכבוד על הניהול הפיננסי!`,
        value: `${posMonths}/12 חודשים`,
      });
    }
  }

  return insights.slice(0, 12);
}
