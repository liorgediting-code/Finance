import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '../../utils/formatters';

// Israeli tax brackets 2025 (approximate annual amounts in ILS)
const TAX_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 84480, rate: 0.10 },
  { upTo: 120960, rate: 0.14 },
  { upTo: 193800, rate: 0.20 },
  { upTo: 269280, rate: 0.31 },
  { upTo: 560280, rate: 0.35 },
  { upTo: Infinity, rate: 0.47 },
];

// Value of one credit point per year (2025 approximation)
const CREDIT_POINT_ANNUAL = 2676;

function calcTax(annualIncome: number): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of TAX_BRACKETS) {
    if (annualIncome <= prev) break;
    const taxable = Math.min(annualIncome, bracket.upTo) - prev;
    tax += taxable * bracket.rate;
    prev = bracket.upTo;
  }
  return tax;
}

function InfoRow({ label, desc, value }: { label: string; desc?: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-[#1E1E2E]">{label}</p>
        {desc && <p className="text-xs text-[#9090A8]">{desc}</p>}
      </div>
      <span className="text-sm font-semibold text-sage-dark">{value}</span>
    </div>
  );
}

export default function TaxRefundPage() {
  const { savingsVehicles, months, year } = useFinanceStore(
    useShallow((s) => ({
      savingsVehicles: s.savingsVehicles,
      months: s.months,
      year: s.settings.year,
    }))
  );

  // Auto-calculate annual gross income from monthly income entries
  const autoAnnualIncome = Object.values(months).reduce(
    (sum, m) => sum + (m?.income ?? []).reduce((s, i) => s + i.amount, 0),
    0
  );

  const [customIncome, setCustomIncome] = useState('');
  const [creditPoints, setCreditPoints] = useState(2.5);
  const [extraDeductions, setExtraDeductions] = useState(0);
  const [paidTax, setPaidTax] = useState(0);

  const effectiveIncome = customIncome ? parseFloat(customIncome) || 0 : autoAnnualIncome;

  // Pension employee contributions (deductible up to 7% of income, max ₪12,000/year)
  const pensionAnnual = savingsVehicles
    .filter((v) => v.type === 'pension')
    .reduce((s, v) => s + v.employeeMonthlyDeposit * 12, 0);
  const pensionDeduction = Math.min(pensionAnnual, effectiveIncome * 0.07, 12000);

  // Keren Hishtalmut employee contributions (deductible up to 2.5% of income)
  const khtAnnual = savingsVehicles
    .filter((v) => v.type === 'keren_hishtalmut')
    .reduce((s, v) => s + v.employeeMonthlyDeposit * 12, 0);
  const khtDeduction = Math.min(khtAnnual, effectiveIncome * 0.025);

  const totalDeductions = pensionDeduction + khtDeduction + extraDeductions;
  const taxableIncome = Math.max(0, effectiveIncome - totalDeductions);

  const grossTax = calcTax(taxableIncome);
  const creditAmount = creditPoints * CREDIT_POINT_ANNUAL;
  const netTax = Math.max(0, grossTax - creditAmount);
  const effectiveTaxRate = effectiveIncome > 0 ? (netTax / effectiveIncome) * 100 : 0;

  const refund = paidTax > 0 ? paidTax - netTax : null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">מחשבון החזר מס</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">הערכת החזר מס שנתי לשנת {year} — אינו תחליף לייעוץ מקצועי</p>
      </div>

      {/* Income + credit points */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">הכנסה ונקודות זיכוי</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הכנסה שנתית ברוטו (₪)</label>
            <input
              type="number"
              value={customIncome}
              onChange={(e) => setCustomIncome(e.target.value)}
              placeholder={String(Math.round(autoAnnualIncome))}
              className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
            />
            {autoAnnualIncome > 0 && !customIncome && (
              <p className="text-xs text-sage-dark mt-1">✓ הוזן אוטומטית מנתוני המערכת</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">נקודות זיכוי</label>
            <input
              type="number"
              step={0.5}
              value={creditPoints}
              onChange={(e) => setCreditPoints(parseFloat(e.target.value) || 0)}
              className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
            />
            <p className="text-xs text-[#9090A8] mt-1">בסיס: 2.5 לעובד שכיר · כל נקודה = {formatCurrency(CREDIT_POINT_ANNUAL)}/שנה</p>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">ניכויים מהכנסה החייבת</h2>
        <InfoRow
          label="פנסיה — חלק עובד"
          desc={`${formatCurrency(pensionAnnual)} בפועל · עד 7% משכר, מקסימום ₪12,000`}
          value={formatCurrency(pensionDeduction)}
        />
        <InfoRow
          label="קרן השתלמות — חלק עובד"
          desc={`${formatCurrency(khtAnnual)} בפועל · עד 2.5% משכר`}
          value={formatCurrency(khtDeduction)}
        />
        <div className="pt-2.5">
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ניכויים נוספים (תרומות, ביטוח חיים, וכו׳) (₪)</label>
          <input
            type="number"
            value={extraDeductions || ''}
            onChange={(e) => setExtraDeductions(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-48 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
          />
        </div>
        <div className="flex justify-between items-center border-t border-gray-100 mt-3 pt-3">
          <span className="text-sm font-semibold text-[#1E1E2E]">סה״כ ניכויים</span>
          <span className="text-sm font-bold text-sage-dark">{formatCurrency(totalDeductions)}</span>
        </div>
      </div>

      {/* Tax calculation */}
      <div className="bg-lavender-light/50 border border-lavender rounded-xl p-4 mb-4">
        <h2 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">חישוב מס</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B6B8A]">הכנסה חייבת במס</span>
            <span className="font-medium text-[#1E1E2E]">{formatCurrency(taxableIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6B8A]">מס שולי לפני זיכויים</span>
            <span className="font-medium text-[#1E1E2E]">{formatCurrency(grossTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6B8A]">זיכוי נקודות ({creditPoints})</span>
            <span className="font-medium text-sage-dark">−{formatCurrency(creditAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-lavender pt-2">
            <span className="font-bold text-[#1E1E2E]">מס שנתי משוער</span>
            <span className="font-black text-[#5B52A0] text-base">{formatCurrency(netTax)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#9090A8]">
            <span>שיעור מס אפקטיבי</span>
            <span>{effectiveTaxRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Refund calculation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">חישוב החזר מס</h2>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">מס ששולם בפועל (מתלושי השכר השנתיים) (₪)</label>
          <input
            type="number"
            value={paidTax || ''}
            onChange={(e) => setPaidTax(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
          />
        </div>
        {refund !== null && (
          <div
            className={`mt-4 p-4 rounded-xl ${refund > 0 ? 'bg-sage-light border border-sage' : 'bg-blush-light border border-blush'}`}
          >
            <p className="text-sm font-semibold text-[#1E1E2E]">
              {refund > 0 ? '💰 החזר מס משוער' : '💸 תשלום נוסף משוער'}
            </p>
            <p className={`text-2xl font-black mt-1 ${refund > 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>
              {refund > 0 ? '+' : ''}{formatCurrency(refund)}
            </p>
            {refund > 0 && (
              <p className="text-xs text-sage-dark mt-1">הגש בקשה להחזר מס באתר רשות המיסים</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-honey-light border border-honey rounded-xl p-3 text-xs text-[#6B6B8A] leading-relaxed">
        ⚠️ חישוב זה הוא הערכה גסה בלבד לצורך אינדיקציה כללית. הוא אינו מחליף ייעוץ מס מוסמך ואינו מתחשב בכל המשתנים האפשריים (הכנסות נוספות, זיכויים מיוחדים, תיאומי מס, מעסיקים מרובים וכד׳). מדרגות המס הן קירוב לשנת 2025.
      </div>
    </div>
  );
}
