import { HydrateClient } from "@/trpc/server";
import { DashboardStats } from "@/components/custom/dashboard/DashboardStats";
import { TransactionTrendsChart } from "@/components/custom/dashboard/TransactionTrendsChart";
import { BudgetComparisonChart } from "@/components/custom/dashboard/BudgetComparisonChart";
import { MonthlySpendingChart } from "@/components/custom/dashboard/MonthlySpendingChart";
import { SpendingBreakdown } from "@/components/custom/dashboard/SpendingBreakdown";
import { DebugTransactions } from "@/components/custom/dashboard/DebugTransactions";
import { TimeframeProvider } from "@/components/providers/timeframe-provider";
import { TimeframeSelector } from "@/components/custom/dashboard/TimeframeSelector";

export default async function Home() {
  return (
    <HydrateClient>
      <TimeframeProvider>
        <main className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Track your finances and monitor your budget performance
              </p>
            </div>
            <TimeframeSelector />
          </div>
          
          <DashboardStats />
          
          {/* <DebugTransactions /> */}
          
          <div className="grid gap-6 md:grid-cols-2">
            <TransactionTrendsChart />
            <BudgetComparisonChart />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <MonthlySpendingChart />
            <SpendingBreakdown />
          </div>
        </main>
      </TimeframeProvider>
    </HydrateClient>
  );
}
