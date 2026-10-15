'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildInitialState } from './mock-data'
import { daysUntil, hoursFromNowISO } from './format'
import type {
  AlertState,
  ExpiryState,
  Lot,
  Movement,
  MovementType,
  Product,
  ProductStatus,
  Reservation,
  ReservationItem,
  StockInfo,
} from './types'

const EXPIRY_THRESHOLD_DAYS = 30
const RESERVATION_HOURS = 24
const ACTIVE_RESERVATION: Reservation['status'][] = ['pendiente', 'confirmada']

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function lotExpiryState(lot: Lot): ExpiryState {
  if (!lot.expiry) return 'ok'
  const d = daysUntil(lot.expiry)
  if (d < 0) return 'vencido'
  if (d <= EXPIRY_THRESHOLD_DAYS) return 'proximo'
  return 'ok'
}

type ProductInput = Omit<Product, 'id'>

export type EntryInput = {
  productId: string
  lotCode: string
  quantity: number
  cost: number
  expiry: string | null
  receivedAt: string
  supplier: string
  voucher: string
}

type SaleLine = { productId: string; qty: number }

type AdjustmentInput = {
  productId: string
  lotId: string
  direction: 'in' | 'out'
  quantity: number
  reason: string
  note: string
}

type StoreContextValue = {
  // auth
  isAuthenticated: boolean
  login: (user: string, pass: string) => { ok: boolean; error?: string }
  logout: () => void
  loginAttempts: number
  lockedUntil: number | null
  // data
  products: Product[]
  lots: Lot[]
  movements: Movement[]
  reservations: Reservation[]
  // selectors
  getProduct: (id: string) => Product | undefined
  getStock: (productId: string) => StockInfo
  getAlertState: (productId: string) => AlertState
  lotExpiryState: (lot: Lot) => ExpiryState
  getProductLots: (productId: string) => Lot[]
  // product actions
  addProduct: (input: ProductInput) => { ok: boolean; error?: string }
  updateProduct: (
    id: string,
    input: Partial<ProductInput>,
  ) => { ok: boolean; error?: string }
  setProductStatus: (id: string, status: ProductStatus) => void
  // inventory actions
  registerEntry: (input: EntryInput) => { ok: boolean; error?: string }
  registerSale: (
    lines: SaleLine[],
  ) => { ok: boolean; error?: string; reference?: string }
  registerAdjustment: (input: AdjustmentInput) => { ok: boolean; error?: string }
  // reservations
  createReservation: (
    customer: string,
    phone: string,
    note: string,
    items: ReservationItem[],
  ) => { ok: boolean; error?: string; code?: string }
  confirmReservation: (id: string) => void
  rejectReservation: (id: string) => void
  expireReservation: (id: string) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const DEMO_USER = 'admin'
const DEMO_PASS = 'gestock123'
const MAX_ATTEMPTS = 3
const LOCK_MS = 30_000

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => buildInitialState(), [])
  const [products, setProducts] = useState<Product[]>(initial.products)
  const [lots, setLots] = useState<Lot[]>(initial.lots)
  const [movements, setMovements] = useState<Movement[]>(initial.movements)
  const [reservations, setReservations] = useState<Reservation[]>(
    initial.reservations,
  )

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  // ----- selectors -----
  const getProduct = (id: string) => products.find((p) => p.id === id)

  const getProductLots = (productId: string) =>
    lots.filter((l) => l.productId === productId)

  const reservedByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of reservations) {
      if (!ACTIVE_RESERVATION.includes(r.status)) continue
      for (const item of r.items) {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.qty)
      }
    }
    return map
  }, [reservations])

  const getStock = (productId: string): StockInfo => {
    const productLots = lots.filter((l) => l.productId === productId)
    let physical = 0
    let vigente = 0
    let expired = 0
    for (const lot of productLots) {
      physical += lot.quantity
      if (lotExpiryState(lot) === 'vencido') expired += lot.quantity
      else vigente += lot.quantity
    }
    const reserved = reservedByProduct.get(productId) ?? 0
    const available = Math.max(vigente - reserved, 0)
    return { physical, vigente, reserved, available, expired }
  }

  const getAlertState = (productId: string): AlertState => {
    const product = getProduct(productId)
    if (!product) return 'ok'
    const { available } = getStock(productId)
    if (available <= 0) return 'agotado'
    if (available <= product.minStock) return 'bajo'
    return 'ok'
  }

  // ----- auth -----
  const login = (user: string, pass: string) => {
    if (lockedUntil && Date.now() < lockedUntil) {
      return {
        ok: false,
        error: 'Demasiados intentos. Espera unos segundos e intenta de nuevo.',
      }
    }
    if (user.trim() === DEMO_USER && pass === DEMO_PASS) {
      setIsAuthenticated(true)
      setLoginAttempts(0)
      setLockedUntil(null)
      return { ok: true }
    }
    const attempts = loginAttempts + 1
    setLoginAttempts(attempts)
    if (attempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_MS)
      setLoginAttempts(0)
      return {
        ok: false,
        error: 'Acceso bloqueado temporalmente por seguridad. Intenta en 30s.',
      }
    }
    return { ok: false, error: 'Usuario o contraseña incorrectos.' }
  }

  const logout = () => setIsAuthenticated(false)

  // ----- product actions -----
  const addProduct = (input: ProductInput) => {
    if (products.some((p) => p.barcode === input.barcode)) {
      return { ok: false, error: 'Ya existe un producto con ese código de barras.' }
    }
    if (input.salePrice <= 0) {
      return { ok: false, error: 'El precio de venta debe ser mayor a 0.' }
    }
    if (input.minStock < 0) {
      return { ok: false, error: 'El stock mínimo no puede ser negativo.' }
    }
    setProducts((prev) => [...prev, { ...input, id: uid('p') }])
    return { ok: true }
  }

  const updateProduct = (id: string, input: Partial<ProductInput>) => {
    if (input.salePrice !== undefined && input.salePrice <= 0) {
      return { ok: false, error: 'El precio de venta debe ser mayor a 0.' }
    }
    if (input.minStock !== undefined && input.minStock < 0) {
      return { ok: false, error: 'El stock mínimo no puede ser negativo.' }
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...input } : p)),
    )
    return { ok: true }
  }

  const setProductStatus = (id: string, status: ProductStatus) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    )
  }

  // ----- movement helper -----
  const pushMovement = (
    productId: string,
    lotId: string | null,
    lotCode: string | null,
    type: MovementType,
    inQty: number,
    outQty: number,
    balance: number,
    reference: string,
  ): Movement => ({
    id: uid('m'),
    date: new Date().toISOString(),
    productId,
    lotId,
    lotCode,
    type,
    in: inQty,
    out: outQty,
    balance,
    reference,
  })

  // ----- inventory actions -----
  const registerEntry = (input: EntryInput) => {
    if (input.quantity <= 0) {
      return { ok: false, error: 'La cantidad debe ser mayor a 0.' }
    }
    if (input.cost <= 0) {
      return { ok: false, error: 'El costo unitario debe ser mayor a 0.' }
    }
    const dup = lots.some(
      (l) => l.voucher === input.voucher && l.supplier === input.supplier,
    )
    if (dup) {
      return {
        ok: false,
        error: 'Ya existe una entrada con ese proveedor y comprobante.',
      }
    }
    const balanceBefore = getStock(input.productId).physical
    const newLot: Lot = {
      id: uid('l'),
      productId: input.productId,
      code: input.lotCode || uid('LT').toUpperCase(),
      quantity: input.quantity,
      cost: input.cost,
      expiry: input.expiry,
      receivedAt: input.receivedAt,
      supplier: input.supplier,
      voucher: input.voucher,
    }
    setLots((prev) => [...prev, newLot])
    setMovements((prev) => [
      ...prev,
      pushMovement(
        input.productId,
        newLot.id,
        newLot.code,
        'entrada',
        input.quantity,
        0,
        balanceBefore + input.quantity,
        `Entrada ${input.supplier} · ${input.voucher}`,
      ),
    ])
    return { ok: true }
  }

  const registerSale = (lines: SaleLine[]) => {
    // validación previa
    for (const line of lines) {
      const product = getProduct(line.productId)
      if (!product) return { ok: false, error: 'Producto no encontrado.' }
      if (product.status !== 'activo') {
        return { ok: false, error: `"${product.name}" está inactivo.` }
      }
      if (line.qty <= 0) return { ok: false, error: 'Cantidad inválida.' }
      const stock = getStock(line.productId)
      if (line.qty > stock.available) {
        return {
          ok: false,
          error: `Stock insuficiente para "${product.name}". Disponible: ${stock.available}.`,
        }
      }
    }

    const reference = `V-${Math.floor(1000 + Math.random() * 9000)}`
    const updatedLots = [...lots]
    const newMovements: Movement[] = []

    for (const line of lines) {
      let remaining = line.qty
      // FEFO: lotes vigentes ordenados por vencimiento más próximo
      const vigenteLots = updatedLots
        .filter(
          (l) =>
            l.productId === line.productId &&
            l.quantity > 0 &&
            lotExpiryState(l) !== 'vencido',
        )
        .sort((a, b) => {
          const da = a.expiry ? new Date(a.expiry).getTime() : Infinity
          const db = b.expiry ? new Date(b.expiry).getTime() : Infinity
          return da - db
        })

      let runningBalance = getStock(line.productId).physical
      for (const lot of vigenteLots) {
        if (remaining <= 0) break
        const take = Math.min(lot.quantity, remaining)
        const idx = updatedLots.findIndex((l) => l.id === lot.id)
        updatedLots[idx] = { ...lot, quantity: lot.quantity - take }
        remaining -= take
        runningBalance -= take
        newMovements.push(
          pushMovement(
            line.productId,
            lot.id,
            lot.code,
            'venta',
            0,
            take,
            runningBalance,
            `Venta mostrador ${reference} (FEFO)`,
          ),
        )
      }
    }

    setLots(updatedLots)
    setMovements((prev) => [...prev, ...newMovements])
    return { ok: true, reference }
  }

  const registerAdjustment = (input: AdjustmentInput) => {
    if (input.quantity <= 0) {
      return { ok: false, error: 'La cantidad debe ser mayor a 0.' }
    }
    if (!input.reason) {
      return { ok: false, error: 'Debes indicar un motivo.' }
    }
    const lot = lots.find((l) => l.id === input.lotId)
    if (!lot) return { ok: false, error: 'Lote no encontrado.' }

    if (input.direction === 'out' && input.quantity > lot.quantity) {
      return {
        ok: false,
        error: `No puedes retirar ${input.quantity}; el lote solo tiene ${lot.quantity}.`,
      }
    }

    const balanceBefore = getStock(input.productId).physical
    const delta = input.direction === 'in' ? input.quantity : -input.quantity
    setLots((prev) =>
      prev.map((l) =>
        l.id === input.lotId ? { ...l, quantity: l.quantity + delta } : l,
      ),
    )
    const type: MovementType =
      input.direction === 'out' &&
      (input.reason === 'Merma' || input.reason === 'Daño')
        ? 'merma'
        : 'ajuste'
    setMovements((prev) => [
      ...prev,
      pushMovement(
        input.productId,
        input.lotId,
        lot.code,
        type,
        input.direction === 'in' ? input.quantity : 0,
        input.direction === 'out' ? input.quantity : 0,
        balanceBefore + delta,
        `Ajuste (${input.reason})${input.note ? ' · ' + input.note : ''}`,
      ),
    ])
    return { ok: true }
  }

  // ----- reservations -----
  const createReservation = (
    customer: string,
    phone: string,
    note: string,
    items: ReservationItem[],
  ) => {
    if (!customer.trim() || !phone.trim()) {
      return { ok: false, error: 'Nombre y teléfono son obligatorios.' }
    }
    if (items.length === 0) {
      return { ok: false, error: 'Tu carrito está vacío.' }
    }
    // revalidar disponibilidad
    for (const item of items) {
      const stock = getStock(item.productId)
      if (item.qty > stock.available) {
        return {
          ok: false,
          error: `"${item.name}" ya no tiene ${item.qty} disponibles.`,
        }
      }
    }
    const code = `RSV-${Math.floor(2050 + Math.random() * 900)}`
    const total = items.reduce((sum, i) => sum + i.qty * i.price, 0)
    const reservation: Reservation = {
      id: uid('r'),
      code,
      customer,
      phone,
      note,
      items,
      total,
      createdAt: new Date().toISOString(),
      expiresAt: hoursFromNowISO(RESERVATION_HOURS),
      status: 'pendiente',
    }
    setReservations((prev) => [reservation, ...prev])
    return { ok: true, code }
  }

  const confirmReservation = (id: string) =>
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'confirmada' } : r)),
    )

  const rejectReservation = (id: string) =>
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rechazada' } : r)),
    )

  const expireReservation = (id: string) =>
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'expirada' } : r)),
    )

  const value: StoreContextValue = {
    isAuthenticated,
    login,
    logout,
    loginAttempts,
    lockedUntil,
    products,
    lots,
    movements,
    reservations,
    getProduct,
    getStock,
    getAlertState,
    lotExpiryState,
    getProductLots,
    addProduct,
    updateProduct,
    setProductStatus,
    registerEntry,
    registerSale,
    registerAdjustment,
    createReservation,
    confirmReservation,
    rejectReservation,
    expireReservation,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
