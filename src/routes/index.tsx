import { HeroTable } from "@/components/hero-table";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [tier, setTier] = useState("All");
  const [map, setMap] = useState("all-maps");
  const [data, setData] = useState<{ rates: [] } | null>(null);

  useEffect(() => {
    fetch(`/api/data?tier=${tier}&map=${map}`)
      .then((res) => res.json())
      .then(setData);
  }, [tier, map]);

  return (
    <div className="container mx-auto px-4 py-12">
      {data && (
        <HeroTable data={data} onSelectTier={setTier} onSelectMap={setMap} />
      )}
    </div>
  );
}
