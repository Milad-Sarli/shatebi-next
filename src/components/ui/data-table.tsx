'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnimatePresence } from 'framer-motion'

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  manualPagination?: boolean
  onRowClick?: (row: TData) => void
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  mobileCardView?: boolean
  renderMobileCard?: (item: TData, index: number) => React.ReactNode
  emptyMessage?: string
  total?: number
  from?: number
  to?: number
  pageSizeOptions?: number[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageCount,
  pagination,
  onPaginationChange,
  manualPagination = false,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'جستجو...',
  searchValue,
  onSearchChange,
  mobileCardView = false,
  renderMobileCard,
  emptyMessage = 'موردی یافت نشد',
  total,
  from,
  to,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const defaultPagination = React.useMemo(() => ({
    pageIndex: 0,
    pageSize: 10,
  }), [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
      pagination: pagination ?? defaultPagination,
    },
    pageCount: manualPagination ? pageCount : undefined,
    onPaginationChange: manualPagination ? onPaginationChange : undefined,
    manualPagination,
    enableSorting: true,
    enableGlobalFilter: searchable,
  })

  const displayTotal = total ?? table.getFilteredRowModel().rows.length
  const displayFrom = from ?? (pagination ? (pagination.pageIndex * pagination.pageSize) + 1 : 1)
  const displayTo = to ?? Math.min(displayFrom + (pagination?.pageSize ?? 10) - 1, displayTotal)

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue ?? globalFilter}
            onChange={(e) => {
              if (onSearchChange) {
                onSearchChange(e.target.value)
              } else {
                setGlobalFilter(e.target.value)
              }
            }}
            className="pr-9"
          />
        </div>
      )}

      {/* Desktop table */}
      <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 font-medium cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        {
                          asc: <ArrowUp className="h-3 w-3" />,
                          desc: <ArrowDown className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent" />
                    در حال بارگذاری...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      {mobileCardView && (
        <div className="space-y-4 md:hidden">
          <AnimatePresence>
            {loading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent" />
                  در حال بارگذاری...
                </div>
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                {emptyMessage}
              </div>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                renderMobileCard ? (
                  renderMobileCard(row.original, index)
                ) : (
                  <div
                    key={row.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div key={cell.id} className="flex justify-between py-1 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {String(cell.column.columnDef.header ?? '')}
                        </span>
                        <span>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {!loading && displayTotal > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              نمایش {displayFrom} تا {displayTo} از {displayTotal}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                اولین
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageCount = table.getPageCount()
                const currentPage = (pagination?.pageIndex ?? 0) + 1
                let pageNum: number
                if (pageCount <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= pageCount - 2) {
                  pageNum = pageCount - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNum - 1)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                آخرین
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              تعداد در صفحه:
            </span>
            <Select
              value={(pagination?.pageSize ?? 10).toString()}
              onValueChange={(value) => {
                if (onPaginationChange) {
                  onPaginationChange({ pageIndex: 0, pageSize: parseInt(value) })
                } else {
                  table.setPageSize(parseInt(value))
                }
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
