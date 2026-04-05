import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    todaySales: 'مبيعات اليوم',
    todayRevenue: 'إيرادات اليوم',
    totalParts: 'إجمالي القطع',
    lowStock: 'مخزون منخفض',
    recentSales: 'آخر المبيعات',
    invoice: 'رقم الفاتورة',
    type: 'النوع',
    customer: 'العميل',
    total: 'الإجمالي',
    tax: 'الضريبة',
    date: 'التاريخ',
    seller: 'البائع',
    cash: 'نقدي',
    credit: 'آجل',
    noData: 'لا توجد مبيعات حتى الآن',
    pieces: 'قطعة',
    orders: 'طلب',
  },
  en: {
    todaySales: "Today's Sales",
    todayRevenue: "Today's Revenue",
    totalParts: 'Total Parts',
    lowStock: 'Low Stock',
    recentSales: 'Recent Sales',
    invoice: 'Invoice #',
    type: 'Type',
    customer: 'Customer',
    total: 'Total',
    tax: 'Tax',
    date: 'Date',
    seller: 'Seller',
    cash: 'Cash',
    credit: 'Credit',
    noData: 'No sales yet',
    pieces: 'parts',
    orders: 'orders',
  },
}

function Dashboard() {
  const { lang } = useLang()
  const t = texts[lang]
  const [stats, setStats] = useState({ salesCount: 0, revenue: 0, totalParts: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orders, parts] = await Promise.all([
          apiFetch('/orders'),
          apiFetch('/parts'),
        ])

        const today = new Date().toISOString().split('T')[0]
        const todayOrders = orders.filter((o) => o.created_at && o.created_at.startsWith(today))

        setStats({
          salesCount: todayOrders.length,
          revenue: todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
          totalParts: parts.reduce((sum, p) => sum + (p.quantity || 0), 0),
          lowStock: parts.filter((p) => p.quantity <= 5).length,
        })

        setRecentOrders(orders.slice(0, 10))
      } catch {
        setRecentOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      label: t.todaySales,
      value: stats.salesCount,
      suffix: t.orders,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: t.todayRevenue,
      value: stats.revenue.toFixed(2),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: t.totalParts,
      value: stats.totalParts,
      suffix: t.pieces,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      label: t.lowStock,
      value: stats.lowStock,
      suffix: t.pieces,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9b2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ]

  return (
    <Layout titleKey="dashboard">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4"
            style={{ borderColor: '#dedad0', borderLeft: '4px solid #9b2626' }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(155,38,38,0.08)' }}>
              {card.icon}
            </div>
            <div>
              <div className="text-sm" style={{ color: '#90887a' }}>{card.label}</div>
              <div className="text-2xl font-bold" style={{ color: '#18160f' }}>
                {card.value}
                {card.suffix && <span className="text-sm font-normal ms-1" style={{ color: '#90887a' }}>{card.suffix}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border" style={{ borderColor: '#dedad0' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: '#ede9e0' }}>
          <h3 className="text-base font-bold" style={{ color: '#18160f' }}>{t.recentSales}</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: '#90887a' }}>...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f4' }}>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.invoice}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.type}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.customer}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.total}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.tax}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.date}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.seller}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.order_id} className="border-b hover:bg-[#fdf9f9]" style={{ borderColor: '#ede9e0' }}>
                    <td className="px-4 py-3">{order.order_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: order.invoice_type === 'cash' ? '#e6f9e6' : '#fff3e6',
                          color: order.invoice_type === 'cash' ? '#166534' : '#9a3412',
                        }}
                      >
                        {order.invoice_type === 'cash' ? t.cash : t.credit}
                      </span>
                    </td>
                    <td className="px-4 py-3">{order.customer_name || '—'}</td>
                    <td className="px-4 py-3 font-medium">{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{parseFloat(order.tax || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{order.worker_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
