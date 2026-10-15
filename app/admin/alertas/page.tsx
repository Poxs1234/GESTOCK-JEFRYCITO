'use client'

import Link from 'next/link'
import { PackageX, TriangleAlert, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/admin/page-header'
import { ProductThumb } from '@/components/product-thumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AlertasPage() {
  const { products, getStock, getAlertState } = useStore()
  const active = products.filter((p) => p.status === 'activo')

  const agotados = active.filter((p) => getAlertState(p.id) === 'agotado')
  const bajos = active.filter((p) => getAlertState(p.id) === 'bajo')

  return (
    <div>
      <PageHeader
        hu="HU-08"
        title="Alertas de stock mínimo"
        description="Alertas dinámicas basadas en el stock disponible. Un producto entra en 'Stock bajo' cuando su disponible es menor o igual al mínimo, y en 'Agotado' cuando llega a 0. Se actualizan tras cualquier movimiento."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <PackageX className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {agotados.length}
              </p>
              <p className="text-sm text-muted-foreground">Productos agotados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {bajos.length}
              </p>
              <p className="text-sm text-muted-foreground">Con stock bajo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {agotados.length === 0 && bajos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="font-medium">Todo bajo control</p>
            <p className="text-sm text-muted-foreground">
              Ningún producto está agotado ni por debajo de su stock mínimo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...agotados, ...bajos].map((product) => {
            const s = getStock(product.id)
            const state = getAlertState(product.id)
            const critical = state === 'agotado'
            return (
              <Card key={product.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <ProductThumb
                    src={product.image}
                    alt={product.name}
                    className="size-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-block size-2 rounded-full',
                          critical ? 'bg-red-500' : 'bg-amber-500',
                        )}
                      />
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {critical
                        ? 'Agotado — requiere reposición inmediata'
                        : `Stock bajo — disponible ${s.available} de un mínimo de ${product.minStock}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-lg font-semibold tabular-nums',
                        critical ? 'text-red-600' : 'text-amber-600',
                      )}
                    >
                      {s.available}
                    </p>
                    <p className="text-xs text-muted-foreground">disponible</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/entradas">Registrar entrada</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
