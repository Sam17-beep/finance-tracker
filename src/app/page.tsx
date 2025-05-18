import {HydrateClient} from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <div>
        <h1>Hello World</h1>
      </div>
    </HydrateClient>
  );
}