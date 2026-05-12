import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'
import { useSalesInvoiceDraft } from '../utils/salesInvoice'

const texts = {
  ar: {
    searchSerial: 'رقم القطعة',
    searchPlaceholder: 'أدخل الرقم التسلسلي',
    search: 'بحث',
    partName: 'اسم القطعة',
    location: 'الموقع',
    stock: 'المخزون',
    salePrice: 'سعر البيع',
    costPrice: 'سعر التكلفة',
    addToInvoice: 'إضافة للفاتورة',
    items: 'الأصناف',
    num: '#',
    serial: 'الرقم التسلسلي',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة',
    discount: 'الخصم %',
    total: 'الإجمالي',
    actions: 'إجراءات',
    invoiceType: 'نوع الفاتورة',
    cash: 'نقدي',
    credit: 'آجل',
    customerName: 'اسم العميل',
    customerType: 'نوع العميل',
    individual: 'فرد',
    store: 'محل',
    contact: 'رقم التواصل',
    searchCustomer: 'بحث عن عميل...',
    summary: 'ملخص الفاتورة',
    subtotal: 'المجموع الفرعي',
    taxRate: 'نسبة الضريبة %',
    totalWithTax: 'الإجمالي شامل الضريبة',
    seller: 'البائع',
    invoiceNum: 'رقم الفاتورة',
    submit: 'إصدار الفاتورة',
    submitting: 'جاري الإصدار...',
    notFound: 'القطعة غير موجودة',
    belowCost: 'السعر بعد الخصم أقل من سعر التكلفة',
    noItems: 'لا توجد أصناف في الفاتورة',
    success: 'تم إصدار الفاتورة بنجاح',
    error: 'حدث خطأ',
    address: 'العنوان',
    newInvoice: 'فاتورة جديدة',
    customerNameRequired: 'يرجى إدخال اسم العميل',
    customerCreateFailed: 'تعذّر إنشاء بيانات العميل',
  },
  en: {
    searchSerial: 'Part Number',
    searchPlaceholder: 'Enter serial number',
    search: 'Search',
    partName: 'Part Name',
    location: 'Location',
    stock: 'Stock',
    salePrice: 'Sale Price',
    costPrice: 'Cost Price',
    addToInvoice: 'Add to Invoice',
    items: 'Items',
    num: '#',
    serial: 'Serial',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    discount: 'Discount %',
    total: 'Total',
    actions: 'Actions',
    invoiceType: 'Invoice Type',
    cash: 'Cash',
    credit: 'Credit',
    customerName: 'Customer Name',
    customerType: 'Customer Type',
    individual: 'Individual',
    store: 'Store',
    contact: 'Contact',
    searchCustomer: 'Search customer...',
    summary: 'Invoice Summary',
    subtotal: 'Subtotal',
    taxRate: 'Tax Rate %',
    totalWithTax: 'Total with Tax',
    seller: 'Seller',
    invoiceNum: 'Invoice #',
    submit: 'Submit Invoice',
    submitting: 'Submitting...',
    notFound: 'Part not found',
    belowCost: 'Price after discount is below cost price',
    noItems: 'No items in invoice',
    success: 'Invoice created successfully',
    error: 'An error occurred',
    address: 'Address',
    newInvoice: 'New Invoice',
    customerNameRequired: 'Customer name is required',
    customerCreateFailed: 'Failed to create customer record',
  },
}

function SalesInvoice() {
  const { lang } = useLang()
  const t = texts[lang]
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const { draft, updateDraft, resetDraft } = useSalesInvoiceDraft()
  const {
    items,
    invoiceType,
    customerName,
    customerType,
    customerContact,
    customerAddress,
    customerId,
    customerSearch,
    taxRate,
  } = draft

  const [serial, setSerial] = useState('')
  const [foundPart, setFoundPart] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [invoiceNumber, setInvoiceNumber] = useState(null)

  useEffect(() => {
    apiFetch('/orders/next-invoice-number').then(d => {
      if (d?.invoice_number) setInvoiceNumber(d.invoice_number)
    }).catch(() => {})
  }, [])

  const handleSearch = async () => {
    if (!serial.trim()) return
    setSearchError('')
    setFoundPart(null)
    try {
      const data = await apiFetch(`/parts/search/${serial.trim()}`)
      setFoundPart(data)
    } catch {
      setSearchError(t.notFound)
    }
  }

  const handleAddItem = () => {
    if (!foundPart) return
    const exists = items.find((it) => it.part_id === foundPart.part_id)
    if (exists) return
    const newItem = {
      part_id: foundPart.part_id,
      part_name: foundPart.part_name,
      serial_number: foundPart.serial_number,
      unit_price: parseFloat(foundPart.price),
      cost_price: parseFloat(foundPart.cost_price),
      max_qty: foundPart.quantity,
      quantity: 1,
      discount_percentage: 0,
      error: '',
    }
    updateDraft({ items: [...items, newItem] })
    setFoundPart(null)
    setSerial('')
  }

  const updateItem = (index, field, value) => {
    updateDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        const finalPrice = updated.unit_price * (1 - updated.discount_percentage / 100)
        updated.error = finalPrice < updated.cost_price ? t.belowCost : ''
        return updated
      }),
    }))
  }

  const removeItem = (index) => {
    updateDraft((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const subtotal = items.reduce((sum, it) => {
    const lineTotal = it.quantity * it.unit_price * (1 - it.discount_percentage / 100)
    return sum + lineTotal
  }, 0)

  const taxAmount = subtotal * (taxRate / 100)
  const totalWithTax = subtotal + taxAmount
  const hasErrors = items.some((it) => it.error)

  const searchCustomers = async (query) => {
    updateDraft({ customerSearch: query, customerName: query, customerId: null })
    if (query.length < 2) {
      setCustomerResults([])
      return
    }
    try {
      const data = await apiFetch('/customers')
      const filtered = data.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      setCustomerResults(filtered)
    } catch {
      setCustomerResults([])
    }
  }

  const selectCustomer = (c) => {
    updateDraft({
      customerId: c.customer_id,
      customerName: c.name,
      customerType: c.customer_type,
      customerContact: c.phone || '',
      customerAddress: c.address || '',
      customerSearch: c.name,
    })
    setCustomerResults([])
  }

  const ensureCustomerId = async () => {
    if (customerId) return customerId

    try {
      const customers = await apiFetch('/customers')
      const match = customers.find(
        (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
      )
      if (match) {
        updateDraft({ customerId: match.customer_id })
        return match.customer_id
      }
    } catch {
      /* fall through to creation */
    }

    const created = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customerName.trim(),
        phone: customerContact || null,
        address: customerAddress || null,
        customer_type: customerType,
      }),
    })
    updateDraft({ customerId: created.customer_id })
    return created.customer_id
  }

  const handleSubmit = async () => {
    setMessage({ text: '', type: '' })

    if (items.length === 0) {
      setMessage({ text: t.noItems, type: 'error' })
      return
    }

    if (hasErrors) return

    if (invoiceType === 'credit' && !customerName.trim()) {
      setMessage({ text: t.customerNameRequired, type: 'error' })
      return
    }

    setSubmitting(true)

    try {
      let resolvedCustomerId = null
      if (invoiceType === 'credit') {
        try {
          resolvedCustomerId = await ensureCustomerId()
        } catch (err) {
          setMessage({ text: err.message || t.customerCreateFailed, type: 'error' })
          setSubmitting(false)
          return
        }
      }

      let confirmedNum = null
      for (const item of items) {
        const result = await apiFetch('/orders/sell', {
          method: 'POST',
          body: JSON.stringify({
            serial_number: item.serial_number,
            quantity: item.quantity,
            discount: item.discount_percentage,
            invoice_type: invoiceType,
            customer_id: resolvedCustomerId,
            tax_rate: taxRate,
          }),
        })
        if (!confirmedNum && result?.invoice_number) confirmedNum = result.invoice_number
      }

      flushSync(() => {
        if (confirmedNum) setInvoiceNumber(confirmedNum)
        setMessage({ text: t.success, type: 'success' })
      })
      window.print()
      resetDraft()
      setFoundPart(null)
      setSerial('')
      apiFetch('/orders/next-invoice-number').then(d => {
        if (d?.invoice_number) setInvoiceNumber(d.invoice_number)
      }).catch(() => {})
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewInvoice = () => {
    resetDraft()
    setFoundPart(null)
    setSerial('')
    setSearchError('')
    setCustomerResults([])
    setMessage({ text: '', type: '' })
    apiFetch('/orders/next-invoice-number').then(d => {
      if (d?.invoice_number) setInvoiceNumber(d.invoice_number)
    }).catch(() => {})
  }

  const inputStyle = {
    border: '1.5px solid #d8d4c8',
    backgroundColor: '#f9f8f4',
  }

  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }

  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  return (
    <Layout titleKey="sales">
      <div className="print-invoice hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold">AL-HAKIMI AUTO SPARE PARTS</h1>
        <p className="text-sm">{t.invoiceNum}: {invoiceNumber || '—'}</p>
        <p className="text-sm">{new Date().toLocaleString()}</p>
      </div>

      <div className="flex gap-6">
        <div className="w-[60%] space-y-4 print:w-full">
          <div className="bg-white rounded-xl shadow-sm border p-4 print:hidden" style={{ borderColor: '#dedad0' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#18160f' }}>{t.searchSerial}</label>
            <div className="flex gap-2">
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t.searchPlaceholder}
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
                onClick={handleNewInvoice}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: '#dedad0', color: '#18160f' }}
              >
                {t.newInvoice}
              </button>
            </div>
            {searchError && <p className="text-sm text-red-600 mt-2">{searchError}</p>}
            {foundPart && (
              <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: '#ede9e0', backgroundColor: '#f9f8f4' }}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span style={{ color: '#90887a' }}>{t.partName}:</span> <span className="font-medium">{foundPart.part_name}</span></div>
                  <div><span style={{ color: '#90887a' }}>{t.location}:</span> <span className="font-medium">{foundPart.location || '—'}</span></div>
                  <div><span style={{ color: '#90887a' }}>{t.stock}:</span> <span className="font-medium">{foundPart.quantity}</span></div>
                  <div><span style={{ color: '#90887a' }}>{t.salePrice}:</span> <span className="font-medium">{parseFloat(foundPart.price).toFixed(2)}</span></div>
                </div>
                <button
                  onClick={handleAddItem}
                  className="mt-3 px-4 py-1.5 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: '#9b2626' }}
                >
                  {t.addToInvoice}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border print:shadow-none print:border-black" style={{ borderColor: '#dedad0' }}>
            <div className="px-4 py-3 border-b print:hidden" style={{ borderColor: '#ede9e0' }}>
              <h3 className="text-sm font-bold" style={{ color: '#18160f' }}>{t.items}</h3>
            </div>
            <div className="overflow-x-auto">
              <table dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f4' }}>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.num}</th>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.partName}</th>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.serial}</th>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.qty}</th>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.unitPrice}</th>
                    <th className="px-3 py-2 text-start font-semibold print:hidden" style={{ color: '#18160f' }}>{t.discount}</th>
                    <th className="px-3 py-2 text-start font-semibold" style={{ color: '#18160f' }}>{t.total}</th>
                    <th className="px-3 py-2 text-start font-semibold print:hidden" style={{ color: '#18160f' }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percentage / 100)
                    return (
                      <tr key={item.part_id} className="border-b" style={{ borderColor: '#ede9e0' }}>
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{item.part_name}</td>
                        <td className="px-3 py-2">{item.serial_number}</td>
                        <td className="px-3 py-2 print:text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.max_qty}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', Math.min(Math.max(1, parseInt(e.target.value) || 1), item.max_qty))}
                            className="w-16 px-2 py-1 rounded text-sm outline-none print:border-none print:bg-transparent"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                          />
                        </td>
                        <td className="px-3 py-2">{item.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 print:hidden">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percentage}
                            onChange={(e) => updateItem(i, 'discount_percentage', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-16 px-2 py-1 rounded text-sm outline-none"
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                          />
                          {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
                        </td>
                        <td className="px-3 py-2 font-medium">{lineTotal.toFixed(2)}</td>
                        <td className="px-3 py-2 print:hidden">
                          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noItems}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-[40%] space-y-4 print:w-full">
          <div className="bg-white rounded-xl shadow-sm border p-4 print:hidden" style={{ borderColor: '#dedad0' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#18160f' }}>{t.invoiceType}</label>
            <div className="flex gap-2">
              {['cash', 'credit'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateDraft({ invoiceType: type })}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: invoiceType === type ? '#9b2626' : 'white',
                    color: invoiceType === type ? 'white' : '#18160f',
                    border: `1.5px solid ${invoiceType === type ? '#9b2626' : '#dedad0'}`,
                  }}
                >
                  {type === 'cash' ? t.cash : t.credit}
                </button>
              ))}
            </div>

            {invoiceType === 'credit' && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.customerName}</label>
                  <input
                    value={customerSearch}
                    onChange={(e) => searchCustomers(e.target.value)}
                    placeholder={t.searchCustomer}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={(e) => {
                      handleInputBlur(e)
                      setTimeout(() => setCustomerResults([]), 200)
                    }}
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto" style={{ borderColor: '#dedad0' }}>
                      {customerResults.map((c) => (
                        <button
                          key={c.customer_id}
                          onClick={() => selectCustomer(c)}
                          className="w-full px-3 py-2 text-sm text-start hover:bg-gray-50"
                        >
                          {c.name} — {c.phone || ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.customerType}</label>
                  <select
                    value={customerType}
                    onChange={(e) => updateDraft({ customerType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  >
                    <option value="individual">{t.individual}</option>
                    <option value="store">{t.store}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.contact}</label>
                  <input
                    value={customerContact}
                    onChange={(e) => updateDraft({ customerContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.address}</label>
                  <input
                    value={customerAddress}
                    onChange={(e) => updateDraft({ customerAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4 print:shadow-none" style={{ borderColor: '#dedad0' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#18160f' }}>{t.summary}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#90887a' }}>{t.subtotal}</span>
                <span className="font-medium">{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#90887a' }}>{t.taxRate}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => updateDraft({ taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 rounded text-sm text-end outline-none print:border-none print:bg-transparent"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-base" style={{ borderColor: '#ede9e0', color: '#18160f' }}>
                <span>{t.totalWithTax}</span>
                <span>{totalWithTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span style={{ color: '#90887a' }}>{t.seller}</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#90887a' }}>{t.invoiceNum}</span>
                <span className="font-mono text-xs">{invoiceNumber || '—'}</span>
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

            <button
              onClick={handleSubmit}
              disabled={submitting || hasErrors || items.length === 0}
              className="w-full mt-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-50 print:hidden"
              style={{ backgroundColor: '#9b2626' }}
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>

          {invoiceType === 'credit' && customerName && (
            <div className="hidden print:block bg-white p-4 border-t" style={{ borderColor: '#dedad0' }}>
              <p className="font-medium">{t.customerName}: {customerName}</p>
              <p>{t.contact}: {customerContact}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SalesInvoice
