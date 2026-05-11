import { NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../utils/lang'

const texts = {
  ar: {
    dashboard: 'لوحة التحكم',
    sales: 'فاتورة البيع',
    returns: 'المرتجعات',
    statement: 'كشف الحساب',
    inventory: 'المخزون',
    users: 'المستخدمون',
    audit: 'سجل النظام',
    logout: 'تسجيل الخروج',
    langToggle: 'English',
  },
  en: {
    dashboard: 'Dashboard',
    sales: 'Sales Invoice',
    returns: 'Returns',
    statement: 'Account Statement',
    inventory: 'Inventory',
    users: 'User Management',
    audit: 'Audit Log',
    logout: 'Logout',
    langToggle: 'عربي',
  },
}

const navItems = [
  {
    key: 'dashboard',
    path: '/dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: 'sales',
    path: '/sales',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'returns',
    path: '/returns',
    adminOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
  },
  {
    key: 'statement',
    path: '/statement',
    ownerOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    key: 'inventory',
    path: '/inventory',
    adminOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: 'users',
    path: '/users',
    adminOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'audit',
    path: '/audit',
    ownerOnly: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
]

function Sidebar() {
  const { lang, setLang } = useLang()
  const navigate = useNavigate()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-[220px] flex flex-col print:hidden" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white leading-tight">AL-HAKIMI</h1>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9b2626' }}>
          AUTO SPARE PARTS
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.ownerOnly && user.role !== 'owner') return null
          if (item.adminOnly && user.role !== 'admin' && user.role !== 'owner') return null
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-[#a0aec0] hover:text-white'
                }`
              }
              style={({ isActive }) => (isActive ? { backgroundColor: '#9b2626' } : {})}
            >
              {item.icon}
              <span>{t[item.key]}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-2">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="w-full px-3 py-1.5 rounded-full text-sm border transition-colors text-center"
          style={{ borderColor: '#d8d4c8', backgroundColor: '#f0ede6', color: '#90887a' }}
          onMouseEnter={(e) => (e.target.style.color = '#9b2626')}
          onMouseLeave={(e) => (e.target.style.color = '#90887a')}
        >
          {t.langToggle}
        </button>
      </div>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-white text-sm font-medium truncate">{user.name}</div>
        <div className="text-[#a0aec0] text-xs">{user.role}</div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#a0aec0] hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {t.logout}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
