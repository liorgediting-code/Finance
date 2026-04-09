import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — on the right in RTL (flex default in RTL starts from right) */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
