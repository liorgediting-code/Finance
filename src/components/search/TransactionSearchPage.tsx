import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES, PAYMENT_METHODS } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';
import { HEBREW_MONTHS } from '../../config/months';
import type { ExpenseEntry, IncomeEntry } from '../../types';

interface ExpenseResult {
  type: 'expense';
  monthIndex: number;
  entry: ExpenseEntry;
}
interface IncomeResult {
  type: 'income';
  monthIndex: number;
  entry: IncomeEntry;
}
type SearchResult = ExpenseResult | IncomeResult;

function getSubName(entry: ExpenseEntry): string {
  if (entry.categoryId === 'other' && entry.customCategory?.trim()) return entry.customCategory.trim();
  const cat = CATEGORIES.find((c) => c.id === entry.categoryId);
  return cat?.subcategories.find((s) => s.id === entry.subcategoryId)?.nameHe ?? '';
}

function getCatName(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.nameHe ?? categoryId;
}

function getCatColor(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.color ?? '#9090A8';
}

function getPaymentName(method: string): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.nameHe ?? method;
}

export default function TransactionSearchPage() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const year = useFinanceStore((s) => s.settings.year);

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMember, setFilterMember] = useState('');

  const q = query.trim().toLowerCase();

  const results: SearchResult[] = [];

  // Search across all months
  for (let mi = 0; mi <= 11; mi++) {
    const md = months[mi];
    if (!md) continue;

    if (filterType !== 'income') {
      const allExpenses = mi === 0 ? [...recurringExpenses, ...(md.expenses ?? [])] : (md.expenses ?? []);
      for (const entry of allExpenses) {
        if (filterCategory && entry.categoryId !== filterCategory) continue;
        if (filterMember && entry.memberId !== filterMember) continue;
        if (q) {
          const catName = getCatName(entry.categoryId).toLowerCase();
          const subName = getSubName(entry).toLowerCase();
          if (
            !entry.description.toLowerCase().includes(q) &&
            !catName.includes(q) &&
            !subName.includes(q) &&
            !String(entry.amount).includes(q) &&
            !entry.notes.toLowerCase().includes(q)
          ) continue;
        }
        results.push({ type: 'expense', monthIndex: mi, entry });
      }
    }

    if (filterType !== 'expense') {
      const allIncome = mi === 0 ? [...recurringIncomes, ...(md.income ?? [])] : (md.income ?? []);
      for (const entry of allIncome) {
        if (filterMember && entry.memberId !== filterMember) continue;
        if (q) {
          if (
            !entry.source.toLowerCase().includes(q) &&
            !String(entry.amount).includes(q) &&
            !entry.notes.toLowerCase().includes(q)
          ) continue;
        }
        results.push({ type: 'income', monthIndex: mi, entry });
      }
    }
  }

  // Also search recurring arrays not tied to a month
  if (filterType !== 'income') {
    for (const entry of recurringExpenses) {
      if (filterCategory && entry.categoryId !== filterCategory) continue;
      if (filterMember && entry.memberId !== filterMember) continue;
      if (q) {
        const catName = getCatName(entry.categoryId).toLowerCase();
        if (
          !entry.description.toLowerCase().includes(q) &&
          !catName.includes(q) &&
          !String(entry.amount).includes(q)
        ) continue;
      }
      if (!results.find((r) => r.type === 'expense' && r.entry.id === entry.id)) {
        results.push({ type: 'expense', monthIndex: -1, entry });
      }
    }
  }

  // Sort by month desc, then date desc
  results.sort((a, b) => {
    if (b.monthIndex !== a.monthIndex) return b.monthIndex - a.monthIndex;
    return b.entry.date.localeCompare(a.entry.date);
  });

  const totalExpenses = results
    .filter((r): r is ExpenseResult => r.type === 'expense' && !r.entry.isPending)
    .reduce((s, r) => s + r.entry.amount, 0);
  const totalIncome = results
    .filter((r): r is IncomeResult => r.type === 'income')
    .reduce((s, r) => s + r.entry.amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-xl font-bold text-[#1E1E2E] mb-5">חיפוש עסקאות</h1>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="relative mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9090A8] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="חפש לפי תיאור, קטגוריה, סכום..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full border border-gray-300 rounded-lg pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'expense' | 'income')}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#4A4A60] cursor-pointer"
          >
            <option value="all">הכל</option>
            <option value="expense">הוצאות</option>
            <option value="income">הכנסות</option>
          </select>

          {filterType !== 'income' && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#4A4A60] cursor-pointer"
            >
              <option value="">כל הקטגוריות</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nameHe}</option>)}
            </select>
          )}

          {familyMembers.length > 0 && (
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#4A4A60] cursor-pointer"
            >
              <option value="">כל בני המשפחה</option>
              {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}

          {(query || filterType !== 'all' || filterCategory || filterMember) && (
            <button
              onClick={() => { setQuery(''); setFilterType('all'); setFilterCategory(''); setFilterMember(''); }}
              className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2.5 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              נקה
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-sm shadow-sm">
            <span className="text-[#9090A8] text-xs">תוצאות</span>
            <span className="font-bold text-[#1E1E2E] mr-2">{results.length}</span>
          </div>
          {totalExpenses > 0 && (
            <div className="bg-blush-light rounded-lg border border-gray-100 px-3 py-2 text-sm shadow-sm">
              <span className="text-[#9090A8] text-xs">סה&quot;כ הוצאות</span>
              <span className="font-bold text-[#1E1E2E] mr-2">{formatCurrency(totalExpenses)}</span>
            </div>
          )}
          {totalIncome > 0 && (
            <div className="bg-sage-light rounded-lg border border-gray-100 px-3 py-2 text-sm shadow-sm">
              <span className="text-[#9090A8] text-xs">סה&quot;כ הכנסות</span>
              <span className="font-bold text-[#1E1E2E] mr-2">{formatCurrency(totalIncome)}</span>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-sm">{query || filterCategory ? 'לא נמצאו תוצאות' : 'הזן מילת חיפוש כדי להתחיל'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {results.map((result, idx) => {
              const monthLabel = result.monthIndex >= 0
                ? `${HEBREW_MONTHS[result.monthIndex]} ${year}`
                : 'קבוע';

              if (result.type === 'expense') {
                const { entry } = result;
                const color = getCatColor(entry.categoryId);
                return (
                  <div key={`e-${entry.id}-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1E1E2E] truncate">
                          {entry.description || getCatName(entry.categoryId)}
                        </span>
                        <span className="text-xs text-[#9090A8] bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {getCatName(entry.categoryId)} / {getSubName(entry)}
                        </span>
                        {entry.isPending && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">ממתין</span>
                        )}
                        {entry.isRecurring && (
                          <span className="text-[10px] bg-blush-light text-[#7B5AA0] px-1.5 py-0.5 rounded-full font-medium">קבוע</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9090A8]">
                        <span>{entry.date}</span>
                        <span>{getPaymentName(entry.paymentMethod)}</span>
                        <span className="text-[#C89E50] font-medium">{monthLabel}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-[#1E1E2E] text-sm flex-shrink-0">{formatCurrency(entry.amount)}</span>
                  </div>
                );
              } else {
                const { entry } = result;
                const memberName = familyMembers.find((m) => m.id === entry.memberId)?.name ?? '';
                return (
                  <div key={`i-${entry.id}-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 bg-sage-dark" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1E1E2E] truncate">{entry.source}</span>
                        {memberName && (
                          <span className="text-xs text-[#9090A8] bg-gray-100 px-1.5 py-0.5 rounded-full">{memberName}</span>
                        )}
                        {entry.isRecurring && (
                          <span className="text-[10px] bg-sage-light text-sage-dark px-1.5 py-0.5 rounded-full font-medium">קבוע</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#9090A8]">
                        <span>{entry.date}</span>
                        <span className="text-[#C89E50] font-medium">{monthLabel}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-sage-dark text-sm flex-shrink-0">+{formatCurrency(entry.amount)}</span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
