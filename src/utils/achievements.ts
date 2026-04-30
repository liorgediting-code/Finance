import type { AppSettings, MonthData, Debt, LifeGoal, SavingsChallenge } from '../types';
import { sumAmounts } from './calculations';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string; // descriptive text, e.g. "ינואר 2026"
}

interface StoreSnapshot {
  settings: AppSettings;
  months: Record<number, MonthData>;
  debts: Debt[];
  lifeGoals: LifeGoal[];
  savingsChallenges: SavingsChallenge[];
  recurringExpenses: { amount: number }[];
  recurringIncomes: { amount: number }[];
  savingsFunds: { savedAmount: number; targetAmount: number }[];
  mortgages: { id: string }[];
  savingsVehicles: { id: string }[];
  installments: { id: string }[];
  familyMembers: { id: string }[];
}

export function computeAchievements(s: StoreSnapshot): Achievement[] {
  const monthEntries = Object.entries(s.months).map(([k, v]) => ({ index: Number(k), data: v }));

  // Total expenses across all months
  const totalExpenses = monthEntries.reduce((sum, { data }) => sum + sumAmounts(data.expenses), 0);

  // Months where income > expenses
  const greenMonths = monthEntries.filter(({ data }) => {
    const inc = sumAmounts([...s.recurringIncomes, ...data.income]);
    const exp = sumAmounts([...s.recurringExpenses, ...data.expenses]);
    return inc > exp && inc > 0;
  });

  // Longest consecutive green streak
  const sortedIndices = monthEntries
    .filter(({ data }) => {
      const inc = sumAmounts([...s.recurringIncomes, ...data.income]);
      const exp = sumAmounts([...s.recurringExpenses, ...data.expenses]);
      return inc > exp && inc > 0;
    })
    .map(({ index }) => index)
    .sort((a, b) => a - b);

  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedIndices.length; i++) {
    if (i === 0 || sortedIndices[i] === sortedIndices[i - 1] + 1) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  // Best savings rate
  const savingsRates = monthEntries.map(({ data }) => {
    const inc = sumAmounts([...s.recurringIncomes, ...data.income]);
    const exp = sumAmounts([...s.recurringExpenses, ...data.expenses]);
    return inc > 0 ? ((inc - exp) / inc) * 100 : 0;
  });
  const bestRate = savingsRates.length > 0 ? Math.max(...savingsRates) : 0;

  // Budget categories set
  const budgetedCategories = new Set(
    monthEntries.flatMap(({ data }) => Object.keys(data.budget).filter((k) => (data.budget[k] ?? 0) > 0))
  );

  // Goals progress
  const goalsOver50 = s.lifeGoals.filter((g) => g.targetAmount > 0 && g.savedAmount / g.targetAmount >= 0.5);
  const completedGoals = s.lifeGoals.filter((g) => g.targetAmount > 0 && g.savedAmount >= g.targetAmount);

  // Modules in use count
  const enabledModules = s.settings.enabledModules ?? [];
  const activeModuleCount = enabledModules.length;

  // Challenge progress
  const challengeTotal = s.savingsChallenges.reduce((sum, c) => sum + c.completedWeeks.length, 0);

  // Months with savings rate >= 20%
  const highSavingsMonths = savingsRates.filter((r) => r >= 20).length;

  const achievements: Achievement[] = [
    {
      id: 'first-steps',
      emoji: '🌱',
      title: 'צעד ראשון',
      description: 'רשמת את ההוצאה הראשונה שלך',
      unlocked: totalExpenses > 0,
    },
    {
      id: 'family-setup',
      emoji: '👨‍👩‍👧',
      title: 'משפחה מאורגנת',
      description: 'הוספת לפחות שני בני משפחה',
      unlocked: s.familyMembers.length >= 2,
    },
    {
      id: 'budget-planner',
      emoji: '📋',
      title: 'מתכנן תקציב',
      description: 'הגדרת תקציב ל-5 קטגוריות לפחות',
      unlocked: budgetedCategories.size >= 5,
    },
    {
      id: 'green-month',
      emoji: '💚',
      title: 'חודש ירוק',
      description: 'הכנסות עלו על הוצאות בחודש אחד לפחות',
      unlocked: greenMonths.length >= 1,
    },
    {
      id: 'streak-3',
      emoji: '🔥',
      title: 'שלושה ירוקים ברצף',
      description: 'הכנסות עלו על הוצאות 3 חודשים רצופים',
      unlocked: maxStreak >= 3,
    },
    {
      id: 'streak-6',
      emoji: '🏆',
      title: 'חצי שנה ירוקה',
      description: 'הכנסות עלו על הוצאות 6 חודשים רצופים',
      unlocked: maxStreak >= 6,
    },
    {
      id: 'saver-20',
      emoji: '💰',
      title: 'חוסך מוצלח',
      description: 'חסכת 20% מההכנסה בחודש אחד',
      unlocked: bestRate >= 20,
    },
    {
      id: 'saver-30',
      emoji: '💎',
      title: 'חוסך אגדי',
      description: 'חסכת 30% מההכנסה בחודש אחד',
      unlocked: bestRate >= 30,
    },
    {
      id: 'debt-tracker',
      emoji: '⚔️',
      title: 'מתמודד עם חוב',
      description: 'רשמת חוב אחד לפחות לניהול',
      unlocked: s.debts.length > 0,
    },
    {
      id: 'goal-setter',
      emoji: '🎯',
      title: 'שואף קדימה',
      description: 'הגדרת מטרת חיים אחת לפחות',
      unlocked: s.lifeGoals.length > 0,
    },
    {
      id: 'goal-halfway',
      emoji: '🚀',
      title: 'בחצי הדרך',
      description: 'הגעת ל-50% ממטרת חיים',
      unlocked: goalsOver50.length > 0,
    },
    {
      id: 'goal-complete',
      emoji: '🎉',
      title: 'מטרה הושגה!',
      description: 'השלמת מטרת חיים במלואה',
      unlocked: completedGoals.length > 0,
    },
    {
      id: 'mortgage-owner',
      emoji: '🏠',
      title: 'בעל נכס',
      description: 'עוקב אחר משכנתא',
      unlocked: s.mortgages.length > 0,
    },
    {
      id: 'pension-saver',
      emoji: '🏦',
      title: 'מתכנן עתיד',
      description: 'עוקב אחר פנסיה או חיסכון',
      unlocked: s.savingsVehicles.length > 0,
    },
    {
      id: 'installment-manager',
      emoji: '🗂️',
      title: 'מנהל תשלומים',
      description: 'עוקב אחר תשלומים',
      unlocked: s.installments.length > 0,
    },
    {
      id: 'power-user',
      emoji: '⚡',
      title: 'משתמש כוח',
      description: 'פעיל ב-8 מודולים ומעלה',
      unlocked: activeModuleCount >= 8,
    },
    {
      id: 'challenge-starter',
      emoji: '🏁',
      title: 'מתחיל אתגר',
      description: 'הפעלת אתגר חיסכון',
      unlocked: s.savingsChallenges.length > 0,
    },
    {
      id: 'challenge-progress',
      emoji: '📅',
      title: 'מתמיד',
      description: 'סימנת 10 שבועות באתגר החיסכון',
      unlocked: challengeTotal >= 10,
    },
    {
      id: 'consistent-saver',
      emoji: '🌟',
      title: 'חוסך עקבי',
      description: 'חסכת 20%+ בשלושה חודשים לפחות',
      unlocked: highSavingsMonths >= 3,
    },
    {
      id: 'savings-fund',
      emoji: '🐷',
      title: 'קופת חיסכון',
      description: 'יש לך קרן חיסכון פעילה',
      unlocked: s.savingsFunds.length > 0 && s.savingsFunds.some((f) => f.savedAmount > 0),
    },
  ];

  return achievements;
}
