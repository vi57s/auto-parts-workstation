import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../utils/lang'

const texts = {
  ar: {
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    login: 'تسجيل الدخول',
    loading: 'جاري تسجيل الدخول...',
    emptyFields: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    wrongCreds: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    serverError: 'تعذّر الاتصال بالخادم',
    footer: 'إنشاء الحسابات من صلاحيات المدير فقط',
    langToggle: 'English',
    forgotTitle: 'نسيت كلمة المرور؟',
    forgotMessage: 'تواصل مع مدير النظام لإعادة تعيين كلمة المرور.',
    close: 'إغلاق',
  },
  en: {
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgot: 'Forgot password?',
    login: 'Login',
    loading: 'Logging in...',
    emptyFields: 'Please enter your email and password',
    wrongCreds: 'Invalid email or password',
    serverError: 'Could not connect to server',
    footer: 'Account creation is restricted to administrators only',
    langToggle: 'عربي',
    forgotTitle: 'Forgot Password?',
    forgotMessage: 'Please contact your system administrator to reset your password.',
    close: 'Close',
  },
}

function Login() {
  const navigate = useNavigate()
  const { lang, setLang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  const t = texts[lang]
  const isRTL = lang === 'ar'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async () => {
    setError('')

    if (!email.trim() || !password.trim()) {
      setError(t.emptyFields)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          setError(t.wrongCreds)
        } else {
          setError(data.message || t.serverError)
        }
        setIsLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ name: data.name, role: data.role }))
      navigate('/dashboard')
    } catch {
      setError(t.serverError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#eeecea' }}>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-[450ms] ease-out"
        style={{
          borderColor: '#dedad0',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <div
          className="h-[3px]"
          style={{ background: 'linear-gradient(to right, transparent, #9b2626, transparent)' }}
        />

        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#18160f' }}>
              AL-HAKIMI
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9b2626' }}>
              AUTO SPARE PARTS
            </p>
          </div>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1 rounded-full text-sm border transition-colors"
            style={{ borderColor: '#d8d4c8', backgroundColor: '#f0ede6', color: '#90887a' }}
            onMouseEnter={(e) => (e.target.style.color = '#9b2626')}
            onMouseLeave={(e) => (e.target.style.color = '#90887a')}
          >
            {t.langToggle}
          </button>
        </div>

        <div className="px-8 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#18160f' }}>
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.emailPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#9b2626'
                e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d8d4c8'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#18160f' }}>
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1.5px solid #d8d4c8',
                  backgroundColor: '#f9f8f4',
                  paddingRight: isRTL ? '1rem' : '2.75rem',
                  paddingLeft: isRTL ? '2.75rem' : '1rem',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9b2626'
                  e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d8d4c8'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ [isRTL ? 'left' : 'right']: '12px', color: '#90887a' }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={isRTL ? 'text-right' : 'text-left'}>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-medium transition-colors"
              style={{ color: '#9b2626' }}
            >
              {t.forgot}
            </button>
          </div>

          {error && (
            <div className="text-sm text-center py-2 px-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-70"
            style={{ backgroundColor: '#9b2626' }}
          >
            {isLoading ? t.loading : t.login}
          </button>
        </div>

        <div className="px-8 py-4 text-center text-xs border-t" style={{ borderColor: '#dedad0', color: '#90887a' }}>
          {t.footer}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9b2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#18160f' }}>
              {t.forgotTitle}
            </h3>
            <p className="text-sm mb-5" style={{ color: '#90887a' }}>
              {t.forgotMessage}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: '#9b2626' }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
