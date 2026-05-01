import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import AuthGuard from './components/auth/AuthGuard'

// Auth pages — small, load eagerly
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'

// App pages — lazy loaded for faster initial bundle
const MonthDashboard       = lazy(() => import('./components/dashboard/MonthDashboard'))
const OverviewDashboard    = lazy(() => import('./pages/OverviewDashboard'))
const SettingsPage         = lazy(() => import('./components/settings/SettingsPage'))
const AdminPage            = lazy(() => import('./components/admin/AdminPage'))
const TransactionSearchPage = lazy(() => import('./components/search/TransactionSearchPage'))
const InstallmentsPage     = lazy(() => import('./components/modules/InstallmentsPage'))
const MortgagePage         = lazy(() => import('./components/modules/MortgagePage'))
const SavingsVehiclesPage  = lazy(() => import('./components/modules/SavingsVehiclesPage'))
const DebtPlannerPage      = lazy(() => import('./components/modules/DebtPlannerPage'))
const LifeGoalsPage        = lazy(() => import('./components/modules/LifeGoalsPage'))
const ChagBudgetPage       = lazy(() => import('./components/modules/ChagBudgetPage'))
const ChagimPlannerPage    = lazy(() => import('./components/modules/ChagimPlannerPage'))
const ActivityFeedPage     = lazy(() => import('./components/modules/ActivityFeedPage'))
const CashflowPage         = lazy(() => import('./components/modules/CashflowPage'))
const SalarySlipPage       = lazy(() => import('./components/modules/SalarySlipPage'))
const CSVImporterPage      = lazy(() => import('./components/modules/CSVImporterPage'))
const InsightsPage         = lazy(() => import('./components/modules/InsightsPage'))
const FinancialCalendarPage = lazy(() => import('./components/modules/FinancialCalendarPage'))
const SavingsChallengePage = lazy(() => import('./components/modules/SavingsChallengePage'))
const YearInReviewPage     = lazy(() => import('./components/modules/YearInReviewPage'))
const AchievementsPage     = lazy(() => import('./components/modules/AchievementsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-lavender border-t-lavender-dark rounded-full animate-spin" />
    </div>
  )
}

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
            <Suspense fallback={<PageLoader />}>
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
              </Routes>
            </Suspense>
          </AppShell>
        </AuthGuard>
      } />
    </Routes>
  )
}
