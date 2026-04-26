import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';

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

function LayersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashSmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function PlusSmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function DebtIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function PiggyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8.5 3.1 1.2 4.1.2.3.4.8.2 1.2L6 19h3l.5-2h2l.5 2h3l.5-2h1.5c1.5 0 3-1.5 3-3 0-1-.5-2-1.3-2.6.3-.5.8-1.4.8-2.4 0-2-1.5-3-1.5-3z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CalendarAnnualIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="18" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="16" y1="14" x2="16" y2="18" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  const activeBoardId = useFinanceStore((s) => s.activeBoardId);
  const extraBoards = useFinanceStore((s) => s.extraBoards);
  const setActiveBoard = useFinanceStore((s) => s.setActiveBoard);
  const addBoard = useFinanceStore((s) => s.addBoard);
  const renameBoard = useFinanceStore((s) => s.renameBoard);
  const deleteBoard = useFinanceStore((s) => s.deleteBoard);

  const [newBoardName, setNewBoardName] = useState('');
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleAddBoard = () => {
    const name = newBoardName.trim();
    if (!name) return;
    addBoard(name);
    setNewBoardName('');
    setShowAddBoard(false);
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      renameBoard(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

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
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {/* Boards section */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider px-3 mb-1">לוחות</p>

            {/* Overall board */}
            <button
              onClick={() => { setActiveBoard('overall'); onClose(); }}
              className={`${base} w-full text-right ${activeBoardId === 'overall' ? activeClass : inactiveClass}`}
            >
              <LayersIcon />
              כללי
            </button>

            {/* Personal board */}
            <button
              onClick={() => { setActiveBoard('personal'); onClose(); }}
              className={`${base} w-full text-right ${activeBoardId === 'personal' ? activeClass : inactiveClass}`}
            >
              <CalendarIcon />
              אישי
            </button>

            {/* Extra boards */}
            {extraBoards.map((board) => (
              <div key={board.id} className="group relative">
                {renamingId === board.id ? (
                  <div className="flex items-center gap-1 px-3 py-1.5">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenamingId(null); }}
                      className="flex-1 border border-lavender-dark rounded px-2 py-0.5 text-sm focus:outline-none min-w-0"
                      dir="rtl"
                    />
                    <button onClick={saveRename} className="text-[10px] text-white bg-lavender-dark px-1.5 py-0.5 rounded cursor-pointer">שמור</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveBoard(board.id); onClose(); }}
                    className={`${base} w-full text-right pr-3 pl-14 ${activeBoardId === board.id ? activeClass : inactiveClass}`}
                  >
                    <CalendarIcon />
                    {board.name}
                  </button>
                )}
                {renamingId !== board.id && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(board.id, board.name); }}
                      className="text-[#9090A8] hover:text-[#5B52A0] p-0.5 rounded cursor-pointer"
                      title="שנה שם"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`למחוק את הלוח "${board.name}"? כל הנתונים יימחקו.`)) {
                          if (activeBoardId === board.id) setActiveBoard('personal');
                          deleteBoard(board.id);
                        }
                      }}
                      className="text-[#9090A8] hover:text-red-500 p-0.5 rounded cursor-pointer"
                      title="מחק לוח"
                    >
                      <TrashSmIcon />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add board */}
            {showAddBoard ? (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <input
                  autoFocus
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddBoard(); if (e.key === 'Escape') { setShowAddBoard(false); setNewBoardName(''); } }}
                  placeholder="שם הלוח"
                  className="flex-1 border border-lavender-dark rounded px-2 py-0.5 text-sm focus:outline-none min-w-0"
                  dir="rtl"
                />
                <button onClick={handleAddBoard} className="text-[10px] text-white bg-lavender-dark px-1.5 py-0.5 rounded cursor-pointer">הוסף</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddBoard(true)}
                className={`${base} w-full text-right text-[#9090A8] hover:text-[#5B52A0] hover:bg-lavender-light text-xs`}
              >
                <PlusSmIcon />
                הוסף לוח
              </button>
            )}
          </div>

          {/* Tools section */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider px-3 mb-1 mt-2">כלים</p>
            <NavLink to="/search" className={navLinkClass} onClick={onClose}>
              <SearchIcon />
              חיפוש עסקאות
            </NavLink>
            <NavLink to="/cashflow" className={navLinkClass} onClick={onClose}>
              <TrendingIcon />
              תחזית תזרים
            </NavLink>
            <NavLink to="/life-goals" className={navLinkClass} onClick={onClose}>
              <TargetIcon />
              מטרות חיים
            </NavLink>
            <NavLink to="/debt-planner" className={navLinkClass} onClick={onClose}>
              <DebtIcon />
              תכנון חובות
            </NavLink>
            <NavLink to="/mortgage" className={navLinkClass} onClick={onClose}>
              <HomeIcon />
              משכנתא
            </NavLink>
            <NavLink to="/installments" className={navLinkClass} onClick={onClose}>
              <CreditCardIcon />
              תשלומים
            </NavLink>
            <NavLink to="/savings-vehicles" className={navLinkClass} onClick={onClose}>
              <PiggyIcon />
              חסכונות ופנסיה
            </NavLink>
            <NavLink to="/chag-budget" className={navLinkClass} onClick={onClose}>
              <StarIcon />
              תקציב חגים
            </NavLink>
            <NavLink to="/annual-planner" className={navLinkClass} onClick={onClose}>
              <CalendarAnnualIcon />
              מתכנן שנתי
            </NavLink>
            <NavLink to="/salary-slip" className={navLinkClass} onClick={onClose}>
              <DocumentIcon />
              ניתוח תלוש
            </NavLink>
            <NavLink to="/csv-import" className={navLinkClass} onClick={onClose}>
              <UploadIcon />
              ייבוא CSV
            </NavLink>
            <NavLink to="/activity" className={navLinkClass} onClick={onClose}>
              <ActivityIcon />
              יומן פעילות
            </NavLink>
          </div>

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
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-lavender text-[#5B52A0] text-xs font-bold flex-shrink-0">
                    {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1E1E2E] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש'}
                    </p>
                    <p className="text-[10px] text-[#9090A8] truncate" dir="ltr">{user.email}</p>
                  </div>
                </div>
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
