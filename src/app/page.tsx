import { HydrateClient } from "@/trpc/server";
import BudgetAnalysisChart from "@/components/custom/analysis/BudgetAnalysisChart";
import { HeaderWithSummary } from "@/components/custom/layout/HeaderWithSummary";
import Streak from "@/components/custom/streak/Streak";

export default function Home() {
  return (
    <HydrateClient>
      <main className="container mx-auto py-6">
        <HeaderWithSummary />
        <h1 className="my-4 text-2xl font-bold">Dashboard</h1>

        <Streak />

        {/* Budget Analysis Chart Section */}
        <BudgetAnalysisChart />

        {/* Placeholder for other charts, tables, etc. */}
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4">
          <p className="text-gray-500">
            Further transaction analysis and budget details will be displayed
            here or in other sections.
          </p>
          {/* Placeholder for charts, tables, etc. */}
        </div>
      </main>
    </HydrateClient>
  );
}
