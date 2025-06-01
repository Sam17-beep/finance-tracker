import { HydrateClient } from "@/trpc/server";
import BudgetAnalysisChart from "@/components/custom/analysis/BudgetAnalysisChart";
import { HeaderWithSummary } from "@/components/custom/layout/HeaderWithSummary";
import CurrentPeriodCard from "@/components/custom/analysis/CurentPeriodCard";
import Streak from "@/components/custom/analysis/Streak";

export default function Home() {
  return (
    <>
      <h1 className="my-4 text-2xl font-bold">Dashboard</h1>

      <HydrateClient>
        <HeaderWithSummary />
        <div className="flex flex-wrap gap-4">
          <CurrentPeriodCard />
          <Streak />
          <BudgetAnalysisChart />
        </div>
      </HydrateClient>
    </>
  );
}
