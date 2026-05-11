import { useState, useEffect } from 'react'
import { useLang } from '../utils/lang'

function TopBar({ titleKey }) {
  const { lang } = useLang()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const pageTitles = {
    ar: {
      dashboard: 'لوحة التحكم',
      sales: 'فاتورة البيع',
      returns: 'المرتجعات',
      statement: 'كشف الحساب',
      inventory: 'المخزون',
      users: 'المستخدمون',
      audit: 'سجل النظام',
    },
    en: {
      dashboard: 'Dashboard',
      sales: 'Sales Invoice',
      returns: 'Returns',
      statement: 'Account Statement',
      inventory: 'Inventory',
      users: 'User Management',
      audit: 'Audit Log',
    },
  }

  const dateStr = time.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const timeStr = time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <header
      className="fixed top-0 right-0 h-14 flex items-center justify-between px-6 bg-white border-b z-10 print:hidden"
      style={{ left: '220px', borderColor: '#dedad0' }}
    >
      <h2 className="text-lg font-bold" style={{ color: '#18160f' }}>
        {pageTitles[lang][titleKey]}
      </h2>
      <div className="flex items-center gap-4 text-sm" style={{ color: '#90887a' }}>
        <span>{dateStr}</span>
        <span className="font-mono">{timeStr}</span>
      </div>
    </header>
  )
}

export default TopBar
