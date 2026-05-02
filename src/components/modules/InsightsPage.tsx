import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { generateInsights, type Insight, type InsightSeverity } from '../../utils/insights';
import { CATEGORIES } from '../../config/categories';

function severityConfig(s: InsightSeverity) {
  switch (s) {
    case 'success': return { bg: 'bg-sage-light', border: 'border-sage', icon: '✓', iconBg: 'bg-sage-dark text-white', label: 'חיובי' };
    case 'info':    return { bg: 'bg-powder-light', border: 'border-powder', icon: 'ℹ', iconBg: 'bg-powder-dark text-white', label: 'מידע' };
    case 'warning': return { bg: 'bg-honey-light', border: 'border-honey', icon: '!', iconBg: 'bg-honey-dark text-[#1E1E2E]', label: 'שים לב' };
    case 'danger':  return { bg: 'bg-blush-light', border: 'border-blush', icon: '✕', iconBg: 'bg-blush-dark text-white', label: 'דורש טיפול' };
  }
}

function InsightCard({ insight }: { insight: Insight }) {
  const cfg = severityConfig(insight.severity);
  const catColor = insight.category ? CATEGORIES.find((c) => c.id === insight.category)?.color : undefined;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex gap-3`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.iconBg} flex items-center justify-center text-sm font-bold`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-sm font-semibold text-[#1E1E2E] flex-1">{insight.title}</p>
          {insight.value && (
            <span className="text-xs font-bold text-[#4A4A60] bg-white/70 rounded-full px-2 py-0.5 flex-shrink-0">
              {insight.value}
            </span>
          )}
        </div>
        <p className="text-xs text-[#4A4A60] leading-relaxed">{insight.description}</p>
        {catColor && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
            <span className="text-[10px] text-[#9090A8]">{CATEGORIES.find((c) => c.id === insight.category)?.nameHe}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SEVERITY_ORDER: InsightSeverity[] = ['danger', 'warning', 'success', 'info'];

function SeveritySection({ severity, insights }: { severity: InsightSeverity; insights: Insight[] }) {
  if (insights.length === 0) return null;
  const cfg = severityConfig(severity);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.iconBg}`}>{cfg.label}</span>
        <span className="text-[11px] text-[#9090A8]">{insights.length} תובנות</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((ins) => <InsightCard key={ins.id} insight={ins} />)}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { savingsFunds, mortgages, debts, lifeGoals, installments } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      installments: s.installments,
    }))
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const insights = useMemo(() => generateInsights({
    months, recurringIncomes, recurringExpenses,
    savingsFunds, mortgages, debts, lifeGoals, installments,
    currentMonth, currentYear,
  }), [months, recurringIncomes, recurringExpenses, savingsFunds, mortgages, debts, lifeGoals, installments, currentMonth, currentYear]);

  const byGroup: Record<InsightSeverity, Insight[]> = {
    danger: [], warning: [], success: [], info: [],
  };
  for (const ins of insights) byGroup[ins.severity].push(ins);

  const hasAny = insights.length > 0;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E1E2E]">תובנות חכמות</h1>
        <p className="text-sm text-[#9090A8] mt-1">ניתוח אוטומטי של המצב הפיננסי שלך עם המלצות לפעולה</p>
      </div>

      {!hasAny && (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-medium text-[#4A4A60]">אין מספיק נתונים עדיין</p>
          <p className="text-xs text-[#9090A8] mt-1">הוסף הכנסות והוצאות כדי לקבל תובנות מותאמות אישית</p>
        </div>
      )}

      {hasAny && (
        <div className="flex flex-col gap-6">
          {SEVERITY_ORDER.map((sev) => (
            <SeveritySection key={sev} severity={sev} insights={byGroup[sev]} />
          ))}
        </div>
      )}

      {/* Summary strip */}
      {hasAny && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <span className="text-xs text-[#9090A8]">סה"כ תובנות</span>
          <div className="flex gap-3">
            {SEVERITY_ORDER.map((sev) => byGroup[sev].length > 0 && (
              <div key={sev} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityConfig(sev).iconBg}`}>
                {byGroup[sev].length} {severityConfig(sev).label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
