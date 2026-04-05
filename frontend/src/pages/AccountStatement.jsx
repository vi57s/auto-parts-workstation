import { useState } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    filters: 'تصفية',
    from: 'من',
    to: 'إلى',
    customer: 'العميل',
    customerPlaceholder: 'اسم العميل (اختياري)',
    apply: 'تطبيق',
    invoice: 'رقم الفاتورة',
    type: 'النوع',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    total: 'الإجمالي',
    returns: 'المرتجعات',
    net: 'الصافي',
    seller: 'البائع',
    approver: 'المسؤول',
    date: 'التاريخ',
    cash: 'نقدي',
    credit: 'آجل',
    noData: 'لا توجد بيانات',
    print: 'طباعة',
    totalRevenue: 'إجمالي الإيرادات',
    totalReturns: 'إجمالي المرتجعات',
    netProfit: 'صافي الربح',
    loading: 'جاري التحميل...',
  },
  en: {
    filters: 'Filters',
    from: 'From',
    to: 'To',
    customer: 'Customer',
    customerPlaceholder: 'Customer name (optional)',
    apply: 'Apply',
    invoice: 'Invoice #',
    type: 'Type',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    returns: 'Returns',
    net: 'Net',
    seller: 'Seller',
    approver: 'Approver',
    date: 'Date',
    cash: 'Cash',
    credit: 'Credit',
    noData: 'No data available',
    print: 'Print',
    totalRevenue: 'Total Revenue',
    totalReturns: 'Total Returns',
    netProfit: 'Net Profit',
    loading: 'Loading...',
  },
}

function AccountStatement() {
  const { lang } = useLang()
  const t = texts[lang]

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const inputStyle = { border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }
  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  const handleApply = async () => {
    setLoading(true)
    setFetched(true)
    try {
      let results = await apiFetch('/orders/statement')

      if (dateFrom) {
        results = results.filter((r) => r.created_at && r.created_at >= dateFrom)
      }
      if (dateTo) {
        const toEnd = dateTo + 'T23:59:59'
        results = results.filter((r) => r.created_at && r.created_at <= toEnd)
      }
      if (customerFilter.trim()) {
        const q = customerFilter.toLowerCase()
        results = results.filter((r) => r.customer_name && r.customer_name.toLowerCase().includes(q))
      }

      setData(results)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const totals = data.reduce(
    (acc, row) => ({
      revenue: acc.revenue + parseFloat(row.total_amount || 0),
      returns: acc.returns + parseFloat(row.refund_amount || 0),
    }),
    { revenue: 0, returns: 0 }
  )
  totals.net = totals.revenue - totals.returns

  return (
    <Layout titleKey="statement">
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 print:hidden" style={{ borderColor: '#dedad0' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#18160f' }}>{t.filters}</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#90887a' }}>{t.from}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#90887a' }}>{t.to}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#90887a' }}>{t.customer}</label>
            <input
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder={t.customerPlaceholder}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: '#9b2626' }}
          >
            {t.apply}
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: '#dedad0', color: '#18160f' }}
          >
            {t.print}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border print:shadow-none" style={{ borderColor: '#dedad0' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: '#90887a' }}>{t.loading}</div>
        ) : !fetched ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f4' }}>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.invoice}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.type}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.customer}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.total}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.tax}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.returns}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.net}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.seller}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.approver}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.date}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const total = parseFloat(row.total_amount || 0)
                  const refund = parseFloat(row.refund_amount || 0)
                  return (
                    <tr key={i} className="border-b hover:bg-[#fdf9f9]" style={{ borderColor: '#ede9e0' }}>
                      <td className="px-3 py-2">{row.order_id}</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: row.invoice_type === 'cash' ? '#e6f9e6' : '#fff3e6',
                            color: row.invoice_type === 'cash' ? '#166534' : '#9a3412',
                          }}
                        >
                          {row.invoice_type === 'cash' ? t.cash : t.credit}
                        </span>
                      </td>
                      <td className="px-3 py-2">{row.customer_name || '—'}</td>
                      <td className="px-3 py-2 font-medium">{total.toFixed(2)}</td>
                      <td className="px-3 py-2">{parseFloat(row.tax || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-red-600">{refund > 0 ? refund.toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 font-medium">{(total - refund).toFixed(2)}</td>
                      <td className="px-3 py-2">{row.worker_name || '—'}</td>
                      <td className="px-3 py-2">{row.return_admin_name || '—'}</td>
                      <td className="px-3 py-2">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2" style={{ borderColor: '#dedad0', backgroundColor: '#f9f8f4' }}>
                  <td colSpan="3" className="px-3 py-3">{t.totalRevenue}</td>
                  <td className="px-3 py-3">{totals.revenue.toFixed(2)}</td>
                  <td></td>
                  <td className="px-3 py-3 text-red-600">{totals.returns.toFixed(2)}</td>
                  <td className="px-3 py-3" style={{ color: '#166534' }}>{totals.net.toFixed(2)}</td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AccountStatement
