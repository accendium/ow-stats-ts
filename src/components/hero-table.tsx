import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { HeroData } from '@/lib/hero-data'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

type HeroTableProps = {
  data: { rates: HeroData[] }
  selectedRole?: string
}

export function HeroTable({ data, selectedRole = 'All' }: HeroTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const renderRateBar = (rate: number, style: string) => {
    const clampedRate = Math.max(0, Math.min(100, rate))

    return (
      <div className="relative h-6 w-full overflow-hidden rounded-sm border border-border">
        <div
          className={`h-full ${style}`}
          style={{ width: `${clampedRate}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,1)] font-extrabold">
          {rate}%
        </span>
      </div>
    )
  }

  const filteredRates = useMemo(
    () =>
      data.rates.filter(
        (entry) =>
          selectedRole === 'All' ||
          entry.hero.role === selectedRole.toUpperCase(),
      ),
    [data.rates, selectedRole],
  )

  const columns = useMemo<ColumnDef<HeroData>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => row.cells.name,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Hero
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.cells.name,
      },
      {
        id: 'pickrate',
        accessorFn: (row) => row.cells.pickrate,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Pick Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          renderRateBar(row.original.cells.pickrate, 'bg-chart-3'),
      },
      {
        id: 'winrate',
        accessorFn: (row) => row.cells.winrate,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Win Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => renderRateBar(row.original.cells.winrate, 'bg-chart-1'),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filteredRates,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="overflow-hidden rounded-md border pb-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-bold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableCaption>
          Sourced from Blizzard's API. Hero data is updated every patch.
        </TableCaption>
      </Table>
    </div>
  )
}
