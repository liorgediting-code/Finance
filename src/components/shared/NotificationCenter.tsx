import { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { computeAlerts } from '../../utils/notifications';

function BellIcon({ hasDot }: { hasDot: boolean }) {
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {hasDot && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const severityStyle = {
  warning: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', text: 'text-amber-800' },
  success: { bg: 'bg-green-50 border-green-200', dot: 'bg-green-400', text: 'text-green-800' },
  info:    { bg: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-400',   text: 'text-blue-800' },
};

export default function NotificationCenter() {
  const data = useFinanceStore(useShallow((s) => ({
    months: s.months,
    recurringExpenses: s.recurringExpenses,
    savingsFunds: s.savingsFunds,
    debts: s.debts,
    lifeGoals: s.lifeGoals,
    dismissedAlertIds: s.dismissedAlertIds,
  })));
  const dismissAlert = useFinanceStore((s) => s.dismissAlert);
  const clearDismissedAlerts = useFinanceStore((s) => s.clearDismissedAlerts);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentMonthIndex = new Date().getMonth();
  const allAlerts = computeAlerts({
    months: data.months,
    recurringExpenses: data.recurringExpenses,
    savingsFunds: data.savingsFunds,
    debts: data.debts,
    lifeGoals: data.lifeGoals,
    currentMonthIndex,
  });

  const visible = allAlerts.filter((a) => !data.dismissedAlertIds.includes(a.id));

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-[#6B6B8A] hover:text-[#1E1E2E]"
        title="התראות"
        aria-label="מרכז התראות"
      >
        <BellIcon hasDot={visible.length > 0} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          dir="rtl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1E1E2E]">התראות</h3>
            {data.dismissedAlertIds.length > 0 && (
              <button
                onClick={() => { clearDismissedAlerts(); }}
                className="text-[10px] text-lavender-dark hover:underline cursor-pointer"
              >
                הצג הכל
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-[#9090A8]">אין התראות חדשות</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {visible.map((alert) => {
                const style = severityStyle[alert.severity];
                return (
                  <div key={alert.id} className={`flex items-start gap-2 p-3 ${style.bg}`}>
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${style.text}`}>{alert.title}</p>
                      <p className="text-xs text-[#6B6B8A] mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[#9090A8] hover:text-[#1E1E2E] cursor-pointer p-0.5 flex-shrink-0 mt-0.5"
                      title="סגור"
                    >
                      <XIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
