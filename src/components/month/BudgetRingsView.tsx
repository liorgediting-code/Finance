import { formatCurrency } from '../../utils/formatters';

interface RingRow {
  id: string;
  nameHe: string;
  color: string;
  actual: number;
  budgetAmt: number;
  pct: number;
}

interface Props {
  rows: RingRow[];
}

function Ring({ row }: { row: RingRow }) {
  const R = 28;
  const circumference = 2 * Math.PI * R;
  const filled = Math.min(row.pct, 100);
  const dashOffset = circumference - (filled / 100) * circumference;
  const isOver = row.pct >= 100;
  const isNear = row.pct >= 80 && row.pct < 100;
  const ringColor = isOver ? '#EF4444' : isNear ? '#F59E0B' : row.color;
  const bgColor = isOver ? '#FEE2E2' : isNear ? '#FEF3C7' : '#F3F4F6';

  return (
    <div className="flex flex-col items-center gap-1.5 p-2">
      <div className="relative" style={{ width: 72, height: 72 }}>
        {/* Background ring */}
        <svg width="72" height="72" viewBox="0 0 72 72" className="rotate-[-90deg]">
          <circle cx="36" cy="36" r={R} fill={bgColor} stroke="#E5E7EB" strokeWidth="7" />
          {row.budgetAmt > 0 && (
            <circle
              cx="36"
              cy="36"
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {row.budgetAmt > 0 ? (
            <span className={`text-[11px] font-bold leading-none ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-[#1E1E2E]'}`}>
              {row.pct}%
            </span>
          ) : (
            <span className="text-[10px] text-[#9090A8]">אין</span>
          )}
        </div>
        {/* Color dot */}
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: row.color }} />
      </div>
      <div className="text-center w-full max-w-[88px]">
        <p className="text-[11px] font-semibold text-[#1E1E2E] truncate">{row.nameHe}</p>
        <p className={`text-[10px] leading-tight ${isOver ? 'text-red-600 font-semibold' : 'text-[#6B6B8A]'}`}>
          {formatCurrency(row.actual)}
        </p>
        {row.budgetAmt > 0 && (
          <p className="text-[9px] text-[#9090A8]">מתוך {formatCurrency(row.budgetAmt)}</p>
        )}
      </div>
    </div>
  );
}

export default function BudgetRingsView({ rows }: Props) {
  const budgetedRows = rows.filter((r) => r.budgetAmt > 0 || r.actual > 0);

  if (budgetedRows.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[#9090A8]">
        אין תקציב מוגדר — הגדר תקציב לקטגוריות כדי לראות את הטבעות
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 py-3">
      {budgetedRows.map((row) => (
        <Ring key={row.id} row={row} />
      ))}
    </div>
  );
}
