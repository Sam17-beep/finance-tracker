import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="container mx-auto py-6"></main>
    </HydrateClient>
  );
}
