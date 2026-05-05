import { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import OnboardingWizard from '../onboarding/OnboardingWizard';
import { OfflineBanner, InstallBanner } from '../pwa/PWABanners';
import QuickAddModal from '../shared/QuickAddModal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';

interface Props {
  children: React.ReactNode;
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const enabledModules = useFinanceStore(useShallow((s) => s.settings.enabledModules ?? []));
  const showQuickAdd = enabledModules.includes('quick-add');

  return (
    <div className="flex h-screen overflow-hidden">
      <OfflineBanner />
      <InstallBanner />
      <OnboardingWizard />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />

      {/* Quick Add FAB — feature: quick-add module */}
      {showQuickAdd && (
        <button
          onClick={() => setQuickAddOpen(true)}
          className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-30 w-14 h-14 rounded-full bg-blush-dark text-white shadow-lg flex items-center justify-center hover:bg-[#7B5AA0] hover:scale-110 transition-all duration-200 cursor-pointer"
          title="הוספה מהירה"
          aria-label="הוסף הוצאה מהירה"
        >
          <PlusIcon />
        </button>
      )}

      {quickAddOpen && <QuickAddModal onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}
