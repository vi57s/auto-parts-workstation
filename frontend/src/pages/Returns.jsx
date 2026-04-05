import { useState } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    lookupTitle: 'البحث عن فاتورة',
    invoiceId: 'رقم الفاتورة',
    placeholder: 'أدخل رقم الفاتورة',
    search: 'بحث',
    invoiceDetails: 'تفاصيل الفاتورة',
    date: 'التاريخ',
    seller: 'البائع',
    total: 'الإجمالي',
    selectItems: 'اختر الأصناف للإرجاع',
    partName: 'اسم القطعة',
    serial: 'الرقم التسلسلي',
    soldQty: 'الكمية المباعة',
    returnQty: 'كمية الإرجاع',
    admin: 'المسؤول',
    returnDate: 'تاريخ الإرجاع',
    submit: 'تنفيذ الإرجاع',
    submitting: 'جاري التنفيذ...',
    success: 'تم الإرجاع بنجاح',
    error: 'حدث خطأ',
    notFound: 'الفاتورة غير موجودة',
    noSelection: 'يرجى اختيار صنف واحد على الأقل',
    today: 'اليوم',
  },
  en: {
    lookupTitle: 'Lookup Invoice',
    invoiceId: 'Invoice ID',
    placeholder: 'Enter invoice number',
    search: 'Search',
    invoiceDetails: 'Invoice Details',
    date: 'Date',
    seller: 'Seller',
    total: 'Total',
    selectItems: 'Select Items to Return',
    partName: 'Part Name',
    serial: 'Serial',
    soldQty: 'Sold Qty',
    returnQty: 'Return Qty',
    admin: 'Admin',
    returnDate: 'Return Date',
    submit: 'Process Return',
    submitting: 'Processing...',
    success: 'Return processed successfully',
    error: 'An error occurred',
    notFound: 'Invoice not found',
    noSelection: 'Please select at least one item',
    today: 'Today',
  },
}

function Returns() {
  const { lang } = useLang()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [invoiceId, setInvoiceId] = useState('')
  const [order, setOrder] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [selected, setSelected] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const inputStyle = { border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }
  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  const handleSearch = async () => {
    if (!invoiceId.trim()) return
    setSearchError('')
    setOrder(null)
    setSelected({})
    setMessage({ text: '', type: '' })
    try {
      const data = await apiFetch(`/orders/${invoiceId.trim()}`)
      setOrder(data)
    } catch {
      setSearchError(t.notFound)
    }
  }

  const toggleItem = (partId) => {
    setSelected((prev) => {
      const copy = { ...prev }
      if (copy[partId]) {
        delete copy[partId]
      } else {
        const item = order.items.find((it) => it.part_id === partId)
        copy[partId] = { quantity: 1, max: item.quantity }
      }
      return copy
    })
  }

  const updateReturnQty = (partId, qty) => {
    setSelected((prev) => ({
      ...prev,
      [partId]: { ...prev[partId], quantity: Math.min(Math.max(1, qty), prev[partId].max) },
    }))
  }

  const handleSubmit = async () => {
    const entries = Object.entries(selected)
    if (entries.length === 0) {
      setMessage({ text: t.noSelection, type: 'error' })
      return
    }

    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      for (const [partId, val] of entries) {
        await apiFetch('/returns', {
          method: 'POST',
          body: JSON.stringify({
            order_id: order.order_id,
            part_id: parseInt(partId),
            quantity: val.quantity,
          }),
        })
      }
      setMessage({ text: t.success, type: 'success' })
      window.print()
      setOrder(null)
      setSelected({})
      setInvoiceId('')
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout titleKey="returns">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#dedad0' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#18160f' }}>{t.lookupTitle}</h3>
          <div className="flex gap-2">
            <input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.placeholder}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: '#9b2626' }}
            >
              {t.search}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-600 mt-2">{searchError}</p>}
        </div>

        {order && (
          <>
            <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#dedad0' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#18160f' }}>{t.invoiceDetails}</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span style={{ color: '#90887a' }}>{t.invoiceId}: </span>
                  <span className="font-medium">{order.order_id}</span>
                </div>
                <div>
                  <span style={{ color: '#90887a' }}>{t.date}: </span>
                  <span className="font-medium">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div>
                  <span style={{ color: '#90887a' }}>{t.seller}: </span>
                  <span className="font-medium">{order.worker_name || '—'}</span>
                </div>
                <div>
                  <span style={{ color: '#90887a' }}>{t.total}: </span>
                  <span className="font-medium">{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border" style={{ borderColor: '#dedad0' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: '#ede9e0' }}>
                <h3 className="text-sm font-bold" style={{ color: '#18160f' }}>{t.selectItems}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f4' }}>
                    <th className="px-4 py-2 text-start w-10"></th>
                    <th className="px-4 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.partName}</th>
                    <th className="px-4 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.serial}</th>
                    <th className="px-4 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.soldQty}</th>
                    <th className="px-4 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.returnQty}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.part_id} className="border-b" style={{ borderColor: '#ede9e0' }}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={!!selected[item.part_id]}
                          onChange={() => toggleItem(item.part_id)}
                          className="accent-[#9b2626]"
                        />
                      </td>
                      <td className="px-4 py-2">{item.part_name}</td>
                      <td className="px-4 py-2">{item.serial_number}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">
                        {selected[item.part_id] ? (
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={selected[item.part_id].quantity}
                            onChange={(e) => updateReturnQty(item.part_id, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 rounded text-sm outline-none"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#dedad0' }}>
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <span style={{ color: '#90887a' }}>{t.admin}: </span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div>
                  <span style={{ color: '#90887a' }}>{t.returnDate}: </span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {message.text && (
                <div
                  className={`mb-4 text-sm text-center py-2 px-3 rounded-lg border ${
                    message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(selected).length === 0}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#9b2626' }}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Returns
