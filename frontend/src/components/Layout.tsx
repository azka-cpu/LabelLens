import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Account', icon: '01' },
  { to: '/dashboard', label: 'Dashboard', icon: '02' },
  { to: '/scanner', label: 'Scanner', icon: '03' },
  { to: '/shopping-list', label: 'Shopping List', icon: '04' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-64 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="px-5 py-6 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-laser shadow-glow" />
            <span className="display text-lg font-bold tracking-tight">SmartScan</span>
          </div>
          <p className="text-xs text-muted mt-1 font-mono">Barcode &amp; Product Assistant</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-surface2 text-laser' : 'text-muted hover:text-ink hover:bg-surface2'
                }`
              }
            >
              <span className="font-mono text-[11px] text-muted">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-line">
          {user && (
            <div className="px-3 mb-3">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          )}
          <button onClick={handleLogout} className="btn-ghost w-full justify-start">
            &larr; Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
