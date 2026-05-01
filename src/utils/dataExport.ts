import type { MonthData, IncomeEntry, ExpenseEntry, SavingsFund, LifeGoal, Debt } from '../types';
import { CATEGORIES } from '../config/categories';
import { HEBREW_MONTHS } from '../config/months';

function escapeCsv(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return String(val);
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function row(...cells: (string | number | undefined)[]): string {
  return cells.map(escapeCsv).join(',');
}

function triggerDownload(csv: string, filename: string) {
  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getCatName(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.nameHe ?? id;
}

function getSubName(catId: string, subId: string): string {
  return CATEGORIES.find((c) => c.id === catId)?.subcategories.find((s) => s.id === subId)?.nameHe ?? subId;
}

function formatPayment(method: ExpenseEntry['paymentMethod']): string {
  const map: Record<string, string> = {
    credit: 'אשראי',
    cash: 'מזומן',
    transfer: 'העברה',
    check: "צ'ק",
    direct_debit: 'הוראת קבע',
  };
  return map[method] ?? method;
}

export function exportExpensesToCsv(
  months: Record<number, MonthData>,
  recurringExpenses: ExpenseEntry[],
  year: number
): void {
  const headers = row('חודש', 'תאריך', 'קטגוריה', 'תת-קטגוריה', 'תיאור', 'סכום', 'אמצעי תשלום', 'קבועה', 'ממתינה', 'הערות');
  const lines: string[] = [headers];

  recurringExpenses.forEach((e) => {
    lines.push(row(
      'קבוע', e.date,
      getCatName(e.categoryId), getSubName(e.categoryId, e.subcategoryId),
      e.description, e.amount, formatPayment(e.paymentMethod),
      'כן', e.isPending ? 'כן' : 'לא', e.notes
    ));
  });

  for (let mi = 0; mi < 12; mi++) {
    const monthData = months[mi];
    if (!monthData?.expenses?.length) continue;
    const monthName = HEBREW_MONTHS[mi];
    monthData.expenses.forEach((e) => {
      lines.push(row(
        monthName, e.date,
        getCatName(e.categoryId), getSubName(e.categoryId, e.subcategoryId),
        e.description, e.amount, formatPayment(e.paymentMethod),
        e.isRecurring ? 'כן' : 'לא', e.isPending ? 'כן' : 'לא', e.notes
      ));
    });
  }

  triggerDownload(lines.join('\n'), `הוצאות_${year}.csv`);
}

export function exportIncomeToCsv(
  months: Record<number, MonthData>,
  recurringIncomes: IncomeEntry[],
  year: number
): void {
  const headers = row('חודש', 'תאריך', 'מקור', 'סכום', 'קבועה', 'הערות');
  const lines: string[] = [headers];

  recurringIncomes.forEach((e) => {
    lines.push(row('קבוע', e.date, e.source, e.amount, 'כן', e.notes));
  });

  for (let mi = 0; mi < 12; mi++) {
    const monthData = months[mi];
    if (!monthData?.income?.length) continue;
    const monthName = HEBREW_MONTHS[mi];
    monthData.income.forEach((e) => {
      lines.push(row(monthName, e.date, e.source, e.amount, e.isRecurring ? 'כן' : 'לא', e.notes));
    });
  }

  triggerDownload(lines.join('\n'), `הכנסות_${year}.csv`);
}

export function exportSavingsToCsv(funds: SavingsFund[], goals: LifeGoal[], year: number): void {
  const lines: string[] = [];

  lines.push(row('קרנות חיסכון', '', '', ''));
  lines.push(row('שם', 'יעד', 'נחסך', 'אחוז השלמה'));
  funds.forEach((f) => {
    const pct = f.targetAmount > 0 ? Math.round((f.savedAmount / f.targetAmount) * 100) : 0;
    lines.push(row(f.name, f.targetAmount, f.savedAmount, `${pct}%`));
  });

  lines.push(row(''));
  lines.push(row('מטרות חיים', '', '', ''));
  lines.push(row('שם', 'יעד', 'נחסך', 'תאריך יעד', 'הפרשה חודשית'));
  goals.forEach((g) => {
    lines.push(row(g.name, g.targetAmount, g.savedAmount, g.targetDate, g.monthlyContribution));
  });

  triggerDownload(lines.join('\n'), `חסכונות_ומטרות_${year}.csv`);
}

export function exportDebtsToCsv(debts: Debt[], year: number): void {
  const typeMap: Record<string, string> = {
    credit_card: 'כרטיס אשראי',
    personal_loan: 'הלוואה אישית',
    car_loan: 'הלוואת רכב',
    overdraft: 'מינוס בחשבון',
    other: 'אחר',
  };

  const headers = row('שם', 'סוג', 'יתרה', 'ריבית (%)', 'תשלום מינימלי', 'הערות');
  const lines: string[] = [headers];
  debts.forEach((d) => {
    lines.push(row(d.name, typeMap[d.type] ?? d.type, d.balance, d.interestRate, d.minimumPayment, d.notes));
  });

  triggerDownload(lines.join('\n'), `חובות_${year}.csv`);
}
