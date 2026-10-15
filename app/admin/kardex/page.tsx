'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatDateTime } from '@/lib/format'
import type { MovementType } from '@/lib/types'
import { PageHeader } from '@/components/admin/page-header'
import { MovementBadge } from '@/components/status-badges'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TYPES: (MovementType | 'todos')[] = [
  'todos',
  'entrada',
  'venta',
  'ajuste',
  'merma',
  'reserva',
  'liberacion',
]

export default function KardexPage() {
  const { movements, products, getProduct } = useStore()
  const [productId, setProductId] = useState('todos')
  const [type, setType] = useState<MovementType | 'todos'>('todos')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return movements
      .filter((m) => (productId === 'todos' ? true : m.productId === productId))
      .filter((m) => (type === 'todos' ? true : m.type === type))
      .filter((m) => {
        if (from && new Date(m.date) < new Date(from)) return false
        if (to) {
          const end = new Date(to)
          end.setHours(23, 59, 59, 999)
          if (new Date(m.date) > end) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [movements, productId, type, from, to])

  return (
    <div>
      <PageHeader
        hu="HU-06"
        title="Kardex de movimientos"
        description="Historial cronológico de movimientos de inventario: entradas, ventas, reservas, liberaciones, ajustes y mermas. Cada movimiento conserva el saldo resultante para auditar cómo se originaron las existencias."
      />

      <Card className="mb-4">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as MovementType | 'todos')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t === 'todos' ? 'Todos' : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">Desde</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">Hasta</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Salida</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(m.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getProduct(m.productId)?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.lotCode ?? '—'}
                  </TableCell>
                  <TableCell>
                    <MovementBadge type={m.type} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {m.in > 0 ? m.in : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600">
                    {m.out > 0 ? m.out : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {m.balance}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                    {m.reference}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No hay movimientos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
