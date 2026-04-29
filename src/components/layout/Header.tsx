import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'מבט-על',
  '/month': 'לוח חודשי',
  '/settings': 'הגדרות',
  '/admin': 'פאנל ניהול',
  '/search': 'חיפוש עסקאות',
  '/activity': 'יומן פעילות',
  '/life-goals': 'מטרות חיים',
  '/debt-planner': 'תכנון חובות',
  '/mortgage': 'משכנתא',
  '/installments': 'תשלומים',
  '/savings-vehicles': 'חסכונות ופנסיה',
  '/chag-budget': 'תקציב חגים',
  '/annual-planner': 'מתכנן שנתי',
  '/salary-slip': 'ניתוח תלוש',
  '/csv-import': 'ייבוא CSV',
  '/cashflow': 'תחזית תזרים',
};

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'ניהול פיננסי';
}

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#1E1E2E] tracking-tight md:hidden">
        {getPageTitle(pathname)}
      </h2>
    </header>
  );
}
