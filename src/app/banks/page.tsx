import { HydrateClient } from "@/trpc/server";
import { BankManager } from "@/components/custom/bank/BankManager";

export default async function BanksPage() {
  return (
    <HydrateClient>
      <main className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Configurations</h1>
          <p className="text-muted-foreground">
            Manage your bank CSV parsing configurations
          </p>
        </div>
        
        <BankManager />
      </main>
    </HydrateClient>
  );
} 