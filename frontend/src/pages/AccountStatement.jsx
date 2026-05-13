import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'
import InvoiceModal from '../components/InvoiceModal'

function toDateString(d) {
  return d.toISOString().split('T')[0]
}

function defaultRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: toDateString(from), to: toDateString(to) }
}

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
    partiallyReturned: 'مرتجع جزئي',
    fullyReturned: 'مرتجع كلي',
    noData: 'لا توجد بيانات',
    print: 'طباعة',
    totalRevenue: 'إجمالي الإيرادات',
    totalReturns: 'إجمالي المرتجعات',
    netProfit: 'صافي الربح',
    loading: 'جاري التحميل...',
    accessDenied: 'ليس لديك صلاحية للوصول',
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
    partiallyReturned: 'Partial Return',
    fullyReturned: 'Fully Returned',
    noData: 'No data available',
    print: 'Print',
    totalRevenue: 'Total Revenue',
    totalReturns: 'Total Returns',
    netProfit: 'Net Profit',
    loading: 'Loading...',
    accessDenied: 'Access denied',
  },
}

function AccountStatement() {
  const { lang } = useLang()
  const t = texts[lang]

  const initialRange = defaultRange()
  const [dateFrom, setDateFrom] = useState(initialRange.from)
  const [dateTo, setDateTo] = useState(initialRange.to)
  const [customerFilter, setCustomerFilter] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetched, setFetched] = useState(false)
  const [accessError, setAccessError] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const inputStyle = { border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }
  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  const runQuery = useCallback(async (from, to, customer) => {
    setLoading(true)
    setFetched(true)
    setAccessError(false)
    try {
      const [ordersRaw, returnsRaw] = await Promise.all([
        apiFetch('/orders/full-statement'),
        apiFetch('/returns').catch(() => []),
      ])
      const orders = Array.isArray(ordersRaw) ? ordersRaw : Array.isArray(ordersRaw?.data) ? ordersRaw.data : []
      const returns = Array.isArray(returnsRaw) ? returnsRaw : Array.isArray(returnsRaw?.data) ? returnsRaw.data : []

      const returnsByOrder = {}
      for (const r of returns) {
        const oid = r.order_id
        if (!returnsByOrder[oid]) {
          returnsByOrder[oid] = { total: 0, approvers: new Set() }
        }
        returnsByOrder[oid].total += parseFloat(r.refund_amount ?? 0)
        if (r.admin_name) returnsByOrder[oid].approvers.add(r.admin_name)
      }

      let rows = orders.map((o) => {
        const entry = returnsByOrder[o.order_id]
        const refund = entry ? entry.total : 0
        const approver = entry ? Array.from(entry.approvers).join(', ') : ''
        const total = parseFloat(o.total_amount || 0)
        const returns_status = refund >= total - 0.01 && refund > 0 ? 'full' : refund > 0 ? 'partial' : 'none'
        return {
          order_id: o.order_id,
          invoice_number: o.invoice_number,
          invoice_type: o.invoice_type,
          customer_name: o.customer_name,
          total_amount: total,
          tax: parseFloat(o.tax || 0),
          refund_amount: refund,
          returns_status,
          worker_name: o.worker_name,
          return_admin_name: approver,
          created_at: o.created_at,
        }
      })

      if (from) {
        rows = rows.filter((r) => r.created_at && r.created_at >= from)
      }
      if (to) {
        const toEnd = to + 'T23:59:59'
        rows = rows.filter((r) => r.created_at && r.created_at <= toEnd)
      }
      if (customer && customer.trim()) {
        const q = customer.toLowerCase()
        rows = rows.filter((r) => r.customer_name && r.customer_name.toLowerCase().includes(q))
      }

      setData(rows)
    } catch (err) {
      if (err && /Access denied|403/i.test(err.message || '')) {
        setAccessError(true)
      }
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    runQuery(initialRange.from, initialRange.to, '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = () => {
    runQuery(dateFrom, dateTo, customerFilter)
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
        ) : accessError ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9b2626' }}>{t.accessDenied}</div>
        ) : !fetched ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full text-sm">
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
                {data.map((row) => {
                  const total = parseFloat(row.total_amount || 0)
                  const refund = parseFloat(row.refund_amount || 0)
                  return (
                    <tr key={row.order_id} className="border-b hover:bg-[#fdf9f9] cursor-pointer" style={{ borderColor: '#ede9e0' }} onClick={() => setSelectedOrderId(row.order_id)}>
                      <td className="px-3 py-2 font-mono text-xs">{row.invoice_number || row.order_id}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: row.invoice_type === 'cash' ? '#e6f9e6' : '#fff3e6',
                              color: row.invoice_type === 'cash' ? '#166534' : '#9a3412',
                            }}
                          >
                            {row.invoice_type === 'cash' ? t.cash : t.credit}
                          </span>
                          {row.returns_status === 'full' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#fde2e2', color: '#9b2626' }}>
                              {t.fullyReturned}
                            </span>
                          )}
                          {row.returns_status === 'partial' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#fff3e6', color: '#9a3412' }}>
                              {t.partiallyReturned}
                            </span>
                          )}
                        </div>
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

      <InvoiceModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        lang={lang}
      />
    </Layout>
  )
}

export default AccountStatement
