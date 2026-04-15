import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import MonthDashboard from './components/dashboard/MonthDashboard'
import SettingsPage from './components/settings/SettingsPage'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import AdminPage from './components/admin/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={
        <AuthGuard>
          <AppShell>
            <Routes>
              <Route path="/" element={<MonthDashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AppShell>
        </AuthGuard>
      } />
    </Routes>
  )
}
