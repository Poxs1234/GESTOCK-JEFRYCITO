'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useCart } from '@/lib/cart'
import { formatCurrency } from '@/lib/format'
import { ProductThumb } from '@/components/product-thumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function CatalogPage() {
  const { products, getStock } = useStore()
  const { items, add } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')

  const catalog = useMemo(
    () => products.filter((p) => p.status === 'activo'),
    [products],
  )

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(catalog.map((p) => p.category)))],
    [catalog],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.filter((p) => {
      const matchCat = category === 'Todas' || p.category === category
      const matchQuery = !q || p.name.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [catalog, query, category])

  function handleAdd(productId: string, name: string) {
    add(productId)
    toast.success(`"${name}" agregado al carrito.`)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Catálogo de la Bodega Jefrysito
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-pretty">
          Consulta los productos disponibles con precios actualizados y resérvalos
          en línea para recogerlos en tienda. No necesitas crear una cuenta.
        </p>
      </section>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => {
          const stock = getStock(product.id)
          const soldOut = stock.available <= 0
          const inCart = items[product.id] ?? 0
          return (
            <Card key={product.id} className="overflow-hidden pt-0">
              <div className="relative aspect-square bg-muted">
                <ProductThumb
                  src={product.image}
                  alt={product.name}
                  className="size-full rounded-none"
                />
                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Badge className="border-transparent bg-red-100 text-red-700">
                      Agotado
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col px-4">
                <span className="text-xs text-muted-foreground">
                  {product.category}
                </span>
                <h2 className="mt-0.5 text-sm font-medium leading-tight text-pretty">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(product.salePrice)}
                  </span>
                  {!soldOut && (
                    <span className="text-xs text-muted-foreground">
                      {stock.available} disp.
                    </span>
                  )}
                </div>
                <Button
                  className="mt-3 w-full"
                  variant={soldOut ? 'outline' : inCart > 0 ? 'secondary' : 'default'}
                  disabled={soldOut}
                  onClick={() => handleAdd(product.id, product.name)}
                >
                  {soldOut ? (
                    'Agotado'
                  ) : inCart > 0 ? (
                    <>
                      <Check className="size-4" />
                      En carrito ({inCart})
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Reservar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          No se encontraron productos.
        </p>
      )}
    </main>
  )
}
