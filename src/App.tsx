import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import MonthDashboard from './components/dashboard/MonthDashboard'
import OverviewDashboard from './pages/OverviewDashboard'
import SettingsPage from './components/settings/SettingsPage'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import AdminPage from './components/admin/AdminPage'
import TransactionSearchPage from './components/search/TransactionSearchPage'
import InstallmentsPage from './components/modules/InstallmentsPage'
import MortgagePage from './components/modules/MortgagePage'
import SavingsVehiclesPage from './components/modules/SavingsVehiclesPage'
import DebtPlannerPage from './components/modules/DebtPlannerPage'
import LifeGoalsPage from './components/modules/LifeGoalsPage'
import ChagBudgetPage from './components/modules/ChagBudgetPage'
import ChagimPlannerPage from './components/modules/ChagimPlannerPage'
import ActivityFeedPage from './components/modules/ActivityFeedPage'
import CashflowPage from './components/modules/CashflowPage'
import SalarySlipPage from './components/modules/SalarySlipPage'
import CSVImporterPage from './components/modules/CSVImporterPage'
import InsightsPage from './components/modules/InsightsPage'
import FinancialCalendarPage from './components/modules/FinancialCalendarPage'
import SavingsChallengePage from './components/modules/SavingsChallengePage'
import YearInReviewPage from './components/modules/YearInReviewPage'
import AchievementsPage from './components/modules/AchievementsPage'
import MonthlyReportCardPage from './components/modules/MonthlyReportCardPage'
import SpendingTrendsPage from './components/modules/SpendingTrendsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/*" element={
        <AuthGuard>
          <AppShell>
            <Routes>
              <Route path="/" element={<OverviewDashboard />} />
              <Route path="/month" element={<MonthDashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/search" element={<TransactionSearchPage />} />
              <Route path="/installments" element={<InstallmentsPage />} />
              <Route path="/mortgage" element={<MortgagePage />} />
              <Route path="/savings-vehicles" element={<SavingsVehiclesPage />} />
              <Route path="/debt-planner" element={<DebtPlannerPage />} />
              <Route path="/life-goals" element={<LifeGoalsPage />} />
              <Route path="/chag-budget" element={<ChagBudgetPage />} />
              <Route path="/annual-planner" element={<ChagimPlannerPage />} />
              <Route path="/activity" element={<ActivityFeedPage />} />
              <Route path="/cashflow" element={<CashflowPage />} />
              <Route path="/salary-slip" element={<SalarySlipPage />} />
              <Route path="/csv-import" element={<CSVImporterPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/calendar" element={<FinancialCalendarPage />} />
              <Route path="/savings-challenge" element={<SavingsChallengePage />} />
              <Route path="/year-review" element={<YearInReviewPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/report-card" element={<MonthlyReportCardPage />} />
              <Route path="/spending-trends" element={<SpendingTrendsPage />} />
            </Routes>
          </AppShell>
        </AuthGuard>
      } />
    </Routes>
  )
}
