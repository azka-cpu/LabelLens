import { useRef, useState } from 'react'
import * as api from '../api/client'
import RequireAuth from '../components/RequireAuth'
import ProductPanel from '../components/ProductPanel'
import WebcamCapture from '../components/WebcamCapture'
import type { Product } from '../types'

type Tab = 'camera' | 'upload' | 'manual'

export default function Scanner() {
  return (
    <RequireAuth>
      <ScannerContent />
    </RequireAuth>
  )
}

function ScannerContent() {
  const [tab, setTab] = useState<Tab>('camera')
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const uploadRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState('')
  const barcodeType = api.detectBarcodeType(barcode)

  async function handleCameraCapture(blob: Blob) {
    setBusy(true)
    setError(null)
    try {
      const products = await api.scanUpload(blob, 'camera.jpg')
      if (products.length) setProduct(products[0])
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleUploadScan() {
    const file = uploadRef.current?.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const products = await api.scanUpload(file, file.name)
      if (products.length) setProduct(products[0])
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleManualLookup() {
    setBusy(true)
    setError(null)
    try {
      const result = await api.manualBarcode(barcode, barcodeType)
      setProduct(result)
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Lookup failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="display text-2xl font-bold mb-6">📷 Barcode Scanner</h1>

      <div className="card">
        <div className="flex border-b border-line mb-5">
          {(['camera', 'upload', 'manual'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'camera' ? 'Camera' : t === 'upload' ? 'Upload Image' : 'Manual Entry'}
            </button>
          ))}
        </div>

        {tab === 'camera' && (
          <div>
            <p className="text-muted text-sm mb-3">
              Take a photo of a barcode (EAN-13, UPC, QR, Code-128 supported).
            </p>
            <WebcamCapture onCapture={handleCameraCapture} disabled={busy} />
          </div>
        )}

        {tab === 'upload' && (
          <div>
            <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="input" />
            <button className="btn mt-3" onClick={handleUploadScan} disabled={busy}>
              {busy ? 'Scanning…' : 'Scan uploaded image'}
            </button>
          </div>
        )}

        {tab === 'manual' && (
          <div className="max-w-sm">
            <label className="label">Barcode number</label>
            <input
              className="input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 0123456789012"
            />
            {barcode && (
              <p className="text-xs text-muted mt-1">
                Detected type: <span className="font-mono">{barcodeType}</span>
              </p>
            )}
            <button className="btn mt-3" onClick={handleManualLookup} disabled={!barcode || busy}>
              {busy ? 'Looking up…' : 'Look up'}
            </button>
          </div>
        )}

        {error && <p className="text-laser text-sm mt-4">{error}</p>}
      </div>

      {product && <ProductPanel product={product} />}
    </div>
  )
}
