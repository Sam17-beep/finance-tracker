import {Card, CardContent} from "@/components/ui/card";
import {AdjustBudgetCard} from "@/components/custom/AdjustBudgetCard";
import {api, HydrateClient} from "@/trpc/server";

export default async function BudgetPage() {
  const budget = await api.budget.getBudget()

  return (
    <HydrateClient>
      <div className='flex flex-col sm:gap-4 sm:py-4'>
        <header className='top-0 flex items-center justify-center gap-4 static h-auto border-0 bg-transparent px-6'>
          <h1 className='text-5xl font-semibold leading-none tracking-tight'>Budget</h1>
        </header>
        <main className='flex-1 items-start p-4 px-6 py-0 gap-8 '>
          <Card className='w-full mx-auto max-w-3xl p-10'>
            <CardContent className='grid gap-6'>
              <h1 className='text-3xl font-semibold leading-none tracking-tight'>Ajust your budget</h1>
              <AdjustBudgetCard initBudget={budget}/>
            </CardContent>
          </Card>
        </main>
      </div>
    </HydrateClient>
  )
}
