import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, adminOnly = false, ownerOnly = false }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (ownerOnly && user.role !== 'owner') {
    try {
      sessionStorage.setItem('access_denied_toast', '1')
    } catch {
      /* ignore */
    }
    return <Navigate to="/dashboard" replace />
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
