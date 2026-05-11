import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    searchPlaceholder: 'بحث بالاسم أو الرقم التسلسلي...',
    addPart: 'إضافة قطعة',
    lowStock: 'المخزون المنخفض',
    itemsCount: (n) => `${n} منتجات`,
    serial: 'الرقم التسلسلي',
    name: 'الاسم',
    location: 'الموقع',
    qty: 'الكمية',
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
  },
  en: {
    searchPlaceholder: 'Search by name or serial...',
    addPart: 'Add Part',
    lowStock: 'Low Stock',
    itemsCount: (n) => `${n} items`,
    serial: 'Serial',
    name: 'Name',
    location: 'Location',
    qty: 'Qty',
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
  },
}

const emptyForm = { serial_number: '', part_name: '', location: '', quantity: '', price: '', cost_price: '' }

function Inventory() {
  const { lang } = useLang()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [parts, setParts] = useState([])
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  const lowStockCount = parts.filter((p) => (p.quantity || 0) <= 10).length

  const filtered = parts.filter((p) => {
    if (lowStockOnly && (p.quantity || 0) > 10) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.part_name.toLowerCase().includes(q) || p.serial_number.toLowerCase().includes(q)
  })

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
      quantity: part.quantity,
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
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

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
          onClick={() => setLowStockOnly((v) => !v)}
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
        {loading ? (
          <div className="p-8 text-center" style={{ color: '#90887a' }}>...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f4' }}>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.serial}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.name}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.location}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.qty}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.salePrice}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.costPrice}</th>
                  <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.addedDate}</th>
                  <th className="px-3 py-2 text-start font-semibold print:hidden" style={{ color: '#18160f' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((part) => (
                  <tr key={part.part_id} className="border-b hover:bg-[#fdf9f9]" style={{ borderColor: '#ede9e0' }}>
                    <td className="px-3 py-2 font-mono text-xs">{part.serial_number}</td>
                    <td className="px-3 py-2">{part.part_name}</td>
                    <td className="px-3 py-2">{part.location || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={part.quantity <= 5 ? 'text-red-600 font-medium' : ''}>{part.quantity}</span>
                    </td>
                    <td className="px-3 py-2">{parseFloat(part.price).toFixed(2)}</td>
                    <td className="px-3 py-2">{parseFloat(part.cost_price).toFixed(2)}</td>
                    <td className="px-3 py-2">{part.created_at ? new Date(part.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 print:hidden">
                      <button
                        onClick={() => openEdit(part)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
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
