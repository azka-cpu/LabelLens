import { useEffect, useState, type FormEvent } from 'react'
import * as api from '../api/client'
import RequireAuth from '../components/RequireAuth'
import WebcamCapture from '../components/WebcamCapture'
import type { Product, ShoppingListItem } from '../types'

export default function ShoppingList() {
  return (
    <RequireAuth>
      <ShoppingListContent />
    </RequireAuth>
  )
}

function ShoppingListContent() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)

  const [scannedProducts, setScannedProducts] = useState<Product[]>([])
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanBusy, setScanBusy] = useState(false)

  async function reload() {
    try {
      const data = await api.listShoppingList()
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Could not load shopping list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await api.addShoppingItem(name.trim(), qty, price > 0 ? price : undefined)
    setName('')
    setQty(1)
    setPrice(0)
    reload()
  }

  async function handleToggle(item: ShoppingListItem) {
    await api.toggleShoppingItem(item.id)
    reload()
  }

  async function handleDelete(item: ShoppingListItem) {
    await api.deleteShoppingItem(item.id)
    reload()
  }

  async function handleScanCapture(blob: Blob) {
    setScanBusy(true)
    setScanError(null)
    try {
      const products = await api.scanUpload(blob, 'shop.jpg')
      setScannedProducts(products)
    } catch (err) {
      setScanError(err instanceof api.ApiError ? err.detail : 'Scan failed')
    } finally {
      setScanBusy(false)
    }
  }

  async function handleAddScanned(p: Product) {
    await api.addShoppingItem(p.name || p.barcode, 1, p.price_estimate ?? undefined)
    reload()
  }

  const totalEstimate = items.reduce(
    (sum, item) => sum + (item.estimated_price ? item.estimated_price * item.quantity : 0),
    0,
  )

  return (
    <div>
      <h1 className="display text-2xl font-bold mb-6">🛒 Shopping Assistant</h1>

      <form onSubmit={handleAdd} className="card mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Item name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="w-24">
          <label className="label">Qty</label>
          <input
            type="number"
            min={1}
            className="input"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="w-32">
          <label className="label">Est. price ($)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            className="input"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <button className="btn-solid" type="submit" disabled={!name.trim()}>
          ➕ Add to list
        </button>
      </form>

      <div className="card mb-6">
        {loading ? (
          <p className="text-muted font-mono text-sm">Loading…</p>
        ) : error ? (
          <p className="text-laser text-sm">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-muted text-sm">Your shopping list is empty.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-2 border-b border-line/60 last:border-0 text-sm"
              >
                <input
                  type="checkbox"
                  checked={item.is_purchased}
                  onChange={() => handleToggle(item)}
                  className="w-4 h-4 accent-laser"
                />
                <span className={`flex-1 ${item.is_purchased ? 'line-through text-muted' : ''}`}>
                  {item.name}
                </span>
                <span className="text-muted w-12">x{item.quantity}</span>
                <span className="w-20 text-right">
                  {item.estimated_price ? `$${item.estimated_price.toFixed(2)}` : '-'}
                </span>
                <button
                  className="text-muted hover:text-laser transition-colors"
                  onClick={() => handleDelete(item)}
                  aria-label="Delete item"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-line flex justify-between items-center">
            <span className="label mb-0">Estimated Total</span>
            <span className="display text-xl font-bold text-laser">${totalEstimate.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="display text-base font-semibold mb-1">📷 Scan While Shopping</h2>
        <p className="text-muted text-sm mb-4">
          Quickly scan a product to check its price and add it to your list.
        </p>
        <WebcamCapture onCapture={handleScanCapture} disabled={scanBusy} />
        {scanError && <p className="text-laser text-sm mt-3">{scanError}</p>}

        {scannedProducts.map((p) => (
          <div key={p.barcode} className="flex items-center justify-between gap-4 mt-4 text-sm">
            <span>
              <span className="font-semibold">{p.name || p.barcode}</span> — est. $
              {(p.price_estimate ?? 0).toFixed(2)}
            </span>
            <button className="btn" onClick={() => handleAddScanned(p)}>
              Add {p.barcode} to shopping list
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
