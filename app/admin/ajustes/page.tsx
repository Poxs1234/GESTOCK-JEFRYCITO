'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatDate, formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/admin/page-header'
import { MovementBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const REASONS = [
  'Merma',
  'Daño',
  'Pérdida',
  'Corrección de inventario',
  'Sobrante',
  'Otro',
]

export default function AjustesPage() {
  const {
    products,
    getProductLots,
    registerAdjustment,
    movements,
    getProduct,
  } = useStore()

  const [productId, setProductId] = useState('')
  const [lotId, setLotId] = useState('')
  const [direction, setDirection] = useState<'in' | 'out'>('out')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const productLots = useMemo(
    () => (productId ? getProductLots(productId) : []),
    [productId, getProductLots],
  )
  const selectedLot = productLots.find((l) => l.id === lotId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return toast.error('Selecciona un producto.')
    if (!lotId) return toast.error('Selecciona un lote.')
    const res = registerAdjustment({
      productId,
      lotId,
      direction,
      quantity: Number(quantity),
      reason,
      note,
    })
    if (!res.ok) return toast.error(res.error)
    toast.success('Ajuste registrado con trazabilidad (usuario, fecha, motivo).')
    setQuantity('')
    setNote('')
    setReason('')
  }

  const adjustments = movements
    .filter((m) => m.type === 'ajuste' || m.type === 'merma')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div>
      <PageHeader
        hu="HU-13"
        title="Ajuste de inventario"
        description="Corrige diferencias de stock por merma, daño, pérdida o conteo físico. Todo ajuste exige un motivo y queda registrado como movimiento; nunca se modifican existencias de forma silenciosa."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-primary" />
              Nuevo ajuste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select
                  value={productId}
                  onValueChange={(v) => {
                    setProductId(v)
                    setLotId('')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lote</Label>
                <Select
                  value={lotId}
                  onValueChange={setLotId}
                  disabled={!productId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un lote" />
                  </SelectTrigger>
                  <SelectContent>
                    {productLots.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.code} · vence {formatDate(l.expiry)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLot && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  Stock actual del lote:{' '}
                  <span className="font-semibold tabular-nums">
                    {selectedLot.quantity}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de ajuste</Label>
                  <Select
                    value={direction}
                    onValueChange={(v) => setDirection(v as 'in' | 'out')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="out">Salida (-)</SelectItem>
                      <SelectItem value="in">Entrada (+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Cantidad</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Observación</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Detalle opcional del ajuste"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                Confirmar ajuste
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Historial de ajustes</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Variación</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((m) => (
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
                      <TableCell className="text-right tabular-nums">
                        {m.in > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <ArrowUp className="size-3" />+{m.in}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <ArrowDown className="size-3" />-{m.out}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {m.balance}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {m.reference}
                      </TableCell>
                    </TableRow>
                  ))}
                  {adjustments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Aún no se registran ajustes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
