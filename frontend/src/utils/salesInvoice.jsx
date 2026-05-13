import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'sales_invoice_draft'

const defaultDraft = {
  items: [],
  invoiceType: 'cash',
  customerName: '',
  customerType: 'individual',
  customerContact: '',
  customerAddress: '',
  customerId: null,
  customerSearch: '',
  taxRate: 15,
}

function readInitial() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultDraft
    const parsed = JSON.parse(stored)
    return { ...defaultDraft, ...parsed }
  } catch {
    return defaultDraft
  }
}

const SalesInvoiceContext = createContext()

export function SalesInvoiceProvider({ children }) {
  const [draft, setDraft] = useState(readInitial)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* ignore */
    }
  }, [draft])

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }))
  }, [])

  const resetDraft = useCallback(() => {
    setDraft(defaultDraft)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <SalesInvoiceContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </SalesInvoiceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSalesInvoiceDraft() {
  return useContext(SalesInvoiceContext)
}
