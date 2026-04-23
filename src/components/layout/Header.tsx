import { useLocation } from 'react-router-dom';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'לוח חודשי';
  if (pathname === '/savings') return 'חסכונות';
  if (pathname === '/settings') return 'הגדרות';
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
