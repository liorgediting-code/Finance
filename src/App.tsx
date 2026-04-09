import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import MonthDashboard from './components/dashboard/MonthDashboard'
import SavingsPage from './components/savings/SavingsPage'
import SettingsPage from './components/settings/SettingsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MonthDashboard />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
