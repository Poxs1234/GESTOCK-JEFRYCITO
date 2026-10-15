'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatCurrency } from '@/lib/format'
import { PageHeader } from '@/components/admin/page-header'
import { ProductThumb } from '@/components/product-thumb'
import { AlertBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

type Ticket = Record<string, number>

export default function VentasPage() {
  const { products, getStock, getAlertState, registerSale } = useStore()
  const [query, setQuery] = useState('')
  const [ticket, setTicket] = useState<Ticket>({})

  const sellable = useMemo(
    () => products.filter((p) => p.status === 'activo'),
    [products],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sellable
    return sellable.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q),
    )
  }, [sellable, query])

  function add(productId: string) {
    const stock = getStock(productId)
    const current = ticket[productId] ?? 0
    if (current + 1 > stock.available) {
      toast.error('Stock insuficiente para agregar más unidades.')
      return
    }
    setTicket((t) => ({ ...t, [productId]: current + 1 }))
  }

  function decrease(productId: string) {
    setTicket((t) => {
      const next = { ...t }
      const val = (next[productId] ?? 0) - 1
      if (val <= 0) delete next[productId]
      else next[productId] = val
      return next
    })
  }

  function removeLine(productId: string) {
    setTicket((t) => {
      const next = { ...t }
      delete next[productId]
      return next
    })
  }

  const lines = Object.entries(ticket).map(([productId, qty]) => {
    const product = products.find((p) => p.id === productId)!
    return { product, qty, subtotal: product.salePrice * qty }
  })
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0)

  function confirm() {
    if (lines.length === 0) {
      toast.error('Agrega productos al ticket.')
      return
    }
    const res = registerSale(
      lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
    )
    if (!res.ok) return toast.error(res.error)
    toast.success(
      `Venta ${res.reference} registrada. Se descontó del inventario aplicando FEFO.`,
    )
    setTicket({})
  }

  return (
    <div>
      <PageHeader
        hu="HU-05"
        title="Punto de venta"
        description="Registra ventas de productos disponibles. La venta valida stock disponible (no físico), bloquea productos vencidos e inactivos, y descuenta primero del lote con vencimiento más próximo (FEFO)."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto por nombre o código"
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => {
              const stock = getStock(product.id)
              const alert = getAlertState(product.id)
              const disabled = stock.available <= 0
              return (
                <Card
                  key={product.id}
                  className={disabled ? 'opacity-60' : undefined}
                >
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <ProductThumb
                        src={product.image}
                        alt={product.name}
                        className="size-14 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight text-pretty">
                          {product.name}
                        </p>
                        <p className="mt-1 font-semibold text-primary">
                          {formatCurrency(product.salePrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Disp: <span className="font-medium tabular-nums">{stock.available}</span>
                      </span>
                      <AlertBadge state={alert} />
                    </div>
                    <Button
                      size="sm"
                      variant={disabled ? 'outline' : 'default'}
                      disabled={disabled}
                      onClick={() => add(product.id)}
                    >
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Ticket */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingCart className="size-4 text-primary" />
                <h2 className="font-semibold">Ticket de venta</h2>
              </div>

              {lines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aún no agregas productos.
                </p>
              ) : (
                <div className="space-y-3">
                  {lines.map(({ product, qty, subtotal }) => (
                    <div key={product.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(product.salePrice)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => decrease(product.id)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => add(product.id)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <span className="w-16 text-right text-sm font-medium tabular-nums">
                        {formatCurrency(subtotal)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        onClick={() => removeLine(product.id)}
                        aria-label="Quitar"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>

              <Button
                className="mt-4 w-full"
                disabled={lines.length === 0}
                onClick={confirm}
              >
                <Receipt className="size-4" />
                Confirmar venta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
