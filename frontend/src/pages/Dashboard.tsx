import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as api from '../api/client'
import RequireAuth from '../components/RequireAuth'
import type { DashboardSummary, ScanHistoryEntry, ScanTrendPoint } from '../types'

export default function Dashboard() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  )
}

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [trend, setTrend] = useState<ScanTrendPoint[]>([])
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getDashboardSummary()
      .then(setSummary)
      .catch(() => setError('Could not load dashboard summary.'))
    api.getScanTrend(30).then(setTrend).catch(() => setTrend([]))
    api.getScanHistory(20).then(setHistory).catch(() => setHistory([]))
  }, [])

  if (error) return <p className="text-laser text-sm">{error}</p>
  if (!summary) return <p className="text-muted font-mono text-sm">Loading…</p>

  const mostScanned = summary.most_scanned_products ?? []

  return (
    <div>
      <h1 className="display text-2xl font-bold mb-6">📊 Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Scans" value={summary.total_scans} />
        <StatCard label="Unique Products Scanned" value={summary.unique_products_scanned} />
        <StatCard label="Shopping List Pending" value={summary.shopping_list_pending} />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card md:col-span-2">
          <p className="label mb-4">Scan Activity (30 days)</p>
          {trend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8891A6', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148,163,184,0.12)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#8891A6', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#121826', border: '1px solid rgba(148,163,184,0.2)' }}
                  labelStyle={{ color: '#E7ECF5' }}
                />
                <Line type="monotone" dataKey="count" stroke="#FF4757" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No scan activity yet. Start scanning to see trends here." />
          )}
        </div>

        <div className="card">
          <p className="label mb-4">Most Scanned Products</p>
          {mostScanned.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mostScanned}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="barcode"
                  tick={{ fill: '#8891A6', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(148,163,184,0.12)' }}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#8891A6', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid rgba(148,163,184,0.2)' }} />
                <Bar dataKey="count" fill="#2DD8B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No data yet." />
          )}
        </div>
      </div>

      <div className="card">
        <p className="label mb-4">🕓 Recent Scan History</p>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  <th className="py-2 pr-4 font-mono font-medium">Barcode</th>
                  <th className="py-2 pr-4 font-mono font-medium">Method</th>
                  <th className="py-2 pr-4 font-mono font-medium">Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-4 font-mono">{h.barcode}</td>
                    <td className="py-2 pr-4 capitalize">{h.scan_method}</td>
                    <td className="py-2 pr-4 text-muted">{h.scanned_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No scans recorded yet." />
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="label mb-2">{label}</p>
      <p className="display text-3xl font-bold text-laser">{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-muted text-sm py-8 text-center">{text}</p>
}
