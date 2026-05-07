import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewWishlistCard() {
  const wishlist = useFinanceStore(useShallow((s) => s.wishlist));
  const pending = wishlist.filter((w) => !w.purchased);
  const totalCost = pending.reduce((s, w) => s + w.cost, 0);
  const topItem = pending.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  })[0];

  return (
    <NavLink
      to="/wishlist"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#B0A8C8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🛍️</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">רשימת רצונות</p>
        {pending.length === 0 ? (
          <p className="text-sm text-[#1E1E2E] font-medium mt-1">ריקה — הוסף פריטים</p>
        ) : (
          <>
            <p className="text-sm text-[#1E1E2E] font-medium mt-1">
              {pending.length} פריטים • {formatCurrency(totalCost)}
            </p>
            {topItem && (
              <p className="text-xs text-[#9090A8] mt-0.5 truncate">
                הבא: {topItem.emoji} {topItem.name}
              </p>
            )}
          </>
        )}
        <p className="text-xs text-lavender-dark mt-1">תכנן רכישות →</p>
      </div>
    </NavLink>
  );
}
