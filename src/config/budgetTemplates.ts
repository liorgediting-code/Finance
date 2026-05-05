export interface BudgetTemplate {
  id: string;
  emoji: string;
  name: string;
  description: string;
  referenceIncome: number;
  budgets: Record<string, number>;
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'young-couple',
    emoji: '👫',
    name: 'זוג צעיר',
    description: 'ללא ילדים, הכנסה משפחתית ~₪20,000',
    referenceIncome: 20000,
    budgets: {
      home: 6000,
      food: 3000,
      transport: 2000,
      health: 500,
      personal: 1000,
      entertainment: 1500,
      subscriptions: 300,
      shopping: 800,
      financial: 500,
      savings: 3000,
    },
  },
  {
    id: 'family-kids',
    emoji: '👨‍👩‍👧‍👦',
    name: 'משפחה עם ילדים',
    description: 'זוג + ילדים, הכנסה משפחתית ~₪30,000',
    referenceIncome: 30000,
    budgets: {
      home: 7500,
      food: 4500,
      children: 3000,
      transport: 2500,
      health: 800,
      education: 600,
      personal: 1200,
      entertainment: 1500,
      subscriptions: 400,
      shopping: 1000,
      financial: 700,
      savings: 4000,
    },
  },
  {
    id: 'single',
    emoji: '🧍',
    name: 'רווק / רווקה',
    description: 'משק בית יחיד, הכנסה ~₪12,000',
    referenceIncome: 12000,
    budgets: {
      home: 4500,
      food: 2000,
      transport: 1500,
      health: 300,
      personal: 700,
      entertainment: 800,
      subscriptions: 300,
      shopping: 500,
      savings: 1200,
    },
  },
  {
    id: 'aggressive-savings',
    emoji: '💪',
    name: 'חיסכון אינטנסיבי',
    description: 'מקסום חיסכון, הכנסה ~₪25,000',
    referenceIncome: 25000,
    budgets: {
      home: 6000,
      food: 2500,
      transport: 1500,
      health: 500,
      personal: 500,
      entertainment: 500,
      subscriptions: 200,
      shopping: 500,
      financial: 400,
      savings: 8000,
    },
  },
];
