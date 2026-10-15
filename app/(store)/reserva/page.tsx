'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Store, Clock, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCart } from '@/lib/cart'
import { formatCurrency } from '@/lib/format'
import type { ReservationItem } from '@/lib/types'
import { ProductThumb } from '@/components/product-thumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReservaPage() {
  const { getProduct, getStock, createReservation } = useStore()
  const { items, setQty, clear } = useCart()
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null)

  const lines = Object.entries(items).map(([productId, qty]) => {
    const product = getProduct(productId)!
    return { product, qty, subtotal: product.salePrice * qty }
  })
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const reservationItems: ReservationItem[] = lines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      qty: l.qty,
      price: l.product.salePrice,
    }))
    const res = createReservation(customer, phone, note, reservationItems)
    if (!res.ok) return toast.error(res.error)
    setConfirmedCode(res.code ?? null)
    clear()
  }

  if (confirmedCode) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          ¡Reserva confirmada!
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Tu código de reserva es{' '}
          <span className="font-mono font-semibold text-foreground">
            {confirmedCode}
          </span>
          . Los productos quedaron apartados por 24 horas para tu recojo en
          tienda.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Volver al catálogo</Link>
        </Button>
      </main>
    )
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-muted-foreground">
          Agrega productos al carrito para confirmar una reserva.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Ir al catálogo
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Seguir comprando
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        Confirmar reserva
      </h1>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Store className="size-4 text-primary" />
          Reserva para recojo y pago en tienda
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 text-primary" />
          Vigencia máxima de 24 horas
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tus datos de contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id="reserva-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="customer">Nombre completo</Label>
                <Input
                  id="customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Ej. María Quispe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="987 654 321"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Comentario (opcional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Paso a recoger en la tarde."
                  rows={3}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map(({ product, qty, subtotal }) => {
              const stock = getStock(product.id)
              const over = qty > stock.available
              return (
                <div key={product.id} className="flex gap-3">
                  <ProductThumb
                    src={product.image}
                    alt={product.name}
                    className="size-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {qty} × {formatCurrency(product.salePrice)}
                    </p>
                    {over && (
                      <button
                        type="button"
                        onClick={() => setQty(product.id, stock.available)}
                        className="mt-1 text-xs text-red-600 underline"
                      >
                        Solo {stock.available} disp. — ajustar
                      </button>
                    )}
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              )
            })}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">
                Total estimado
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <Button type="submit" form="reserva-form" className="w-full">
              Confirmar reserva
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al confirmar, apartamos las unidades y generamos un código único.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
