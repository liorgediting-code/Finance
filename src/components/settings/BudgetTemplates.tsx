import { useState } from 'react';
import { BUDGET_TEMPLATES } from '../../config/budgetTemplates';
import { CATEGORIES } from '../../config/categories';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
}

export default function BudgetTemplates({ monthIndex }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const setBudget = useFinanceStore((s) => s.setBudget);

  const selected = BUDGET_TEMPLATES.find((t) => t.id === selectedId);

  const applyTemplate = () => {
    if (!selected) return;
    Object.entries(selected.budgets).forEach(([catId, amount]) => {
      setBudget(monthIndex, catId, amount);
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div>
      <p className="text-xs text-[#9090A8] mb-4">
        בחר תבנית תקציב מוכנה מראש המתאימה למצב המשפחה שלך. התבנית תמלא את התקציב לחודש הנוכחי — תוכל לשנות כל ערך בהמשך.
      </p>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {BUDGET_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => { setSelectedId(tpl.id === selectedId ? null : tpl.id); setApplied(false); }}
            className={`text-right p-3 rounded-xl border-2 transition-all cursor-pointer ${
              selectedId === tpl.id
                ? 'border-lavender-dark bg-lavender-light'
                : 'border-gray-100 bg-gray-50 hover:border-lavender hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{tpl.emoji}</span>
              <span className="font-semibold text-sm text-[#1E1E2E]">{tpl.name}</span>
            </div>
            <p className="text-xs text-[#9090A8]">{tpl.description}</p>
            <p className="text-xs text-[#6B6B8A] mt-1 font-medium">
              תקציב חודשי כולל: {formatCurrency(Object.values(tpl.budgets).reduce((a, b) => a + b, 0))}
            </p>
          </button>
        ))}
      </div>

      {/* Preview + Apply */}
      {selected && (
        <div className="border border-lavender rounded-xl p-4 bg-lavender-light/30">
          <h4 className="text-sm font-semibold text-[#1E1E2E] mb-3">
            תצוגה מקדימה — {selected.emoji} {selected.name}
          </h4>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {Object.entries(selected.budgets).map(([catId, amount]) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <div key={catId} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[#4A4A60]">{cat.nameHe}</span>
                  </div>
                  <span className="font-semibold text-[#1E1E2E]">{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={applyTemplate}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              applied
                ? 'bg-green-100 text-green-700'
                : 'bg-lavender-dark text-white hover:bg-[#9088B8]'
            }`}
          >
            {applied ? '✓ הוחל בהצלחה' : `החל תבנית "${selected.name}" על החודש הנוכחי`}
          </button>
        </div>
      )}
    </div>
  );
}
