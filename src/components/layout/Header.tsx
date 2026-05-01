import { useLocation } from 'react-router-dom';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'מבט-על';
  if (pathname === '/month') return 'לוח חודשי';
  if (pathname === '/savings') return 'חסכונות';
  if (pathname === '/settings') return 'הגדרות';
  if (pathname === '/admin') return 'פאנל ניהול';
  if (pathname === '/search') return 'חיפוש עסקאות';
  if (pathname === '/activity') return 'יומן פעילות';
  if (pathname === '/installments') return 'תשלומים';
  if (pathname === '/mortgage') return 'משכנתא';
  if (pathname === '/savings-vehicles') return 'חסכונות ופנסיה';
  if (pathname === '/debt-planner') return 'תכנון חובות';
  if (pathname === '/life-goals') return 'מטרות חיים';
  if (pathname === '/chag-budget') return 'תקציב חגים';
  if (pathname === '/annual-planner') return 'מתכנן שנתי';
  if (pathname === '/cashflow') return 'תחזית תזרים';
  if (pathname === '/salary-slip') return 'ניתוח תלוש';
  if (pathname === '/csv-import') return 'ייבוא CSV';
  if (pathname === '/insights') return 'תובנות חכמות';
  if (pathname === '/calendar') return 'לוח שנה פיננסי';
  if (pathname === '/savings-challenge') return 'אתגר חיסכון';
  if (pathname === '/year-review') return 'סיכום שנתי';
  if (pathname === '/achievements') return 'הישגים';
  return 'ניהול פיננסי';
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
