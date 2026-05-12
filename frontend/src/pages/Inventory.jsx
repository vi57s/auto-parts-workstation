import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    searchPlaceholder: 'بحث بالاسم أو الرقم التسلسلي...',
    addPart: 'إضافة قطعة',
    lowStock: 'المخزون المنخفض',
    depletingSoon: 'متوقع نفاده قريباً',
    itemsCount: (n) => `${n} منتجات`,
    serial: 'الرقم التسلسلي',
    name: 'الاسم',
    location: 'الموقع',
    qty: 'الكمية',
    stockHealth: 'حالة المخزون',
    salePrice: 'سعر البيع',
    costPrice: 'سعر التكلفة',
    addedBy: 'أضيفت بواسطة',
    addedDate: 'تاريخ الإضافة',
    actions: 'إجراءات',
    edit: 'تعديل',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    addTitle: 'إضافة قطعة جديدة',
    editTitle: 'تعديل القطعة',
    noData: 'لا توجد قطع',
    print: 'طباعة تقرير المخزون',
    success: 'تمت العملية بنجاح',
    error: 'حدث خطأ',
    required: 'يرجى ملء جميع الحقول المطلوبة',
    depletesIn: (n) => `ينفد خلال ${n} أيام`,
    partDetails: 'تفاصيل القطعة',
    salesHistory: 'سجل المبيعات',
    totalSold: 'إجمالي المبيعات',
    totalReturned: 'إجمالي المرتجعات',
    netSold: 'صافي المبيعات',
    noSalesInPeriod: 'لا توجد مبيعات في هذه الفترة',
    units: 'وحدة',
    from: 'من',
    to: 'إلى',
    apply: 'تطبيق',
  },
  en: {
    searchPlaceholder: 'Search by name or serial...',
    addPart: 'Add Part',
    lowStock: 'Low Stock',
    depletingSoon: 'Depleting Soon',
    itemsCount: (n) => `${n} items`,
    serial: 'Serial',
    name: 'Name',
    location: 'Location',
    qty: 'Qty',
    stockHealth: 'Stock Health',
    salePrice: 'Sale Price',
    costPrice: 'Cost Price',
    addedBy: 'Added By',
    addedDate: 'Added Date',
    actions: 'Actions',
    edit: 'Edit',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    addTitle: 'Add New Part',
    editTitle: 'Edit Part',
    noData: 'No parts found',
    print: 'Print Inventory Report',
    success: 'Operation completed successfully',
    error: 'An error occurred',
    required: 'Please fill all required fields',
    depletesIn: (n) => `Depletes in ${n} days`,
    partDetails: 'Part Details',
    salesHistory: 'Sales History',
    totalSold: 'Total Sold',
    totalReturned: 'Total Returned',
    netSold: 'Net Sold',
    noSalesInPeriod: 'No sales in this period',
    units: 'units',
    from: 'From',
    to: 'To',
    apply: 'Apply',
  },
}

const emptyForm = { serial_number: '', part_name: '', location: '', quantity: '', price: '', cost_price: '' }

function stockHealthBadge(days) {
  const d = parseFloat(days)
  if (d <= 7) return { backgroundColor: '#fde2e2', color: '#9b2626' }
  return { backgroundColor: '#fff3e6', color: '#9a3412' }
}

function initSalesDate(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function Inventory() {
  const { lang } = useLang()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [parts, setParts] = useState([])
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [depletingOnly, setDepletingOnly] = useState(false)
  const [depletingParts, setDepletingParts] = useState([])
  const [depletingLoading, setDepletingLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [selectedPart, setSelectedPart] = useState(null)
  const [partModalOpen, setPartModalOpen] = useState(false)
  const [salesHistory, setSalesHistory] = useState(null)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesFrom, setSalesFrom] = useState(() => initSalesDate(-30))
  const [salesTo, setSalesTo] = useState(() => initSalesDate(0))

  const inputStyle = { border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }
  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  const fetchParts = useCallback(async () => {
    try {
      const data = await apiFetch('/parts')
      setParts(data)
    } catch {
      setParts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDepleting = useCallback(async () => {
    setDepletingLoading(true)
    try {
      const data = await apiFetch('/parts/depleting-soon')
      setDepletingParts(Array.isArray(data) ? data : [])
    } catch {
      setDepletingParts([])
    } finally {
      setDepletingLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchParts()
    fetchDepleting()
  }, [fetchParts, fetchDepleting])

  const fetchPartSales = async (partId, from, to) => {
    setSalesLoading(true)
    try {
      const data = await apiFetch(`/parts/${partId}/sales?from=${from}&to=${to}`)
      setSalesHistory(data)
    } catch {
      setSalesHistory(null)
    } finally {
      setSalesLoading(false)
    }
  }

  const openPartModal = (part) => {
    setSelectedPart(part)
    setPartModalOpen(true)
    fetchPartSales(part.part_id ?? part.id, salesFrom, salesTo)
  }

  const lowStockCount = parts.filter((p) => (p.quantity || 0) <= 10).length

  const filtered = parts.filter((p) => {
    if (lowStockOnly && (p.quantity || 0) > 10) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.part_name.toLowerCase().includes(q) || p.serial_number.toLowerCase().includes(q)
  })

  const filteredDepleting = depletingParts.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.part_name.toLowerCase().includes(q) || p.serial_number.toLowerCase().includes(q)
  })

  const handleLowStockToggle = () => {
    setLowStockOnly((v) => !v)
    setDepletingOnly(false)
  }

  const handleDepletingToggle = () => {
    const next = !depletingOnly
    setDepletingOnly(next)
    setLowStockOnly(false)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setMessage({ text: '', type: '' })
    setShowModal(true)
  }

  const openEdit = (part) => {
    setEditingId(part.part_id)
    setForm({
      serial_number: part.serial_number,
      part_name: part.part_name,
      location: part.location || '',
      quantity: part.current_stock ?? part.quantity,
      price: part.price,
      cost_price: part.cost_price,
    })
    setMessage({ text: '', type: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.serial_number || !form.part_name || form.quantity === '' || form.price === '' || form.cost_price === '') {
      setMessage({ text: t.required, type: 'error' })
      return
    }

    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      if (editingId) {
        await apiFetch(`/parts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch('/parts', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      fetchParts()
      fetchDepleting()
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const isDepletingView = depletingOnly
  const displayRows = isDepletingView ? filteredDepleting : filtered
  const isTableLoading = loading || (isDepletingView && depletingLoading)
  const isRTL = lang === 'ar'

  return (
    <Layout titleKey="inventory">
      <div className="flex gap-3 mb-4 print:hidden items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        <button
          onClick={handleLowStockToggle}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2"
          style={{
            backgroundColor: lowStockOnly ? '#9b2626' : 'white',
            color: lowStockOnly ? 'white' : '#18160f',
            borderColor: lowStockOnly ? '#9b2626' : '#dedad0',
          }}
        >
          {t.lowStock}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: lowStockOnly ? 'rgba(255,255,255,0.25)' : '#fde2e2',
              color: lowStockOnly ? 'white' : '#9b2626',
            }}
          >
            {t.itemsCount(lowStockCount)}
          </span>
        </button>
        <button
          onClick={handleDepletingToggle}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2"
          style={{
            backgroundColor: depletingOnly ? '#9a3412' : 'white',
            color: depletingOnly ? 'white' : '#18160f',
            borderColor: depletingOnly ? '#9a3412' : '#dedad0',
          }}
        >
          {t.depletingSoon}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: depletingOnly ? 'rgba(255,255,255,0.25)' : '#fff3e6',
              color: depletingOnly ? 'white' : '#9a3412',
            }}
          >
            {t.itemsCount(depletingParts.length)}
          </span>
        </button>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: '#9b2626' }}
        >
          {t.addPart}
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold border"
          style={{ borderColor: '#dedad0', color: '#18160f' }}
        >
          {t.print}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border print:shadow-none" style={{ borderColor: '#dedad0' }}>
        {isTableLoading ? (
          <div className="p-8 text-center" style={{ color: '#90887a' }}>...</div>
        ) : displayRows.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table dir={isRTL ? 'rtl' : 'ltr'} className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f4' }}>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.serial}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.name}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.location}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.qty}</th>
                  {isDepletingView && (
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.stockHealth}</th>
                  )}
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.salePrice}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.costPrice}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.addedDate}</th>
                  <th className="px-3 py-2 text-start font-semibold print:hidden" style={{ color: '#18160f' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((part) => {
                  const qty = isDepletingView ? part.current_stock : part.quantity
                  return (
                    <tr
                      key={part.part_id}
                      className="border-b hover:bg-[#fdf9f9] cursor-pointer"
                      style={{ borderColor: '#ede9e0' }}
                      onClick={() => openPartModal(part)}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{part.serial_number}</td>
                      <td className="px-3 py-2">{part.part_name}</td>
                      <td className="px-3 py-2">{part.location || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={qty <= 5 ? 'text-red-600 font-medium' : ''}>{qty}</span>
                      </td>
                      {isDepletingView && (
                        <td className="px-3 py-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={stockHealthBadge(part.days_until_depletion)}
                          >
                            {t.depletesIn(parseFloat(part.days_until_depletion))}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2">{parseFloat(part.price).toFixed(2)}</td>
                      <td className="px-3 py-2">{parseFloat(part.cost_price).toFixed(2)}</td>
                      <td className="px-3 py-2">{part.created_at ? new Date(part.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2 print:hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(part) }}
                          className="text-sm font-medium transition-colors"
                          style={{ color: '#9b2626' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {partModalOpen && selectedPart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPartModalOpen(false)}
        >
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold" style={{ color: '#18160f' }}>{selectedPart.part_name}</h3>
                <p className="font-mono text-xs mt-0.5" style={{ color: '#90887a' }}>{selectedPart.serial_number}</p>
              </div>
              <button
                onClick={() => setPartModalOpen(false)}
                style={{ color: '#90887a' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#90887a' }}>{t.partDetails}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <span style={{ color: '#90887a' }}>{t.qty}:</span>
                <span className="font-medium" style={{ color: '#18160f' }}>
                  {selectedPart.current_stock ?? selectedPart.quantity}
                </span>
                <span style={{ color: '#90887a' }}>{t.location}:</span>
                <span style={{ color: '#18160f' }}>{selectedPart.location || '—'}</span>
                <span style={{ color: '#90887a' }}>{t.salePrice}:</span>
                <span style={{ color: '#18160f' }}>{parseFloat(selectedPart.price).toFixed(2)}</span>
                {(user.role === 'admin' || user.role === 'owner') && (
                  <>
                    <span style={{ color: '#90887a' }}>{t.costPrice}:</span>
                    <span style={{ color: '#18160f' }}>{parseFloat(selectedPart.cost_price).toFixed(2)}</span>
                  </>
                )}
              </div>
            </div>

            <div
              className="h-px mb-5"
              style={{ backgroundColor: '#ede9e0' }}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#90887a' }}>{t.salesHistory}</p>

              <div className="flex gap-2 items-end flex-wrap mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#90887a' }}>{t.from}</label>
                  <input
                    type="date"
                    value={salesFrom}
                    onChange={(e) => setSalesFrom(e.target.value)}
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
                    value={salesTo}
                    onChange={(e) => setSalesTo(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <button
                  onClick={() => fetchPartSales(selectedPart.part_id ?? selectedPart.id, salesFrom, salesTo)}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: '#9b2626' }}
                >
                  {t.apply}
                </button>
              </div>

              {salesLoading ? (
                <div className="py-6 text-center" style={{ color: '#90887a' }}>...</div>
              ) : !salesHistory ? (
                <div className="py-6 text-center text-sm" style={{ color: '#90887a' }}>{t.noSalesInPeriod}</div>
              ) : salesHistory.net_sold === 0 && salesHistory.total_sold === 0 ? (
                <div className="py-6 text-center text-sm" style={{ color: '#90887a' }}>{t.noSalesInPeriod}</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#eff6ff' }}>
                    <div className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>{salesHistory.total_sold}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#3b82f6' }}>{t.totalSold}</div>
                    <div className="text-xs" style={{ color: '#93c5fd' }}>{t.units}</div>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#fde2e2' }}>
                    <div className="text-2xl font-bold" style={{ color: '#9b2626' }}>{salesHistory.total_returned}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9b2626' }}>{t.totalReturned}</div>
                    <div className="text-xs" style={{ color: '#fca5a5' }}>{t.units}</div>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#e6f9e6' }}>
                    <div className="text-2xl font-bold" style={{ color: '#166534' }}>{salesHistory.net_sold}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#166534' }}>{t.netSold}</div>
                    <div className="text-xs" style={{ color: '#86efac' }}>{t.units}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#18160f' }}>
              {editingId ? t.editTitle : t.addTitle}
            </h3>

            <div className="space-y-3">
              {[
                { key: 'serial_number', label: t.serial, type: 'text' },
                { key: 'part_name', label: t.name, type: 'text' },
                { key: 'location', label: t.location, type: 'text' },
                { key: 'quantity', label: t.qty, type: 'number' },
                { key: 'price', label: t.salePrice, type: 'number' },
                { key: 'cost_price', label: t.costPrice, type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.addedBy}</label>
                <input
                  value={user.name}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                  style={{ border: '1.5px solid #d8d4c8' }}
                />
              </div>
            </div>

            {message.text && (
              <div
                className={`mt-3 text-sm text-center py-2 px-3 rounded-lg border ${
                  message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#9b2626' }}
              >
                {saving ? t.saving : t.save}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: '#dedad0', color: '#18160f' }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Inventory
