import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';

const CIRCUMFERENCE = 2 * Math.PI * 15.9;

function GoalRing({ emoji, name, pct }: { emoji: string; name: string; pct: number }) {
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="44" height="44" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r="15.9" fill="none" stroke="#EDE4F5" strokeWidth="4" />
        <circle
          cx="19" cy="19" r="15.9" fill="none"
          stroke="#9B72C0" strokeWidth="4"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 19 19)"
        />
        <text x="19" y="22" textAnchor="middle" fontSize="7" fill="#4A4A60" fontWeight="700">
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="text-[10px] text-[#6B6B8A] text-center leading-tight max-w-[44px]">
        {emoji} {name}
      </span>
    </div>
  );
}

export default function OverviewGoalsCard() {
  const lifeGoals = useFinanceStore(useShallow((s) => s.lifeGoals));

  const visible = lifeGoals.slice(0, 6);
  const overflow = lifeGoals.length - visible.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🎯 יעדי חיים</span>
        <NavLink to="/life-goals" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-3 justify-start">
          {visible.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
            return <GoalRing key={goal.id} emoji={goal.emoji} name={goal.name} pct={pct} />;
          })}
          {overflow > 0 && (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-[#9090A8]">+{overflow}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#9090A8]">אין יעדים מוגדרים</p>
      )}
    </div>
  );
}
