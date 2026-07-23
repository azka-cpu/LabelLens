import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Account from './pages/Account'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import ShoppingList from './pages/ShoppingList'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Account />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
