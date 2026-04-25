import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function BoardsSheet({ onClose }: { onClose: () => void }) {
  const activeBoardId = useFinanceStore((s) => s.activeBoardId);
  const extraBoards = useFinanceStore((s) => s.extraBoards);
  const setActiveBoard = useFinanceStore((s) => s.setActiveBoard);
  const addBoard = useFinanceStore((s) => s.addBoard);
  const deleteBoard = useFinanceStore((s) => s.deleteBoard);

  const [newBoardName, setNewBoardName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    const name = newBoardName.trim();
    if (!name) return;
    addBoard(name);
    setNewBoardName('');
    setShowAdd(false);
  };

  const selectBoard = (id: string) => {
    setActiveBoard(id);
    onClose();
  };

  const rowBase = 'flex items-center gap-3 w-full px-4 py-3.5 text-right text-sm transition-colors';
  const activeRow = 'bg-lavender text-[#5B52A0] font-semibold';
  const inactiveRow = 'text-[#1E1E2E] active:bg-lavender-light';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-xl pb-safe" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1E1E2E]">לוחות</h3>
          <button onClick={onClose} className="text-[#9090A8] text-xs px-2 py-1 rounded-lg active:bg-gray-100 cursor-pointer">סגור</button>
        </div>

        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {/* Overall */}
          <button onClick={() => selectBoard('overall')} className={`${rowBase} ${activeBoardId === 'overall' ? activeRow : inactiveRow}`}>
            <LayersIcon />
            כללי
          </button>

          {/* Personal */}
          <button onClick={() => selectBoard('personal')} className={`${rowBase} ${activeBoardId === 'personal' ? activeRow : inactiveRow}`}>
            <CalendarIcon />
            אישי
          </button>

          {/* Extra boards */}
          {extraBoards.map((board) => (
            <div key={board.id} className="flex items-center">
              <button onClick={() => selectBoard(board.id)} className={`${rowBase} flex-1 ${activeBoardId === board.id ? activeRow : inactiveRow}`}>
                <CalendarIcon />
                {board.name}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`למחוק את הלוח "${board.name}"? כל הנתונים יימחקו.`)) {
                    if (activeBoardId === board.id) setActiveBoard('personal');
                    deleteBoard(board.id);
                  }
                }}
                className="px-4 py-3.5 text-[#9090A8] active:text-red-500 cursor-pointer"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Add board */}
        <div className="px-4 pt-3 pb-2 border-t border-gray-100">
          {showAdd ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setNewBoardName(''); } }}
                placeholder="שם הלוח"
                className="flex-1 border border-lavender-dark rounded-lg px-3 py-2 text-sm focus:outline-none"
                dir="rtl"
              />
              <button onClick={handleAdd} className="bg-lavender-dark text-white text-sm px-4 py-2 rounded-lg cursor-pointer font-medium">הוסף</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-sm text-[#5B52A0] font-medium py-2 cursor-pointer"
            >
              <PlusIcon />
              הוסף לוח חדש
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function BottomNav() {
  const [showBoards, setShowBoards] = useState(false);
  const activeBoardId = useFinanceStore((s) => s.activeBoardId);

  const base = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors duration-150';
  const activeClass = 'text-[#5B52A0] font-semibold';
  const inactiveClass = 'text-[#9090A8]';

  const boardsActive = showBoards || activeBoardId !== 'personal';

  return (
    <>
      {showBoards && <BoardsSheet onClose={() => setShowBoards(false)} />}

      <nav
        aria-label="ניווט ראשי"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white border-t border-gray-100 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${base} ${isActive && activeBoardId === 'personal' ? activeClass : inactiveClass}`}
        >
          {({ isActive }) => (
            <>
              <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${isActive && activeBoardId === 'personal' ? 'bg-lavender' : ''}`}>
                <CalendarIcon />
              </span>
              <span>אישי</span>
            </>
          )}
        </NavLink>

        <button
          onClick={() => setShowBoards(true)}
          className={`${base} cursor-pointer ${boardsActive ? activeClass : inactiveClass}`}
        >
          <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${boardsActive ? 'bg-lavender' : ''}`}>
            <LayersIcon />
          </span>
          <span>לוחות</span>
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) => `${base} ${isActive ? activeClass : inactiveClass}`}
        >
          {({ isActive }) => (
            <>
              <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${isActive ? 'bg-lavender' : ''}`}>
                <GearIcon />
              </span>
              <span>הגדרות</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
}
