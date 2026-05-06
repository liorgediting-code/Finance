import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';

const MEMBER_COLORS = ['#7B6DC8', '#4A90C0', '#5A9A42', '#C89E50', '#4AACAC', '#C85590'];

export default function OverviewMemberAnalysisCard() {
  const { familyMembers, months } = useFinanceStore(
    useShallow((s) => ({ familyMembers: s.familyMembers, months: s.months }))
  );

  const now = new Date();
  const monthData = months[now.getMonth()];
  const expenses = monthData?.expenses ?? [];

  // Quick breakdown
  const memberTotals = familyMembers.map((m, idx) => ({
    name: m.name,
    total: expenses.filter((e) => e.memberId === m.id).reduce((s, e) => s + e.amount, 0),
    color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
  })).filter((m) => m.total > 0);

  const grandTotal = memberTotals.reduce((s, m) => s + m.total, 0);

  return (
    <NavLink to="/member-analysis" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#7B6DC8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">👨‍👩‍👧</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">הוצאות לפי אדם</p>
        {memberTotals.length > 0 && grandTotal > 0 ? (
          <>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mt-2 mb-1">
              {memberTotals.map((m) => (
                <div
                  key={m.name}
                  className="h-full"
                  style={{ width: `${(m.total / grandTotal) * 100}%`, backgroundColor: m.color }}
                />
              ))}
            </div>
            <p className="text-xs text-[#9090A8]">{memberTotals.length} בני משפחה עם הוצאות</p>
          </>
        ) : (
          <p className="text-xs text-[#9090A8] mt-1">ניתוח הוצאות למשפחה →</p>
        )}
      </div>
    </NavLink>
  );
}
