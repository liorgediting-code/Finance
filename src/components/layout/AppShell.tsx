import { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import OnboardingWizard from '../onboarding/OnboardingWizard';
import { OfflineBanner, InstallBanner } from '../pwa/PWABanners';
import QuickAddFAB from '../shared/QuickAddFAB';

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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
      <QuickAddFAB />
    </div>
  );
}
