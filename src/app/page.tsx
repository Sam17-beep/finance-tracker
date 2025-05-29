import { HydrateClient } from "@/trpc/server";
import BudgetAnalysisChart from "@/components/custom/analysis/BudgetAnalysisChart";
import { HeaderWithSummary } from "@/components/custom/layout/HeaderWithSummary";
import Streak from "@/components/custom/streak/Streak";

export default function Home() {
  return (
    <>
      <h1 className="my-4 text-2xl font-bold">Dashboard</h1>

      <HydrateClient>
        <HeaderWithSummary />
        <Streak />
        <BudgetAnalysisChart />
      </HydrateClient>
    </>
  );
}
