import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { HeroData } from '@/lib/hero-data'

type HeroTableProps = {
  data: { rates: HeroData[] }
  selectedRole?: string
}

export function HeroTable({ data, selectedRole = 'All' }: HeroTableProps) {
  const renderRateBar = (rate: number, style: string) => {
    const clampedRate = Math.max(0, Math.min(100, rate))

    return (
      <div className="relative h-6 w-full overflow-hidden rounded-sm border border-border">
        <div
          className={`h-full ${style}`}
          style={{ width: `${clampedRate}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,1)] font-extrabold">
          {rate.toFixed(0)}%
        </span>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableCaption>
          Sourced from Blizzard's API. Hero data is updated every patch.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Hero</TableHead>
            <TableHead>Pick Rate</TableHead>
            <TableHead>Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rates
            .filter(
              (entry) =>
                selectedRole === 'All' ||
                entry.hero.role === selectedRole.toUpperCase(),
            )
            .map((hero: HeroData) => (
              <TableRow key={hero.id}>
                <TableCell>{hero.cells.name}</TableCell>
                <TableCell>
                  {renderRateBar(hero.cells.pickrate, 'bg-chart-3')}
                </TableCell>
                <TableCell>
                  {renderRateBar(hero.cells.winrate, 'bg-chart-1')}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  )
}
