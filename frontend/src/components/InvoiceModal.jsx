import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    invoiceDetails: 'تفاصيل الفاتورة',
    invoice: 'فاتورة',
    seller: 'البائع',
    customer: 'العميل',
    partName: 'اسم القطعة',
    serial: 'الرقم التسلسلي',
    qtySold: 'الكمية المباعة',
    qtyReturned: 'الكمية المرتجعة',
    unitPrice: 'سعر الوحدة',
    discount: 'الخصم',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة (15%)',
    totalReturns: 'إجمالي المرتجعات',
    netTotal: 'الصافي',
    noDiscount: '—',
    close: 'إغلاق',
    cash: 'نقدي',
    credit: 'آجل',
    loading: 'جاري التحميل...',
    returnRecords: 'سجل الإرجاع',
    returnNum: 'رقم الإرجاع',
    approvedBy: 'معتمد المرتجع',
    qty: 'الكمية',
    date: 'التاريخ',
  },
  en: {
    invoiceDetails: 'Invoice Details',
    invoice: 'Invoice',
    seller: 'Seller',
    customer: 'Customer',
    partName: 'Part Name',
    serial: 'Serial',
    qtySold: 'Qty Sold',
    qtyReturned: 'Qty Returned',
    unitPrice: 'Unit Price',
    discount: 'Discount',
    subtotal: 'Subtotal',
    tax: 'Tax (15%)',
    totalReturns: 'Total Returns',
    netTotal: 'Net Total',
    noDiscount: '—',
    close: 'Close',
    cash: 'Cash',
    credit: 'Credit',
    loading: 'Loading...',
    returnRecords: 'Return Records',
    returnNum: 'Return #',
    approvedBy: 'Approved By',
    qty: 'Qty',
    date: 'Date',
  },
}

function InvoiceModal({ orderId, onClose, lang }) {
  const t = texts[lang] || texts.en
  const isRTL = lang === 'ar'
  const [invoice, setInvoice] = useState(null)
  const [returnsMeta, setReturnsMeta] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    setInvoice(null)
    setReturnsMeta([])
    Promise.all([
      apiFetch(`/orders/${orderId}/details`).catch(() => null),
      apiFetch(`/orders/${orderId}/returns-meta`).catch(() => []),
    ])
      .then(([details, meta]) => {
        setInvoice(details)
        setReturnsMeta(Array.isArray(meta) ? meta : [])
      })
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) return null

  const items = invoice?.items || []
  const rawSubtotal = items.reduce((s, i) => s + parseFloat(i.unit_price) * parseInt(i.quantity_sold, 10) * (1 - parseFloat(i.discount || 0) / 100), 0)
  const taxAmount = parseFloat(invoice?.tax || 0)
  const totalPaid = rawSubtotal + taxAmount
  const taxRate = rawSubtotal > 0 ? taxAmount / rawSubtotal : 0
  const totalReturns = items.reduce((s, i) => {
    const effectiveUnitPrice = parseFloat(i.unit_price) * (1 - parseFloat(i.discount || 0) / 100)
    const itemRefund = parseInt(i.quantity_returned || 0, 10) * effectiveUnitPrice * (1 + taxRate)
    return s + itemRefund
  }, 0)
  const isFullyReturned = items.length > 0 && items.every(item => parseInt(item.quantity_returned || 0, 10) >= parseInt(item.quantity_sold, 10))
  const netTotal = isFullyReturned ? 0 : totalPaid - totalReturns

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: '#18160f' }}>{t.invoiceDetails}</h3>
          <button onClick={onClose} style={{ color: '#90887a' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: '#90887a' }}>{t.loading}</div>
        ) : !invoice ? null : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: '#ede9e0' }}>
              <span className="font-semibold text-sm" style={{ color: '#18160f' }}>
                {t.invoice} {invoice.invoice_number || invoice.order_id}
              </span>
              <span className="text-sm" style={{ color: '#90887a' }}>
                {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '—'}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: invoice.invoice_type === 'cash' ? '#e6f9e6' : '#fff3e6',
                  color: invoice.invoice_type === 'cash' ? '#166534' : '#9a3412',
                }}
              >
                {invoice.invoice_type === 'cash' ? t.cash : t.credit}
              </span>
              {invoice.seller_name && (
                <span className="text-xs" style={{ color: '#90887a' }}>
                  {t.seller}: <span style={{ color: '#18160f' }}>{invoice.seller_name}</span>
                </span>
              )}
              {invoice.customer_name && (
                <span className="text-xs" style={{ color: '#90887a' }}>
                  {t.customer}: <span style={{ color: '#18160f' }}>{invoice.customer_name}</span>
                </span>
              )}
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f4' }}>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.partName}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.serial}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.qtySold}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.qtyReturned}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.unitPrice}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.discount}</th>
                    <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.subtotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const itemSubtotal = parseFloat(item.unit_price) * parseInt(item.quantity_sold, 10) * (1 - parseFloat(item.discount || 0) / 100)
                    const qtyRet = parseInt(item.quantity_returned || 0, 10)
                    return (
                      <tr key={i} className="border-b" style={{ borderColor: '#ede9e0' }}>
                        <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{item.part_name}</td>
                        <td className="px-2 py-1.5 border font-mono" style={{ borderColor: '#ede9e0' }}>{item.serial_number}</td>
                        <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{item.quantity_sold}</td>
                        <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0', color: qtyRet > 0 ? '#9b2626' : undefined }}>
                          {qtyRet > 0 ? qtyRet : '—'}
                        </td>
                        <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0', color: parseFloat(item.discount || 0) > 0 ? '#9a3412' : undefined }}>
                          {parseFloat(item.discount || 0) > 0 ? `${parseFloat(item.discount || 0)}%` : t.noDiscount}
                        </td>
                        <td className="px-2 py-1.5 border font-medium" style={{ borderColor: '#ede9e0' }}>{itemSubtotal.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 text-sm pt-3 border-t" style={{ borderColor: '#ede9e0' }}>
              <div className="flex justify-between">
                <span style={{ color: '#90887a' }}>{t.subtotal}</span>
                <span style={{ color: '#18160f' }}>{rawSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#90887a' }}>{t.tax}</span>
                <span style={{ color: '#18160f' }}>{taxAmount.toFixed(2)}</span>
              </div>
              {totalReturns > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: '#9b2626' }}>{t.totalReturns}</span>
                  <span style={{ color: '#9b2626' }}>- {totalReturns.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t" style={{ borderColor: '#ede9e0' }}>
                <span style={{ color: '#18160f' }}>{t.netTotal}</span>
                <span style={{ color: '#166534' }}>{netTotal.toFixed(2)}</span>
              </div>
            </div>

            {returnsMeta.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#ede9e0' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#18160f' }}>{t.returnRecords}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: '#f9f8f4' }}>
                        <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.returnNum}</th>
                        <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.qty}</th>
                        <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.approvedBy}</th>
                        <th className="px-2 py-1.5 text-start border font-semibold" style={{ borderColor: '#ede9e0', color: '#18160f' }}>{t.date}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnsMeta.map((ret, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: '#ede9e0' }}>
                          <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{ret.return_id}</td>
                          <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0', color: '#9b2626' }}>{ret.total_quantity}</td>
                          <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{ret.approver_name || '—'}</td>
                          <td className="px-2 py-1.5 border" style={{ borderColor: '#ede9e0' }}>{ret.return_date ? new Date(ret.return_date).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: '#9b2626' }}
            >
              {t.close}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default InvoiceModal
