import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import HealthScoreHero from '../components/overview/HealthScoreHero';
import OverviewKPIRow from '../components/overview/OverviewKPIRow';
import OverviewAnnualChart from '../components/overview/OverviewAnnualChart';
import OverviewSavingsCard from '../components/overview/OverviewSavingsCard';
import OverviewDebtCard from '../components/overview/OverviewDebtCard';
import OverviewGoalsCard from '../components/overview/OverviewGoalsCard';
import OverviewInstallmentsCard from '../components/overview/OverviewInstallmentsCard';
import OverviewSalaryCard from '../components/overview/OverviewSalaryCard';
import OverviewChagCard from '../components/overview/OverviewChagCard';
import OverviewCashflowCard from '../components/overview/OverviewCashflowCard';
import OverviewNetWorthCard from '../components/overview/OverviewNetWorthCard';
import OverviewInsightsCard from '../components/overview/OverviewInsightsCard';
import OverviewCalendarCard from '../components/overview/OverviewCalendarCard';
import OverviewAchievementsCard from '../components/overview/OverviewAchievementsCard';
import OverviewUpcomingPaymentsCard from '../components/overview/OverviewUpcomingPaymentsCard';
import OverviewBudgetAlertsCard from '../components/overview/OverviewBudgetAlertsCard';
import OverviewSubscriptionCard from '../components/overview/OverviewSubscriptionCard';
import OverviewPaydayCard from '../components/overview/OverviewPaydayCard';
import OverviewDailyBudgetCard from '../components/overview/OverviewDailyBudgetCard';
import OverviewBudgetRuleCard from '../components/overview/OverviewBudgetRuleCard';
import OverviewReportCardCard from '../components/overview/OverviewReportCardCard';
import OverviewSpendingTipsCard from '../components/overview/OverviewSpendingTipsCard';
import OverviewEmergencyFundCard from '../components/overview/OverviewEmergencyFundCard';
import OverviewMemberAnalysisCard from '../components/overview/OverviewMemberAnalysisCard';
import OverviewGoalSimulatorCard from '../components/overview/OverviewGoalSimulatorCard';
import OverviewNetWorthTrackerCard from '../components/overview/OverviewNetWorthTrackerCard';
import OverviewWishlistCard from '../components/overview/OverviewWishlistCard';
import OverviewBenchmarksCard from '../components/overview/OverviewBenchmarksCard';
import OverviewStreakCard from '../components/overview/OverviewStreakCard';
import OverviewHeatmapCard from '../components/overview/OverviewHeatmapCard';
import OverviewInvestmentCard from '../components/overview/OverviewInvestmentCard';
import OverviewFIRECard from '../components/overview/OverviewFIRECard';
import OverviewSpendingDNACard from '../components/overview/OverviewSpendingDNACard';
import OverviewRecentExpensesCard from '../components/overview/OverviewRecentExpensesCard';

function SavingsChallengeCard() {
  return (
    <NavLink to="/savings-challenge" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#C5CDB6' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🏆</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">אתגר חיסכון</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">52 שבועות</p>
        <p className="text-xs text-[#9090A8] mt-0.5">הגדל חיסכון שבועי →</p>
      </div>
    </NavLink>
  );
}

function YearReviewCard() {
  const year = useFinanceStore((s) => s.settings.year);
  return (
    <NavLink to="/year-review" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#B8CCE0' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">סיכום שנתי</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">שנת {year}</p>
        <p className="text-xs text-[#9090A8] mt-0.5">מבט-על על כל השנה →</p>
      </div>
    </NavLink>
  );
}

function TaxRefundCard() {
  return (
    <NavLink to="/tax-refund" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#C8D0B8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🧻</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">החזר מס</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">מחשבון מס שנתי</p>
        <p className="text-xs text-[#9090A8] mt-0.5">חשב החזר צפוי →</p>
      </div>
    </NavLink>
  );
}

function MonthlyReportCardCard() {
  return (
    <NavLink to="/report-card" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#7B6DC8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🎓</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">כרטיס ציון</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">ציון A–F חודשי</p>
        <p className="text-xs text-[#9090A8] mt-0.5">בדוק את הציון שלך →</p>
      </div>
    </NavLink>
  );
}

function SpendingTrendsCard() {
  return (
    <NavLink to="/spending-trends" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#4A90C0' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">📈</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">מגמות הוצאות</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">גרף שנתי לפי קטגוריה</p>
        <p className="text-xs text-[#9090A8] mt-0.5">ראה מגמות →</p>
      </div>
    </NavLink>
  );
}

export default function OverviewDashboard() {
  const enabledModules = useFinanceStore(useShallow((s) => s.settings.enabledModules ?? []));
  const moduleSet = useMemo(() => new Set(enabledModules), [enabledModules]);
  const has = (m: string) => moduleSet.has(m);

  const showNetWorth      = has('net-worth');
  const showInsights      = has('insights');
  const showCalendar      = has('financial-calendar');
  const showCashflow      = has('cashflow');
  const showInstall       = has('installments');
  const showSalary        = has('salary-slip');
  const showChag          = has('chag-budget');
  const showChallenge     = has('savings-challenge');
  const showYearReview    = has('year-review');
  const showAchievements  = has('achievements');
  const showPayday        = has('payday-countdown');
  const showUpcoming      = has('upcoming-payments');
  const showBudgetAlerts  = has('budget-alerts');
  const showTaxRefund     = has('tax-refund');
  const showSubscriptions = has('subscription-audit');
  const showTrends        = has('spending-trends');
  const showMonthlyReport = has('monthly-report');
  const showDailyBudget   = has('daily-budget');
  const showBudgetRule    = has('budget-rule');
  const showReportCard    = has('report-card');
  const showSpendingTips  = has('spending-tips');
  const showEmergencyFund   = has('emergency-fund');
  const showMemberAnalysis  = has('member-analysis');
  const showGoalSimulator   = has('goal-simulator');
  const showNetWorthTracker = has('net-worth-tracker');
  const showWishlist        = has('wishlist');
  const showBenchmarks      = has('spending-benchmarks');
  const showStreak          = has('budget-streak');
  const showHeatmap         = has('spending-heatmap');
  const showInvestment      = has('investment-portfolio');
  const showFIRE            = has('fire-calculator');
  const showSpendingDNA     = has('spending-dna');
  const showAnnualBudgetPlan  = has('annual-budget-plan');
  const showCurrencyConverter = has('currency-converter');
  const showRecentExpenses    = has('recent-expenses');

  const middleGridClass = showNetWorth
    ? 'grid grid-cols-1 md:grid-cols-4 gap-4'
    : 'grid grid-cols-1 md:grid-cols-3 gap-4';

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto" dir="rtl">
      <HealthScoreHero />
      <OverviewKPIRow />
      <OverviewAnnualChart />

      {/* Recent expenses card — quick view of latest transactions */}
      {showRecentExpenses && <OverviewRecentExpensesCard />}

      {/* Middle row: savings + debt + goals + optional net worth */}
      <div className={middleGridClass}>
        <OverviewSavingsCard />
        <OverviewDebtCard />
        <OverviewGoalsCard />
        {showNetWorth && <OverviewNetWorthCard />}
      </div>

      {/* Module shortcut cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showInstall       && <OverviewInstallmentsCard />}
        {showSalary        && <OverviewSalaryCard />}
        {showChag          && <OverviewChagCard />}
        {showCashflow      && <OverviewCashflowCard />}
        {showInsights      && <OverviewInsightsCard />}
        {showCalendar      && <OverviewCalendarCard />}
        {showChallenge     && <SavingsChallengeCard />}
        {showYearReview    && <YearReviewCard />}
        {showUpcoming      && <OverviewUpcomingPaymentsCard />}
        {showBudgetAlerts  && <OverviewBudgetAlertsCard />}
        {showSubscriptions && <OverviewSubscriptionCard />}
        {showTaxRefund     && <TaxRefundCard />}
        {showTrends        && <SpendingTrendsCard />}
        {showPayday        && <OverviewPaydayCard />}
        {showMonthlyReport && <MonthlyReportCardCard />}
      </div>

      {/* New premium feature cards */}
      {(showDailyBudget || showBudgetRule || showReportCard) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showDailyBudget && <OverviewDailyBudgetCard />}
          {showBudgetRule && <OverviewBudgetRuleCard />}
          {showReportCard && <OverviewReportCardCard />}
        </div>
      )}

      {/* Spending tips */}
      {showSpendingTips && (
        <OverviewSpendingTipsCard />
      )}

      {/* New value-adding module cards */}
      {(showEmergencyFund || showMemberAnalysis || showGoalSimulator || showNetWorthTracker || showWishlist) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {showEmergencyFund   && <OverviewEmergencyFundCard />}
          {showMemberAnalysis  && <OverviewMemberAnalysisCard />}
          {showGoalSimulator   && <OverviewGoalSimulatorCard />}
          {showNetWorthTracker && <OverviewNetWorthTrackerCard />}
          {showWishlist        && <OverviewWishlistCard />}
        </div>
      )}

      {/* Batch-2 value cards */}
      {(showBenchmarks || showStreak || showHeatmap) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {showBenchmarks && <OverviewBenchmarksCard />}
          {showStreak     && <OverviewStreakCard />}
          {showHeatmap    && <OverviewHeatmapCard />}
        </div>
      )}

      {/* Achievements card — full width */}
      {showAchievements && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OverviewAchievementsCard />
        </div>
      )}

      {/* Batch-4 premium cards */}
      {(showInvestment || showFIRE || showSpendingDNA || showAnnualBudgetPlan || showCurrencyConverter) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {showInvestment      && <OverviewInvestmentCard />}
          {showFIRE            && <OverviewFIRECard />}
          {showSpendingDNA     && <OverviewSpendingDNACard />}
          {showAnnualBudgetPlan && (
            <NavLink to="/annual-budget-plan" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
              <div className="h-1 w-full" style={{ backgroundColor: '#4A90C0' }} />
              <div className="p-4">
                <div className="text-2xl mb-2">📅</div>
                <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">תכנון שנתי</p>
                <p className="text-sm text-[#1E1E2E] font-medium mt-1">12 חודשים בטבלה</p>
                <p className="text-xs text-[#4A90C0] mt-1">ראה תמונה שנתית →</p>
              </div>
            </NavLink>
          )}
          {showCurrencyConverter && (
            <NavLink to="/currency-converter" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
              <div className="h-1 w-full" style={{ backgroundColor: '#5AADE0' }} />
              <div className="p-4">
                <div className="text-2xl mb-2">💱</div>
                <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">ממיר מטבעות</p>
                <p className="text-sm text-[#1E1E2E] font-medium mt-1">USD, EUR, GBP ועוד</p>
                <p className="text-xs text-[#5AADE0] mt-1">המר מטבעות →</p>
              </div>
            </NavLink>
          )}
        </div>
      )}

    </div>
  );
}
