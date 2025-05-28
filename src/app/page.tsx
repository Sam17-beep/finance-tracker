import { HydrateClient } from "@/trpc/server";
import { DateProvider } from "@/contexts/DateContext";
import DateSelectorHeader from "@/components/analysis/DateSelectorHeader";

export default async function Home() {
  return (
    <HydrateClient>
      <DateProvider>
        <main className="container mx-auto py-6">
          <DateSelectorHeader />
          <h1 className="my-4 text-2xl font-bold">Dashboard</h1>

          <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-gray-500">
              Transaction analysis and budget details will be displayed here
              based on the selected period.
            </p>
            {/* Placeholder for charts, tables, etc. */}
          </div>
        </main>
      </DateProvider>
    </HydrateClient>
  );
}
