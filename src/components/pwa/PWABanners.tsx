import { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] bg-amber-500 text-white text-center text-xs font-medium py-2 px-4 flex items-center justify-center gap-2"
      dir="rtl"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      אין חיבור לאינטרנט — השינויים יישמרו ברגע החיבור יחזור
    </div>
  );
}

export function InstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 inset-x-0 z-[90] flex justify-center px-4 pointer-events-none"
      dir="rtl"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 pointer-events-auto max-w-sm w-full">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-lavender-light flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-lavender-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1E1E2E]">התקן את האפליקציה</p>
          <p className="text-xs text-[#9090A8]">גישה מהירה ישירות ממסך הבית</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={install}
            className="bg-lavender-dark text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#5B52A0] transition-colors"
          >
            התקן
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#9090A8] text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
