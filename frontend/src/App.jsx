import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalesInvoice from './pages/SalesInvoice'
import Returns from './pages/Returns'
import AccountStatement from './pages/AccountStatement'
import Inventory from './pages/Inventory'
import UserManagement from './pages/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesInvoice /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute adminOnly><Returns /></ProtectedRoute>} />
        <Route path="/statement" element={<ProtectedRoute adminOnly><AccountStatement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute adminOnly><Inventory /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
