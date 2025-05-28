import { HydrateClient } from "@/trpc/server";
import BudgetAnalysisChart from "@/components/custom/analysis/BudgetAnalysisChart";
import { HeaderWithSummary } from "@/components/custom/layout/HeaderWithSummary";

export default function Home() {
  return (
    <HydrateClient>
      <main className="container mx-auto py-6">
        <HeaderWithSummary />
        <h1 className="my-4 text-2xl font-bold">Dashboard</h1>

        {/* Budget Analysis Chart Section */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            Budget Analysis (Goal vs. Spending)
          </h2>
          <div className="min-h-[300px] rounded-lg border border-dashed border-gray-300 p-4 sm:min-h-[400px]">
            <BudgetAnalysisChart />
          </div>
        </section>

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
