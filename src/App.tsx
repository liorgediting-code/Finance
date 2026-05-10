import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'

// Lazy-load all in-app pages so they don't inflate the initial bundle
const MonthDashboard        = lazy(() => import('./components/dashboard/MonthDashboard'))
const OverviewDashboard     = lazy(() => import('./pages/OverviewDashboard'))
const SettingsPage          = lazy(() => import('./components/settings/SettingsPage'))
const AdminPage             = lazy(() => import('./components/admin/AdminPage'))
const TransactionSearchPage = lazy(() => import('./components/search/TransactionSearchPage'))
const InstallmentsPage      = lazy(() => import('./components/modules/InstallmentsPage'))
const MortgagePage          = lazy(() => import('./components/modules/MortgagePage'))
const SavingsVehiclesPage   = lazy(() => import('./components/modules/SavingsVehiclesPage'))
const DebtPlannerPage       = lazy(() => import('./components/modules/DebtPlannerPage'))
const LifeGoalsPage         = lazy(() => import('./components/modules/LifeGoalsPage'))
const ChagBudgetPage        = lazy(() => import('./components/modules/ChagBudgetPage'))
const ChagimPlannerPage     = lazy(() => import('./components/modules/ChagimPlannerPage'))
const ActivityFeedPage      = lazy(() => import('./components/modules/ActivityFeedPage'))
const CashflowPage          = lazy(() => import('./components/modules/CashflowPage'))
const SalarySlipPage        = lazy(() => import('./components/modules/SalarySlipPage'))
const CSVImporterPage       = lazy(() => import('./components/modules/CSVImporterPage'))
const InsightsPage          = lazy(() => import('./components/modules/InsightsPage'))
const FinancialCalendarPage = lazy(() => import('./components/modules/FinancialCalendarPage'))
const SavingsChallengePage  = lazy(() => import('./components/modules/SavingsChallengePage'))
const YearInReviewPage      = lazy(() => import('./components/modules/YearInReviewPage'))
const AchievementsPage      = lazy(() => import('./components/modules/AchievementsPage'))
const SubscriptionAuditPage = lazy(() => import('./components/modules/SubscriptionAuditPage'))
const UpcomingPaymentsPage  = lazy(() => import('./components/modules/UpcomingPaymentsPage'))
const TaxRefundPage         = lazy(() => import('./components/modules/TaxRefundPage'))
const MonthlyReportCardPage = lazy(() => import('./components/modules/MonthlyReportCardPage'))
const SpendingTrendsPage    = lazy(() => import('./components/modules/SpendingTrendsPage'))
const EmergencyFundPage     = lazy(() => import('./components/modules/EmergencyFundPage'))
const MemberAnalysisPage    = lazy(() => import('./components/modules/MemberAnalysisPage'))
const GoalSimulatorPage     = lazy(() => import('./components/modules/GoalSimulatorPage'))
const NetWorthTrackerPage   = lazy(() => import('./components/modules/NetWorthTrackerPage'))
const WishlistPage          = lazy(() => import('./components/modules/WishlistPage'))
const SpendingBenchmarksPage  = lazy(() => import('./components/modules/SpendingBenchmarksPage'))
const SpendingHeatmapPage     = lazy(() => import('./components/modules/SpendingHeatmapPage'))
const InvestmentPortfolioPage = lazy(() => import('./components/modules/InvestmentPortfolioPage'))
const FIRECalculatorPage      = lazy(() => import('./components/modules/FIRECalculatorPage'))
const AnnualBudgetPlanPage    = lazy(() => import('./components/modules/AnnualBudgetPlanPage'))
const SpendingDNAPage         = lazy(() => import('./components/modules/SpendingDNAPage'))
const CurrencyConverterPage   = lazy(() => import('./components/modules/CurrencyConverterPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
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
                <Route path="/subscriptions" element={<SubscriptionAuditPage />} />
                <Route path="/upcoming-payments" element={<UpcomingPaymentsPage />} />
                <Route path="/tax-refund" element={<TaxRefundPage />} />
                <Route path="/report-card" element={<MonthlyReportCardPage />} />
                <Route path="/spending-trends" element={<SpendingTrendsPage />} />
                <Route path="/emergency-fund" element={<EmergencyFundPage />} />
                <Route path="/member-analysis" element={<MemberAnalysisPage />} />
                <Route path="/goal-simulator" element={<GoalSimulatorPage />} />
                <Route path="/net-worth-tracker" element={<NetWorthTrackerPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/spending-benchmarks" element={<SpendingBenchmarksPage />} />
                <Route path="/spending-heatmap" element={<SpendingHeatmapPage />} />
                <Route path="/investments" element={<InvestmentPortfolioPage />} />
                <Route path="/fire-calculator" element={<FIRECalculatorPage />} />
                <Route path="/annual-budget-plan" element={<AnnualBudgetPlanPage />} />
                <Route path="/spending-dna" element={<SpendingDNAPage />} />
                <Route path="/currency-converter" element={<CurrencyConverterPage />} />
              </Routes>
            </Suspense>
          </AppShell>
        </AuthGuard>
      } />
    </Routes>
  )
}
