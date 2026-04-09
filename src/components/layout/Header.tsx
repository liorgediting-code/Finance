import { useLocation } from 'react-router-dom';

interface Props {
  onMenuToggle: () => void;
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'לוח חודשי';
  if (pathname === '/savings') return 'חסכונות';
  if (pathname === '/settings') return 'הגדרות';
  return 'ניהול פיננסי';
}

export default function Header({ onMenuToggle }: Props) {
  const { pathname } = useLocation();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6 shadow-sm">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-[#4A4A60] hover:bg-lavender-light hover:text-[#5B52A0] transition-colors duration-150 cursor-pointer md:hidden"
        aria-label="פתח תפריט"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h2 className="text-base font-semibold text-[#1E1E2E] tracking-tight md:hidden">
        {getPageTitle(pathname)}
      </h2>
    </header>
  );
}
