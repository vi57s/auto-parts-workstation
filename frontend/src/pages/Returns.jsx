import { useState } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'
import { useReturnsDraft } from '../utils/returns'

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
    fullyReturned: 'تم إرجاعه بالكامل',
    returnedOf: (x, y) => `(تم إرجاع ${x} من ${y})`,
    qtyExceeded: 'الكمية المطلوبة تتجاوز المتاح للإرجاع',
    clear: 'مسح',
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
    fullyReturned: 'Fully returned',
    returnedOf: (x, y) => `(${x} of ${y} returned)`,
    qtyExceeded: 'Requested quantity exceeds remaining returnable amount',
    clear: 'Clear',
  },
}

function Returns() {
  const { lang } = useLang()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const { draft, updateDraft, resetDraft } = useReturnsDraft()
  const { invoiceId, order, returnedMap, selected } = draft

  const [searchError, setSearchError] = useState('')
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

  const loadReturnedMap = async (orderId) => {
    try {
      const meta = await apiFetch(`/orders/${orderId}/returns-meta`)
      const list = Array.isArray(meta) ? meta : []
      const map = {}
      for (const ret of list) {
        const itemsArr = Array.isArray(ret.items) ? ret.items : []
        for (const item of itemsArr) {
          const pid = item.part_id
          const qty = parseInt(item.quantity, 10) || 0
          map[pid] = (map[pid] || 0) + qty
        }
      }
      return map
    } catch {
      return {}
    }
  }

  const handleSearch = async () => {
    if (!invoiceId.trim()) return
    setSearchError('')
    setMessage({ text: '', type: '' })
    updateDraft({ order: null, returnedMap: {}, selected: {} })
    try {
      const trimmed = invoiceId.trim()
      const data = await apiFetch(`/orders/by-invoice-number/${encodeURIComponent(trimmed)}`)
      const map = await loadReturnedMap(data.order_id)
      updateDraft({ order: data, returnedMap: map, selected: {} })
    } catch {
      setSearchError(t.notFound)
      updateDraft({ order: null, returnedMap: {}, selected: {} })
    }
  }

  const remainingFor = (item) => {
    const sold = parseInt(item.quantity, 10) || 0
    const returned = returnedMap[item.part_id] || 0
    return Math.max(0, sold - returned)
  }

  const toggleItem = (partId) => {
    updateDraft((prev) => {
      const copy = { ...prev.selected }
      if (copy[partId]) {
        delete copy[partId]
        return { ...prev, selected: copy }
      }
      const item = prev.order.items.find((it) => it.part_id === partId)
      const sold = parseInt(item.quantity, 10) || 0
      const returned = prev.returnedMap[item.part_id] || 0
      const remaining = Math.max(0, sold - returned)
      if (remaining <= 0) return prev
      copy[partId] = { quantity: 1, max: remaining }
      return { ...prev, selected: copy }
    })
  }

  const updateReturnQty = (partId, qty) => {
    updateDraft((prev) => ({
      ...prev,
      selected: {
        ...prev.selected,
        [partId]: {
          ...prev.selected[partId],
          quantity: Math.min(Math.max(1, qty), prev.selected[partId].max),
        },
      },
    }))
  }

  const handleSubmit = async () => {
    const entries = Object.entries(selected)
    if (entries.length === 0) {
      setMessage({ text: t.noSelection, type: 'error' })
      return
    }

    for (const [partId, val] of entries) {
      const item = order.items.find((it) => String(it.part_id) === String(partId))
      const remaining = item ? remainingFor(item) : 0
      if (val.quantity > remaining) {
        setMessage({ text: t.qtyExceeded, type: 'error' })
        return
      }
    }

    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      await apiFetch('/returns', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.order_id,
          items: entries.map(([partId, val]) => ({
            part_id: parseInt(partId),
            quantity: val.quantity,
          })),
        }),
      })
      setMessage({ text: t.success, type: 'success' })
      window.print()
      resetDraft()
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClear = () => {
    resetDraft()
    setSearchError('')
    setMessage({ text: '', type: '' })
  }

  return (
    <Layout titleKey="returns">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#dedad0' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#18160f' }}>{t.lookupTitle}</h3>
          <div className="flex gap-2">
            <input
              value={invoiceId}
              onChange={(e) => updateDraft({ invoiceId: e.target.value })}
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
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border"
              style={{ borderColor: '#dedad0', color: '#18160f' }}
            >
              {t.clear}
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
                  <span className="font-medium font-mono">{order.invoice_number || order.order_id}</span>
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
              <table dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full text-sm">
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
                  {order.items.map((item) => {
                    const sold = parseInt(item.quantity, 10) || 0
                    const alreadyReturned = returnedMap[item.part_id] || 0
                    const remaining = Math.max(0, sold - alreadyReturned)
                    const fullyReturned = remaining <= 0
                    return (
                      <tr key={item.part_id} className="border-b" style={{ borderColor: '#ede9e0' }}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={!!selected[item.part_id]}
                            onChange={() => toggleItem(item.part_id)}
                            disabled={fullyReturned}
                            className="accent-[#9b2626]"
                          />
                        </td>
                        <td className="px-4 py-2">{item.part_name}</td>
                        <td className="px-4 py-2">{item.serial_number}</td>
                        <td className="px-4 py-2">
                          <span>{sold}</span>
                          {alreadyReturned > 0 && (
                            <span className="ms-2 text-xs" style={{ color: '#9b2626' }}>
                              {t.returnedOf(alreadyReturned, sold)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {fullyReturned ? (
                            <span className="text-xs" style={{ color: '#90887a' }}>{t.fullyReturned}</span>
                          ) : selected[item.part_id] ? (
                            <input
                              type="number"
                              min="1"
                              max={remaining}
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
                    )
                  })}
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
