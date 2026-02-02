import { HeroTable } from "@/components/hero-table";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

type HeroData = {
  id: string;
  cells: {
    name: string;
    pickrate: number;
    winrate: number;
  };
  hero: {
    color: string;
    name: string;
    portrait: string;
    role: string;
    roleIcon: string;
  };
};

export const Route = createFileRoute('/')({ 
  component: App,
  loader: async () => {
    const res = await fetch(
      `https://overwatch.blizzard.com/en-us/rates/data/?input=PC&map=all-maps&region=Americas&role=All&rq=1&tier=All`,
    );
    return await res.json();
  }
})

function App() {
  const initialData = Route.useLoaderData();
  const [tier, setTier] = useState("All");
  const [data, setData] = useState(initialData);

  useEffect(() => {
    fetch(
      `/data/api?tier=${tier}`
    )
    .then(res => res.json())
    .then(setData);
  }, [tier]);

  return (
    <div className="container mx-auto px-4 py-12">
      <HeroTable initialData={data} onSelectTier={setTier} />
    </div>
  );
}
