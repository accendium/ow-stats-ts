import { HeroTable } from '@/components/hero-table'
import { HeroQueryFields } from '@/components/hero-query-fields'
import { HeroRatesScatterplot } from '@/components/hero-rates-scatterplot'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  OWRole,
  DEFAULT_ROLE,
  DEFAULT_TIER,
  DEFAULT_REGION,
  OWTier,
  DEFAULT_MAP,
  OWMap,
  OWRegion,
  OWInput,
  DEFAULT_INPUT,
} from '@/lib/overwatch-constants'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [role, setRole] = useState<OWRole>(DEFAULT_ROLE)
  const [tier, setTier] = useState<OWTier>(DEFAULT_TIER)
  const [map, setMap] = useState<OWMap>(DEFAULT_MAP)
  const [region, setRegion] = useState<OWRegion>(DEFAULT_REGION)
  const [input, setInput] = useState<OWInput>(DEFAULT_INPUT)
  const [data, setData] = useState<{ rates: [] } | null>(null)  

  useEffect(() => {
    fetch(`/api/data?tier=${tier}&map=${map}&region=${region}&input=${input}`)
      .then((res) => res.json())
      .then(setData)
  }, [tier, map, region, input])

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Query Options</CardTitle>
          <CardDescription>Adjust the query options to get the data you need.</CardDescription>
        </CardHeader>
        <CardContent>
          <HeroQueryFields
            role={role}
            input={input}
            tier={tier}
            map={map}
            region={region}
            onSelectRole={setRole}
            onSelectInput={setInput}
            onSelectTier={setTier}
            onSelectMap={setMap}
            onSelectRegion={setRegion}
          />
        </CardContent>
      </Card>
      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Viability Matrix</CardTitle>
              <CardDescription>
                Easily visualize the viability of heroes in your selected role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeroRatesScatterplot data={data.rates} selectedRole={role} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hero Stats</CardTitle>
              <CardDescription>View detailed stats for each hero in your selected role.</CardDescription>
            </CardHeader>
            <CardContent>
              <HeroTable data={data} selectedRole={role} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
