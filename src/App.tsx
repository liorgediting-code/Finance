import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './components/dashboard/DashboardPage'
import MonthPage from './components/month/MonthPage'
import SettingsPage from './components/settings/SettingsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/month/:monthIndex" element={<MonthPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
