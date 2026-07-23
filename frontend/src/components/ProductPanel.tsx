import { useRef, useState } from 'react'
import * as api from '../api/client'
import type { AIAnalysisResponse, OCRExtractionResponse, Product } from '../types'

export default function ProductPanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const [addStatus, setAddStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [addError, setAddError] = useState<string | null>(null)

  const [ocrResult, setOcrResult] = useState<OCRExtractionResponse | null>(null)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const ocrFileRef = useRef<HTMLInputElement>(null)

  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function handleAddToList() {
    setAddStatus('busy')
    setAddError(null)
    try {
      await api.addShoppingItem(product.name || product.barcode, qty, product.price_estimate ?? undefined)
      setAddStatus('done')
    } catch (err) {
      setAddStatus('error')
      setAddError(err instanceof api.ApiError ? err.detail : 'Could not add item')
    }
  }

  async function handleOcrExtract() {
    const file = ocrFileRef.current?.files?.[0]
    if (!file) return
    setOcrBusy(true)
    setOcrError(null)
    try {
      const result = await api.ocrExtract(file, file.name)
      setOcrResult(result)
    } catch (err) {
      setOcrError(err instanceof api.ApiError ? err.detail : 'OCR failed')
    } finally {
      setOcrBusy(false)
    }
  }

  async function handleAnalyze() {
    setAiBusy(true)
    setAiError(null)
    try {
      const result = await api.analyzeProduct(product.id)
      setAiResult(result)
    } catch (err) {
      setAiError(err instanceof api.ApiError ? err.detail : 'AI analysis failed')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <div className="card mt-6">
      <h2 className="display text-xl font-bold mb-4">{product.name || product.barcode}</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name ?? product.barcode} className="rounded-lg border border-line w-full" />
          ) : (
            <div className="rounded-lg border border-line bg-surface2 h-40 flex items-center justify-center text-muted text-sm">
              No image available
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-2 text-sm">
          <p>
            <span className="text-muted">Barcode:</span> {product.barcode} ({product.barcode_type})
          </p>
          <p>
            <span className="text-muted">Brand:</span> {product.brand || 'Unknown'}
          </p>
          <p>
            <span className="text-muted">Category:</span> {product.category || 'Unknown'}
          </p>

          <div className="pt-3 flex items-end gap-3">
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                min={1}
                className="input w-24"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <button className="btn" onClick={handleAddToList} disabled={addStatus === 'busy'}>
              🛒 Add to Shopping List
            </button>
          </div>
          {addStatus === 'done' && <p className="text-mint text-sm">Added to shopping list!</p>}
          {addStatus === 'error' && <p className="text-laser text-sm">{addError}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-line">
        <div>
          <h3 className="display text-base font-semibold mb-3">🔍 Read Label (OCR)</h3>
          <input ref={ocrFileRef} type="file" accept="image/jpeg,image/png" className="input" />
          <button className="btn mt-3" onClick={handleOcrExtract} disabled={ocrBusy}>
            {ocrBusy ? 'Extracting…' : 'Extract label data'}
          </button>
          {ocrError && <p className="text-laser text-sm mt-2">{ocrError}</p>}
          {ocrResult && (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-muted">Expiry date:</span> {ocrResult.expiry_date || 'Not found'}
              </p>
              <p>
                <span className="text-muted">Manufacturing date:</span> {ocrResult.manufacturing_date || 'Not found'}
              </p>
              {ocrResult.ingredients_text && (
                <div>
                  <label className="label">Ingredients</label>
                  <textarea className="input" rows={3} readOnly value={ocrResult.ingredients_text} />
                </div>
              )}
              {ocrResult.nutrition_text && (
                <div>
                  <label className="label">Nutrition facts</label>
                  <textarea className="input" rows={3} readOnly value={ocrResult.nutrition_text} />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="display text-base font-semibold mb-3">🤖 AI Product Analysis</h3>
          <button className="btn" onClick={handleAnalyze} disabled={aiBusy}>
            {aiBusy ? 'Analyzing…' : 'Analyze with AI'}
          </button>
          {aiError && <p className="text-laser text-sm mt-2">{aiError}</p>}
          {aiResult && (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <span className="text-muted">Summary:</span> {aiResult.summary}
              </p>
              <div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full bg-mint"
                    style={{ width: `${Math.min(aiResult.health_score, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">Health score: {aiResult.health_score}/100</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label mb-1">Pros</p>
                  {aiResult.pros.map((p, i) => (
                    <p key={i}>✅ {p}</p>
                  ))}
                </div>
                <div>
                  <p className="label mb-1">Cons</p>
                  {aiResult.cons.map((c, i) => (
                    <p key={i}>⚠️ {c}</p>
                  ))}
                </div>
              </div>
              <p>
                <span className="text-muted">Recommendation:</span> {aiResult.recommendations}
              </p>
              {aiResult.harmful_additives.length > 0 && (
                <div>
                  <p className="label mb-1">Harmful additives detected</p>
                  {aiResult.harmful_additives.map((a, i) => (
                    <p key={i}>
                      • <span className="font-semibold">{a.name}</span> ({a.risk_level}): {a.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
