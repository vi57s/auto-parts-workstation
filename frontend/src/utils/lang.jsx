import { createContext, useContext, useState, useCallback } from 'react'

const LangContext = createContext()

const STORAGE_KEY = 'lang'

function readInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  return 'ar'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LangContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext)
}
