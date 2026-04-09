import { useLocation, useParams } from 'react-router-dom';
import { HEBREW_MONTHS } from '../../config/months';

interface Props {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: Props) {
  const location = useLocation();
  const params = useParams<{ monthIndex: string }>();

  function getPageTitle(): string {
    if (location.pathname === '/') return 'לוח בקרה';
    if (location.pathname === '/settings') return 'הגדרות';

    if (params.monthIndex !== undefined) {
      const idx = Number(params.monthIndex);
      if (idx >= 0 && idx < HEBREW_MONTHS.length) {
        return HEBREW_MONTHS[idx];
      }
    }

    return 'לוח בקרה';
  }

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

      <h2 className="text-lg font-semibold text-[#1E1E2E] tracking-tight">
        {getPageTitle()}
      </h2>
    </header>
  );
}
