import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'returns_draft'

const defaultDraft = {
  invoiceId: '',
  order: null,
  returnedMap: {},
  selected: {},
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

const ReturnsContext = createContext()

export function ReturnsProvider({ children }) {
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
    <ReturnsContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </ReturnsContext.Provider>
  )
}

export function useReturnsDraft() {
  return useContext(ReturnsContext)
}
