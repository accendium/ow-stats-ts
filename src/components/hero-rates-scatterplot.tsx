import { CartesianGrid, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartScatterChart,
  ChartScatter,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ROLES } from "@/lib/overwatch-constants"
import type { HeroData } from "@/lib/hero-data"

const chartConfig = {
  tank: { label: "Tank", color: "var(--chart-1)" },
  damage: { label: "Damage", color: "var(--chart-2)" },
  support: { label: "Support", color: "var(--chart-3)" },
} satisfies ChartConfig

const ROLE_KEY: Record<string, keyof typeof chartConfig> = {
  Tank: "tank",
  Damage: "damage",
  Support: "support",
}
const toApiRole = (role: string) => role.toUpperCase()

export function HeroRatesScatterplot({
  data,
  selectedRole = "All",
}: {
  data: HeroData[]
  selectedRole?: string
}) {
  const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50]

  const getDomainWithMargin = (
    values: number[],
    { marginRatio = 0.08, fallback = [0, 100] as [number, number] } = {}
  ) => {
    if (!values.length) return fallback

    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    const margin = range === 0 ? Math.max(Math.abs(max) * marginRatio, 1) : range * marginRatio

    return [min - margin, max + margin] as [number, number]
  }

  const getNiceAxis = (min: number, max: number, targetTickCount = 6) => {
    const range = Math.max(max - min, 1)
    const roughStep = range / targetTickCount
    const step = NICE_STEPS.find((candidate) => candidate >= roughStep) ?? 50
    const domainMin = Math.max(0, Math.floor(min / step) * step)
    const domainMax = Math.max(domainMin + step, Math.ceil(max / step) * step)
    const ticks: number[] = []

    for (let value = domainMin; value <= domainMax; value += step) {
      ticks.push(value)
    }

    return { domain: [domainMin, domainMax] as [number, number], ticks }
  }

  const normalizedRole = ROLES.includes(selectedRole) ? selectedRole : "All"
  const allChartRoles = ROLES.filter((role) => role !== "All")
  const selectedApiRole = normalizedRole === "All" ? null : toApiRole(normalizedRole)
  const filteredData =
    selectedApiRole === null
      ? data
      : data.filter((h) => toApiRole(h.hero.role) === selectedApiRole)
  const activeRoles =
    normalizedRole === "All"
      ? allChartRoles
      : allChartRoles.filter((role) => role === normalizedRole)

  const [xMin, xMax] = getDomainWithMargin(filteredData.map((h) => h.cells.pickrate), {
    marginRatio: 0.1,
  })
  const [winMin, winMax] = getDomainWithMargin(filteredData.map((h) => h.cells.winrate))
  const xAxis = getNiceAxis(xMin, xMax)
  const yAxis = getNiceAxis(Math.min(winMin, 50), Math.max(winMax, 50))

  const byRole = Object.fromEntries(
    activeRoles.map((role) => [
      ROLE_KEY[role],
      filteredData
        .filter((h) => toApiRole(h.hero.role) === toApiRole(role))
        .map((h) => ({ x: h.cells.pickrate, y: h.cells.winrate, name: h.cells.name })),
    ])
  )

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[600px] w-full">
      <ChartScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 24 }}>
        <CartesianGrid />
        <XAxis
          dataKey="x"
          type="number"
          name="Pick Rate"
          domain={xAxis.domain}
          ticks={xAxis.ticks}
          tickFormatter={(v: number) => `${v}%`}
          label={{ value: "Pick Rate", position: "insideBottom", offset: -16 }}
        />
        <YAxis
          dataKey="y"
          type="number"
          name="Win Rate"
          domain={yAxis.domain}
          ticks={yAxis.ticks}
          tickFormatter={(v: number) => `${v}%`}
          label={{ value: "Win Rate", angle: -90, position: "insideLeft", offset: 16 }}
        />
        <ReferenceLine
          y={50}
          stroke="var(--destructive)"
          strokeDasharray="4 4"
          label={{ value: "50%", position: "right", fill: "var(--destructive)" }}
        />
        <ReferenceDot
          x={xAxis.domain[1]}
          y={yAxis.domain[1]}
          r={0}
          ifOverflow="hidden"
          label={{
            value: "Meta Heroes",
            position: "left",
            dx: -6,
            dy: 12,
            fill: "var(--muted-foreground)",
          }}
        />
        <ReferenceDot
          x={xAxis.domain[0]}
          y={yAxis.domain[1]}
          r={0}
          ifOverflow="hidden"
          label={{
            value: "High Skill Floor",
            position: "right",
            dx: 6,
            dy: 12,
            fill: "var(--muted-foreground)",
          }}
        />
        <ReferenceDot
          x={xAxis.domain[1]}
          y={yAxis.domain[0]}
          r={0}
          ifOverflow="hidden"
          label={{
            value: "Trap Picks",
            position: "left",
            dx: -6,
            dy: -8,
            fill: "var(--muted-foreground)",
          }}
        />
        <ReferenceDot
          x={xAxis.domain[0]}
          y={yAxis.domain[0]}
          r={0}
          ifOverflow="hidden"
          label={{
            value: "Weak Heroes",
            position: "right",
            dx: 6,
            dy: -8,
            fill: "var(--muted-foreground)",
          }}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload }) => {
            if (!payload?.length) return null
            const { name, x, y } = payload[0].payload as { name: string; x: number; y: number }
            return (
              <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                <p className="font-medium">{name}</p>
                <p className="text-muted-foreground">Pick: {x.toFixed(1)}%</p>
                <p className="text-muted-foreground">Win: {y.toFixed(1)}%</p>
              </div>
            )
          }}
        />
        <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ bottom: -6 }} />
        {activeRoles.map((role) => {
          const key = ROLE_KEY[role]
          return (
            <ChartScatter
              key={role}
              name={key}
              data={byRole[key]}
              fill={`var(--color-${key})`}
            />
          )
        })}
      </ChartScatterChart>
    </ChartContainer>
  )
}
