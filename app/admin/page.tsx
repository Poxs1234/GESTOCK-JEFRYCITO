'use client'

import Link from 'next/link'
import {
  PackageX,
  TriangleAlert,
  CalendarClock,
  BellRing,
  Wallet,
  ArrowRight,
  Boxes,
  Package,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/admin/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ReservationStatusBadge } from '@/components/status-badges'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { products, lots, reservations, getStock, getAlertState, lotExpiryState } =
    useStore()

  const activeProducts = products.filter((p) => p.status === 'activo')

  const agotados = activeProducts.filter(
    (p) => getAlertState(p.id) === 'agotado',
  ).length
  const stockBajo = activeProducts.filter(
    (p) => getAlertState(p.id) === 'bajo',
  ).length
  const proximosVencer = lots.filter(
    (l) => lotExpiryState(l) === 'proximo' && l.quantity > 0,
  ).length
  const reservasActivas = reservations.filter(
    (r) => r.status === 'pendiente' || r.status === 'confirmada',
  ).length
  const valorInventario = lots.reduce((sum, l) => {
    if (lotExpiryState(l) === 'vencido') return sum
    return sum + l.quantity * l.cost
  }, 0)

  const totalUnidades = products.reduce(
    (sum, p) => sum + getStock(p.id).vigente,
    0,
  )

  const stats = [
    {
      label: 'Productos agotados',
      value: agotados,
      icon: PackageX,
      href: '/admin/alertas',
      tone: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Stock bajo',
      value: stockBajo,
      icon: TriangleAlert,
      href: '/admin/alertas',
      tone: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Próximos a vencer',
      value: proximosVencer,
      icon: CalendarClock,
      href: '/admin/vencimientos',
      tone: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Reservas activas',
      value: reservasActivas,
      icon: BellRing,
      href: '/admin/reservas',
      tone: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  const recientes = [...reservations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4)

  return (
    <div>
      <PageHeader
        hu="HU-10"
        title="Dashboard de inventario"
        description="Indicadores calculados con la información actual del inventario y las operaciones. Selecciona un indicador para ver el detalle."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <span
                    className={cn(
                      'flex size-11 items-center justify-center rounded-lg',
                      stat.bg,
                      stat.tone,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold tabular-nums">
                      {stat.value}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(valorInventario)}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor aproximado del inventario
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Boxes className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {totalUnidades}
              </p>
              <p className="text-sm text-muted-foreground">
                Unidades vigentes en almacén
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {activeProducts.length}
              </p>
              <p className="text-sm text-muted-foreground">Productos activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Reservas recientes</CardTitle>
          <Link
            href="/admin/reservas"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recientes.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin reservas.</p>
          )}
          {recientes.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {r.code} · {r.customer}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.items.length} producto(s) · {formatCurrency(r.total)} ·{' '}
                  {formatDateTime(r.createdAt)}
                </p>
              </div>
              <ReservationStatusBadge status={r.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
