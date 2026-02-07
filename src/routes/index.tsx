import { HeroTable } from "@/components/hero-table";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute('/')({ 
  component: App,
  loader: async () => {
    const res = await axios.get(
      `/api/data?tier=All&map=all-maps`,
    );
    return await res.data;
  }
})

function App() {
  const initialData = Route.useLoaderData();
  const [tier, setTier] = useState("All");
  const [map, setMap] = useState("all-maps");
  const [data, setData] = useState(initialData);

  useEffect(() => {
    axios.get(
      `/api/data?tier=${tier}&map=${map}`
    )
    .then(res => {
      setData(res.data)
    });
  }, [tier, map]);

  return (
    <div className="container mx-auto px-4 py-12">
      <HeroTable data={data} onSelectTier={setTier} onSelectMap={setMap} />
    </div>
  );
}
