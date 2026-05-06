import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewNetWorthTrackerCard() {
  const { netWorthHistory } = useFinanceStore(
    useShallow((s) => ({ netWorthHistory: s.netWorthHistory }))
  );

  const latest = netWorthHistory[netWorthHistory.length - 1];
  const prev = netWorthHistory[netWorthHistory.length - 2];
  const change = latest && prev ? latest.netWorth - prev.netWorth : null;
  const isPositive = change !== null ? change >= 0 : (latest ? latest.netWorth >= 0 : true);

  return (
    <NavLink to="/net-worth-tracker" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#7B6DC8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">📈</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">שווי נטו — היסטוריה</p>
        {latest ? (
          <>
            <p className={`text-sm font-bold mt-1 ${isPositive ? 'text-[#7B6DC8]' : 'text-red-500'}`}>
              {formatCurrency(latest.netWorth)}
            </p>
            {change !== null && (
              <p className={`text-xs mt-0.5 ${change >= 0 ? 'text-[#5A9A42]' : 'text-red-500'}`}>
                {change >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(change))}
              </p>
            )}
            <p className="text-[10px] text-[#9090A8] mt-0.5">{netWorthHistory.length} נקודות זמן</p>
          </>
        ) : (
          <p className="text-xs text-[#9090A8] mt-1">תיעוד שווי נטו →</p>
        )}
      </div>
    </NavLink>
  );
}
