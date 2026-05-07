import { useLocation } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import NotificationCenter from '../shared/NotificationCenter';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'מבט-על';
  if (pathname === '/month') return 'לוח חודשי';
  if (pathname === '/settings') return 'הגדרות';
  if (pathname === '/search') return 'חיפוש עסקאות';
  if (pathname === '/activity') return 'יומן פעילות';
  if (pathname === '/insights') return 'תובנות חכמות';
  if (pathname === '/installments') return 'תשלומים';
  if (pathname === '/mortgage') return 'משכנתא';
  if (pathname === '/savings-vehicles') return 'חסכונות ופנסיה';
  if (pathname === '/debt-planner') return 'תכנון חובות';
  if (pathname === '/life-goals') return 'מטרות חיים';
  if (pathname === '/chag-budget') return 'תקציב חגים';
  if (pathname === '/annual-planner') return 'מתכנן שנתי';
  if (pathname === '/cashflow') return 'תחזית תזרים';
  if (pathname === '/csv-import') return 'ייבוא CSV';
  if (pathname === '/calendar') return 'לוח שנה פיננסי';
  if (pathname === '/savings-challenge') return 'אתגר חיסכון';
  if (pathname === '/year-review') return 'סיכום שנתי';
  if (pathname === '/achievements') return 'הישגים';
  if (pathname === '/subscriptions' || pathname === '/subscription-audit') return 'ביקורת מנויים';
  if (pathname === '/upcoming-payments') return 'תשלומים קרובים';
  if (pathname === '/tax-refund') return 'החזר מס';
  if (pathname === '/report-card') return 'כרטיס ציון';
  if (pathname === '/spending-trends') return 'מגמות הוצאות';
  if (pathname === '/emergency-fund') return 'קרן חירום';
  if (pathname === '/member-analysis') return 'ניתוח פר חבר';
  if (pathname === '/goal-simulator') return 'סימולטור יעדים';
  if (pathname === '/net-worth-tracker') return 'מעקב שווי נטו';
  if (pathname === '/salary-slip') return 'ניתוח תלוש';
  if (pathname === '/admin') return 'פאנל ניהול';
  if (pathname === '/wishlist') return 'רשימת רצונות';
  return 'ניהול פיננסי';
}

export default function Header() {
  const { pathname } = useLocation();
  const enabledModules = useFinanceStore((s) => s.settings.enabledModules ?? []);
  const showAlerts = enabledModules.includes('smart-alerts');

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#1E1E2E] tracking-tight md:hidden">
        {getPageTitle(pathname)}
      </h2>
      {showAlerts && (
        <div className="flex items-center">
          <NotificationCenter />
        </div>
      )}
    </header>
  );
}

