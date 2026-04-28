import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import type { Board } from '../../types';

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function OverviewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

function PaletteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#7B6DC8',
  '#4A90C0',
  '#5A9A42',
  '#E06060',
  '#C89E50',
  '#4AACAC',
  '#C85590',
  '#C8A830',
];

const PERSONAL_COLOR = '#7B6DC8';
const OVERALL_COLOR = '#4A90C0';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBoardColor(activeBoardId: string, extraBoards: Board[]): string {
  if (activeBoardId === 'personal') return PERSONAL_COLOR;
  if (activeBoardId === 'overall') return OVERALL_COLOR;
  return extraBoards.find((b) => b.id === activeBoardId)?.color ?? PERSONAL_COLOR;
}

function getBoardName(activeBoardId: string, extraBoards: Board[]): string {
  if (activeBoardId === 'personal') return 'אישי';
  if (activeBoardId === 'overall') return 'כללי';
  return extraBoards.find((b) => b.id === activeBoardId)?.name ?? 'לוח';
}

// ── BoardsSheet ───────────────────────────────────────────────────────────────

function BoardsSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const activeBoardId = useFinanceStore((s) => s.activeBoardId);
  const extraBoards = useFinanceStore((s) => s.extraBoards);
  const setActiveBoard = useFinanceStore((s) => s.setActiveBoard);
  const addBoard = useFinanceStore((s) => s.addBoard);
  const deleteBoard = useFinanceStore((s) => s.deleteBoard);
  const setBoardColor = useFinanceStore((s) => s.setBoardColor);

  const [newBoardName, setNewBoardName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  const handleAdd = () => {
    const name = newBoardName.trim();
    if (!name) return;
    addBoard(name);
    setNewBoardName('');
    setShowAdd(false);
  };

  const selectBoard = (id: string) => {
    setActiveBoard(id);
    navigate('/month');
    onClose();
  };

  const rowBase = 'flex items-center gap-3 w-full px-4 py-3.5 text-right text-sm transition-colors';

  const getRowStyle = (id: string, color: string): React.CSSProperties => {
    const isActive = activeBoardId === id;
    return {
      backgroundColor: isActive ? color + '18' : 'transparent',
      color: isActive ? color : '#1E1E2E',
      fontWeight: isActive ? '600' : '400',
    };
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#1E1E2E]">לוחות</h3>
          <button onClick={onClose} className="text-[#9090A8] text-xs px-2 py-1 rounded-lg active:bg-gray-100 cursor-pointer">
            סגור
          </button>
        </div>

        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {/* Overall */}
          <button onClick={() => selectBoard('overall')} className={rowBase} style={getRowStyle('overall', OVERALL_COLOR)}>
            <span style={{ color: OVERALL_COLOR }}><LayersIcon /></span>
            <span className="flex-1">כללי</span>
            {activeBoardId === 'overall' && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: OVERALL_COLOR }} />
            )}
          </button>

          {/* Personal */}
          <button onClick={() => selectBoard('personal')} className={rowBase} style={getRowStyle('personal', PERSONAL_COLOR)}>
            <span style={{ color: PERSONAL_COLOR }}><CalendarIcon /></span>
            <span className="flex-1">אישי</span>
            {activeBoardId === 'personal' && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERSONAL_COLOR }} />
            )}
          </button>

          {/* Extra boards */}
          {extraBoards.map((board) => {
            const color = board.color ?? PRESET_COLORS[1];
            const isPickerOpen = colorPickerFor === board.id;
            return (
              <div key={board.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => selectBoard(board.id)}
                    className={`${rowBase} flex-1`}
                    style={getRowStyle(board.id, color)}
                  >
                    <span style={{ color }}><CalendarIcon /></span>
                    <span className="flex-1">{board.name}</span>
                    {activeBoardId === board.id && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorPickerFor(isPickerOpen ? null : board.id);
                    }}
                    className="px-2 py-3.5 text-[#9090A8] active:text-[#5B52A0] cursor-pointer"
                    style={isPickerOpen ? { color } : undefined}
                  >
                    <PaletteIcon />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`למחוק את הלוח "${board.name}"? כל הנתונים יימחקו.`)) {
                        if (activeBoardId === board.id) setActiveBoard('personal');
                        deleteBoard(board.id);
                      }
                    }}
                    className="px-3 py-3.5 text-[#9090A8] active:text-red-500 cursor-pointer"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {isPickerOpen && (
                  <div className="px-4 py-2.5 bg-gray-50 flex gap-2.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setBoardColor(board.id, c); setColorPickerFor(null); }}
                        className="w-7 h-7 rounded-full cursor-pointer transition-transform active:scale-90"
                        style={{
                          backgroundColor: c,
                          boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add board */}
        <div className="px-4 pt-3 pb-2 border-t border-gray-100">
          {showAdd ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setShowAdd(false); setNewBoardName(''); }
                }}
                placeholder="שם הלוח"
                className="flex-1 border border-[#7B6DC8] rounded-lg px-3 py-2 text-sm focus:outline-none"
                dir="rtl"
              />
              <button onClick={handleAdd} className="bg-[#7B6DC8] text-white text-sm px-4 py-2 rounded-lg cursor-pointer font-medium">
                הוסף
              </button>
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

// ── BottomNav ─────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const [showBoards, setShowBoards] = useState(false);
  const { pathname } = useLocation();
  const activeBoardId = useFinanceStore((s) => s.activeBoardId);
  const extraBoards = useFinanceStore((s) => s.extraBoards);
  const setActiveBoard = useFinanceStore((s) => s.setActiveBoard);

  const boardColor = getBoardColor(activeBoardId, extraBoards);
  const boardName = getBoardName(activeBoardId, extraBoards);
  const onNonPersonalBoard = activeBoardId !== 'personal';
  const boardsTabActive = showBoards || onNonPersonalBoard;

  const base = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors duration-150 min-w-0 overflow-hidden';

  return (
    <>
      {showBoards && <BoardsSheet onClose={() => setShowBoards(false)} />}

      <nav
        aria-label="ניווט ראשי"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Colored indicator strip — reflects active board */}
        <div
          className="h-0.5 w-full transition-colors duration-300"
          style={{ backgroundColor: boardColor }}
        />

        <div className="flex w-full">
          {/* Overview tab */}
          <NavLink
            to="/"
            end
            className={base}
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150"
                  style={isActive ? { backgroundColor: PERSONAL_COLOR + '20', color: PERSONAL_COLOR } : { color: '#9090A8' }}
                >
                  <OverviewIcon />
                </span>
                <span
                  className={isActive ? 'font-semibold' : ''}
                  style={{ color: isActive ? PERSONAL_COLOR : '#9090A8' }}
                >
                  מבט-על
                </span>
              </>
            )}
          </NavLink>

          {/* Personal tab */}
          <NavLink
            to="/month"
            onClick={() => setActiveBoard('personal')}
            className={base}
          >
            {({ isActive }) => {
              const active = isActive && !onNonPersonalBoard && !showBoards;
              return (
                <>
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150"
                    style={active ? { backgroundColor: PERSONAL_COLOR + '20', color: PERSONAL_COLOR } : { color: '#9090A8' }}
                  >
                    <CalendarIcon />
                  </span>
                  <span
                    className={active ? 'font-semibold' : ''}
                    style={{ color: active ? PERSONAL_COLOR : '#9090A8' }}
                  >
                    חודשי
                  </span>
                </>
              );
            }}
          </NavLink>

          {/* Boards tab — shows active board name when not on personal */}
          <button
            onClick={() => setShowBoards(true)}
            className={`${base} cursor-pointer`}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150"
              style={boardsTabActive ? { backgroundColor: boardColor + '20', color: boardColor } : { color: '#9090A8' }}
            >
              <LayersIcon />
            </span>
            <span
              className={`truncate max-w-[80px] leading-tight ${boardsTabActive ? 'font-semibold' : ''}`}
              style={{ color: boardsTabActive ? boardColor : '#9090A8' }}
            >
              {boardsTabActive ? boardName : 'לוחות'}
            </span>
          </button>

          {/* Tools tab */}
          <NavLink
            to="/search"
            className={base}
          >
            {() => {
              const toolRoutes = ['/life-goals', '/debt-planner', '/mortgage', '/installments', '/savings-vehicles', '/chag-budget', '/annual-planner', '/salary-slip', '/csv-import', '/cashflow', '/search', '/activity'];
              const toolActive = toolRoutes.some((r) => pathname === r);
              return (
                <>
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150"
                    style={toolActive ? { backgroundColor: PERSONAL_COLOR + '20', color: PERSONAL_COLOR } : { color: '#9090A8' }}
                  >
                    <ToolsIcon />
                  </span>
                  <span
                    className={toolActive ? 'font-semibold' : ''}
                    style={{ color: toolActive ? PERSONAL_COLOR : '#9090A8' }}
                  >
                    כלים
                  </span>
                </>
              );
            }}
          </NavLink>

          {/* Settings tab */}
          <NavLink
            to="/settings"
            className={base}
          >
            {({ isActive }) => (
              <>
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150"
                  style={isActive ? { backgroundColor: PERSONAL_COLOR + '20', color: PERSONAL_COLOR } : { color: '#9090A8' }}
                >
                  <GearIcon />
                </span>
                <span
                  className={isActive ? 'font-semibold' : ''}
                  style={{ color: isActive ? PERSONAL_COLOR : '#9090A8' }}
                >
                  הגדרות
                </span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
}
