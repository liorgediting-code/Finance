import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts, calcRemaining, calcSavingsPercent } from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface SummaryCardsProps {
  monthIndex: number;
}

interface CardData {
  title: string;
  value: string;
  bgClass: string;
  textClass?: string;
  accentColor: string;
}

export default function SummaryCards({ monthIndex }: SummaryCardsProps) {
  const months = useFinanceStore((s) => s.months);
  const monthData = months[monthIndex];

  const totalIncome = monthData ? sumAmounts(monthData.income) : 0;
  const totalExpenses = monthData ? sumAmounts(monthData.expenses) : 0;
  const remaining = calcRemaining(totalIncome, totalExpenses);
  const savings = remaining > 0 ? remaining : 0;
  const savingsPercent = calcSavingsPercent(savings, totalIncome);

  const cards: CardData[] = [
    {
      title: 'סה״כ הכנסות',
      value: formatCurrency(totalIncome),
      bgClass: 'bg-sage-light',
      accentColor: '#5A9A42',
    },
    {
      title: 'סה״כ הוצאות',
      value: formatCurrency(totalExpenses),
      bgClass: 'bg-blush-light',
      accentColor: '#9B72C0',
    },
    {
      title: 'נשאר בסוף החודש',
      value: formatCurrency(remaining),
      bgClass: remaining >= 0 ? 'bg-green-50' : 'bg-red-50',
      textClass: remaining >= 0 ? 'text-green-700' : 'text-red-600',
      accentColor: remaining >= 0 ? '#6BBF6B' : '#E06060',
    },
    {
      title: 'נכנס לחיסכון',
      value: formatCurrency(savings),
      bgClass: 'bg-powder-light',
      accentColor: '#4A90C0',
    },
    {
      title: 'אחוז חיסכון',
      value: formatPercent(savingsPercent),
      bgClass: 'bg-honey-light',
      accentColor: '#C8A830',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgClass} rounded-2xl shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md`}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ backgroundColor: card.accentColor }} />
          <div className="p-5">
            <p className="text-xs font-medium text-[#6B6B8A] mb-2 leading-tight">{card.title}</p>
            <p className={`text-xl font-bold tracking-tight ${card.textClass ?? 'text-[#1E1E2E]'}`}>
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
