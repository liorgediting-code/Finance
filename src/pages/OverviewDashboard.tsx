import { useShallow } from 'zustand/react/shallow';
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

export default function OverviewDashboard() {
  const enabledModules = useFinanceStore(useShallow((s) => s.settings.enabledModules ?? []));

  const showNetWorth  = enabledModules.includes('net-worth');
  const showInsights  = enabledModules.includes('insights');
  const showCalendar  = enabledModules.includes('financial-calendar');
  const showCashflow  = enabledModules.includes('cashflow');
  const showInstall   = enabledModules.includes('installments');
  const showSalary    = enabledModules.includes('salary-slip');
  const showChag      = enabledModules.includes('chag-budget');

  const middleGridClass = showNetWorth
    ? 'grid grid-cols-1 md:grid-cols-4 gap-4'
    : 'grid grid-cols-1 md:grid-cols-3 gap-4';

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto" dir="rtl">
      <HealthScoreHero />
      <OverviewKPIRow />
      <OverviewAnnualChart />

      {/* Middle row: savings + debt + goals + optional net worth */}
      <div className={middleGridClass}>
        <OverviewSavingsCard />
        <OverviewDebtCard />
        <OverviewGoalsCard />
        {showNetWorth && <OverviewNetWorthCard />}
      </div>

      {/* Bottom row: module shortcut cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showInstall  && <OverviewInstallmentsCard />}
        {showSalary   && <OverviewSalaryCard />}
        {showChag     && <OverviewChagCard />}
        {showCashflow && <OverviewCashflowCard />}
        {showInsights && <OverviewInsightsCard />}
        {showCalendar && <OverviewCalendarCard />}
      </div>
    </div>
  );
}
