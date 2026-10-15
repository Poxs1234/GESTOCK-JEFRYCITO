'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Phone, Clock, Check, X, Eye } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Reservation } from '@/lib/types'
import { PageHeader } from '@/components/admin/page-header'
import { ReservationStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function hoursLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(ms / 3_600_000))
}

export default function ReservasPage() {
  const {
    reservations,
    confirmReservation,
    rejectReservation,
    expireReservation,
  } = useStore()
  const [detail, setDetail] = useState<Reservation | null>(null)

  // HU-15: expirar automáticamente reservas vencidas y liberar unidades
  useEffect(() => {
    reservations.forEach((r) => {
      if (
        (r.status === 'pendiente' || r.status === 'confirmada') &&
        new Date(r.expiresAt).getTime() < Date.now()
      ) {
        expireReservation(r.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ordered = useMemo(
    () =>
      [...reservations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reservations],
  )

  const pendientes = ordered.filter((r) => r.status === 'pendiente')

  function handleConfirm(r: Reservation) {
    confirmReservation(r.id)
    toast.success(`Reserva ${r.code} confirmada para recojo.`)
  }
  function handleReject(r: Reservation) {
    rejectReservation(r.id)
    toast.success(`Reserva ${r.code} rechazada. Se liberaron las unidades.`)
  }

  return (
    <div>
      <PageHeader
        hu="HU-15"
        title="Notificaciones de reservas"
        description="Notificaciones internas del sistema cuando un cliente confirma una reserva. Prepara los productos, confírmalos para recojo o recházalos. Las reservas caducan automáticamente a las 24 horas liberando las unidades."
      />

      {pendientes.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <BellRing className="size-4" />
          Tienes {pendientes.length} reserva(s) pendiente(s) de preparación.
        </div>
      )}

      <div className="space-y-3">
        {ordered.map((r) => {
          const expired = r.status === 'expirada'
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.code}</span>
                      <ReservationStatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 font-medium">{r.customer}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3.5" />
                        {r.phone}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {r.status === 'pendiente' || r.status === 'confirmada'
                          ? `Vence en ${hoursLeft(r.expiresAt)} h`
                          : `Creada ${formatDateTime(r.createdAt)}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCurrency(r.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.items.reduce((s, i) => s + i.qty, 0)} unidad(es)
                    </p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {r.items
                      .map((i) => `${i.qty}× ${i.name}`)
                      .join(' · ')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail(r)}
                    >
                      <Eye className="size-4" />
                      Ver detalle
                    </Button>
                    {r.status === 'pendiente' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(r)}
                        >
                          <X className="size-4" />
                          Rechazar
                        </Button>
                        <Button size="sm" onClick={() => handleConfirm(r)}>
                          <Check className="size-4" />
                          Confirmar para recojo
                        </Button>
                      </>
                    )}
                    {expired && (
                      <span className="text-sm text-muted-foreground">
                        Unidades liberadas
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {ordered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay reservas registradas.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de reserva {detail?.code}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{detail.customer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{detail.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Creada</p>
                  <p className="font-medium">
                    {formatDateTime(detail.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vence</p>
                  <p className="font-medium">
                    {formatDateTime(detail.expiresAt)}
                  </p>
                </div>
              </div>

              {detail.note && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Comentario: </span>
                  {detail.note}
                </div>
              )}

              <div className="space-y-2">
                {detail.items.map((i) => (
                  <div
                    key={i.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {i.qty}× {i.name}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(i.qty * i.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(detail.total)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
