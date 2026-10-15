export type ProductStatus = 'activo' | 'inactivo'

export type Product = {
  id: string
  barcode: string
  name: string
  category: string
  unit: string
  salePrice: number
  minStock: number
  status: ProductStatus
  image: string
}

export type Lot = {
  id: string
  productId: string
  code: string
  quantity: number
  cost: number
  expiry: string | null // ISO date
  receivedAt: string // ISO date
  supplier: string
  voucher: string
}

export type MovementType =
  | 'entrada'
  | 'venta'
  | 'reserva'
  | 'liberacion'
  | 'ajuste'
  | 'merma'

export type Movement = {
  id: string
  date: string // ISO
  productId: string
  lotId: string | null
  lotCode: string | null
  type: MovementType
  in: number
  out: number
  balance: number
  reference: string
}

export type ReservationStatus =
  | 'pendiente'
  | 'confirmada'
  | 'rechazada'
  | 'expirada'

export type ReservationItem = {
  productId: string
  name: string
  qty: number
  price: number
}

export type Reservation = {
  id: string
  code: string
  customer: string
  phone: string
  note: string
  items: ReservationItem[]
  total: number
  createdAt: string
  expiresAt: string
  status: ReservationStatus
}

export type CartItem = {
  productId: string
  qty: number
}

export type StockInfo = {
  physical: number // todas las unidades existentes
  vigente: number // unidades no vencidas
  reserved: number // unidades comprometidas por reservas activas
  available: number // vigente - reservado
  expired: number
}

export type ExpiryState = 'ok' | 'proximo' | 'vencido'
export type AlertState = 'ok' | 'bajo' | 'agotado'
