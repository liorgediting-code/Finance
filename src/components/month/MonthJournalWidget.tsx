import { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { HEBREW_MONTHS } from '../../config/months';

interface Props {
  monthIndex: number;
}

function NoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function MonthJournalWidget({ monthIndex }: Props) {
  const monthData = useFinanceStore((s) => s.months[monthIndex]);
  const updateMonthNote = useFinanceStore((s) => s.updateMonthNote);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const savedNote = monthData?.note ?? '';

  useEffect(() => {
    if (open) {
      setDraft(savedNote);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, savedNote]);

  const save = () => {
    updateMonthNote(monthIndex, draft.trim());
    setOpen(false);
  };

  return (
    <div dir="rtl">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
          savedNote
            ? 'border-lavender bg-lavender-light text-lavender-dark hover:bg-lavender'
            : 'border-gray-200 bg-white text-[#9090A8] hover:border-lavender hover:text-lavender-dark'
        }`}
        title="יומן חודשי"
      >
        <NoteIcon />
        {savedNote ? 'יומן' : 'הוסף הערה לחודש'}
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-xl border border-lavender shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1E1E2E]">
              יומן — {HEBREW_MONTHS[monthIndex]}
            </h3>
            <span className="text-[10px] text-[#9090A8]">הערות אישיות לחודש זה</span>
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="מה קרה החודש? הוצאות מיוחדות, אירועים, הערות לעצמך..."
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark resize-none placeholder:text-[#9090A8]"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-[#9090A8] hover:text-[#1E1E2E] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              onClick={save}
              className="text-xs bg-lavender-dark text-white px-4 py-1.5 rounded-lg hover:bg-[#5B52A0] transition-colors cursor-pointer font-medium"
            >
              שמור
            </button>
          </div>
        </div>
      )}

      {!open && savedNote && (
        <p
          className="mt-2 text-xs text-[#6B6B8A] bg-lavender-light border border-lavender rounded-lg px-3 py-2 cursor-pointer hover:bg-lavender transition-colors line-clamp-2"
          onClick={() => setOpen(true)}
          title={savedNote}
        >
          {savedNote}
        </p>
      )}
    </div>
  );
}
