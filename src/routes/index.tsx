import { HeroTable } from "@/components/hero-table";
import { HeroQueryFields } from "@/components/hero-query-fields";
import { HeroRatesScatterplot } from "@/components/hero-rates-scatterplot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [role, setRole] = useState("All");
  const [tier, setTier] = useState("All");
  const [map, setMap] = useState("all-maps");
  const [data, setData] = useState<{ rates: [] } | null>(null);

  useEffect(() => {
    fetch(`/api/data?tier=${tier}&map=${map}`)
      .then((res) => res.json())
      .then(setData);
  }, [tier, map]);

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Query Options</CardTitle>
        </CardHeader>
        <CardContent>
          <HeroQueryFields onSelectRole={setRole} onSelectTier={setTier} onSelectMap={setMap} />
        </CardContent>
      </Card>
      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Viability Matrix</CardTitle>
              <CardDescription>Easily visualize the viability of heroes in your selected role.</CardDescription>
            </CardHeader>
            <CardContent>
              <HeroRatesScatterplot data={data.rates} selectedRole={role} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hero Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <HeroTable data={data} selectedRole={role} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
