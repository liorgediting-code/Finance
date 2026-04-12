import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function BarChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const NAV = [
  { to: '/', label: 'לוח חודשי', icon: <CalendarIcon />, end: true },
  { to: '/savings', label: 'חסכונות', icon: <FlagIcon />, end: false },
];

export default function Sidebar({ isOpen, onClose }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const base =
    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer';
  const activeClass = 'bg-lavender text-[#5B52A0] font-semibold shadow-sm';
  const inactiveClass = 'text-[#4A4A60] hover:bg-lavender-light hover:text-[#2D2D2D]';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? activeClass : inactiveClass}`;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-60 flex-col bg-white border-l border-gray-100 shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-lavender text-[#5B52A0] flex-shrink-0">
            <BarChartIcon />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1E1E2E] leading-tight">ניהול פיננסי</h1>
            <p className="text-xs text-[#9090A8]">משפחתי</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={onClose}>
              {icon}
              {label}
            </NavLink>
          ))}

          {/* Settings pinned to bottom */}
          <div className="flex-1" />
          <div className="border-t border-gray-100 pt-2 flex flex-col gap-0.5">
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass} onClick={onClose}>
                <ShieldIcon />
                פאנל ניהול
              </NavLink>
            )}
            <NavLink to="/settings" className={navLinkClass} onClick={onClose}>
              <GearIcon />
              הגדרות
            </NavLink>
            {user && (
              <div className="px-3 py-2 mt-1 border-t border-gray-100">
                <p className="text-xs text-[#9090A8] truncate mb-1.5" dir="ltr">{user.email}</p>
                <button
                  onClick={() => { signOut(); onClose(); }}
                  className="text-xs text-[#9090A8] hover:text-red-500 transition-colors cursor-pointer"
                >
                  התנתקות
                </button>
              </div>
            )}
          </div>
          <div className="h-3" />
        </nav>
      </aside>
    </>
  );
}
