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

export default function OverviewDashboard() {
  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto" dir="rtl">
      <HealthScoreHero />
      <OverviewKPIRow />
      <OverviewAnnualChart />

      {/* Middle row: 3 equal columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OverviewSavingsCard />
        <OverviewDebtCard />
        <OverviewGoalsCard />
      </div>

      {/* Bottom row: 4 equal columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewInstallmentsCard />
        <OverviewSalaryCard />
        <OverviewChagCard />
        <OverviewCashflowCard />
      </div>
    </div>
  );
}
