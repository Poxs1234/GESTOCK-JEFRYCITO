'use client'

import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatDate, daysUntil } from '@/lib/format'
import { PageHeader } from '@/components/admin/page-header'
import { ExpiryBadge } from '@/components/status-badges'
import { ProductThumb } from '@/components/product-thumb'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function VencimientosPage() {
  const { lots, getProduct, lotExpiryState } = useStore()

  const relevant = lots
    .filter((l) => l.quantity > 0 && lotExpiryState(l) !== 'ok')
    .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))

  const proximos = relevant.filter((l) => lotExpiryState(l) === 'proximo')
  const vencidos = relevant.filter((l) => lotExpiryState(l) === 'vencido')

  return (
    <div>
      <PageHeader
        hu="HU-09"
        title="Productos próximos a vencer y vencidos"
        description="Un lote entra en 'Próximo a vencer' cuando vence dentro de los próximos 30 días calendario, y pasa a 'Vencido' al superar su fecha. Los lotes vencidos quedan bloqueados para venta y reserva y no cuentan como stock disponible."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {proximos.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Lotes próximos a vencer
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <CalendarClock className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {vencidos.length}
              </p>
              <p className="text-sm text-muted-foreground">Lotes vencidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {relevant.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">Sin vencimientos próximos</p>
            <p className="text-sm text-muted-foreground">
              Ningún lote vence dentro de los próximos 30 días.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevant.map((lot) => {
                  const state = lotExpiryState(lot)
                  const days = daysUntil(lot.expiry)
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb
                            src={getProduct(lot.productId)?.image}
                            alt={getProduct(lot.productId)?.name ?? ''}
                            className="size-9"
                          />
                          <span className="font-medium">
                            {getProduct(lot.productId)?.name ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {lot.code}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lot.quantity}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(lot.expiry)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {state === 'vencido' ? (
                          <span className="text-red-600">
                            {Math.abs(days)} días atrás
                          </span>
                        ) : (
                          <span className="text-amber-600">{days} días</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ExpiryBadge state={state} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
