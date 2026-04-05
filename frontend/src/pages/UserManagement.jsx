import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useLang } from '../utils/lang'
import { apiFetch } from '../utils/api'

const texts = {
  ar: {
    addUser: 'إضافة مستخدم',
    username: 'اسم المستخدم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    newPassword: 'كلمة المرور الجديدة',
    role: 'الصلاحية',
    admin: 'مدير',
    worker: 'موظف',
    createdAt: 'تاريخ الإنشاء',
    actions: 'إجراءات',
    resetPassword: 'إعادة تعيين كلمة المرور',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    addTitle: 'إضافة مستخدم جديد',
    resetTitle: 'إعادة تعيين كلمة المرور',
    noData: 'لا يوجد مستخدمون',
    mismatch: 'كلمتا المرور غير متطابقتين',
    required: 'يرجى ملء جميع الحقول',
    error: 'حدث خطأ',
    name: 'الاسم',
  },
  en: {
    addUser: 'Add User',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    newPassword: 'New Password',
    role: 'Role',
    admin: 'Admin',
    worker: 'Worker',
    createdAt: 'Created At',
    actions: 'Actions',
    resetPassword: 'Reset Password',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    addTitle: 'Add New User',
    resetTitle: 'Reset Password',
    noData: 'No users found',
    mismatch: 'Passwords do not match',
    required: 'Please fill all fields',
    error: 'An error occurred',
    name: 'Name',
  },
}

function UserManagement() {
  const { lang } = useLang()
  const t = texts[lang]

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'worker' })
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' })

  const inputStyle = { border: '1.5px solid #d8d4c8', backgroundColor: '#f9f8f4' }
  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#9b2626'
    e.target.style.boxShadow = '0 0 0 3px rgba(155,38,38,0.1)'
  }
  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d8d4c8'
    e.target.style.boxShadow = 'none'
  }

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/users')
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      setMessage({ text: t.required, type: 'error' })
      return
    }

    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(addForm),
      })
      setShowAddModal(false)
      setAddForm({ name: '', email: '', password: '', role: 'worker' })
      fetchUsers()
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetForm.password || !resetForm.confirmPassword) {
      setMessage({ text: t.required, type: 'error' })
      return
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setMessage({ text: t.mismatch, type: 'error' })
      return
    }

    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      await apiFetch(`/users/${resetUserId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: resetForm.password }),
      })
      setShowResetModal(false)
      setResetForm({ password: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ text: err.message || t.error, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const openResetModal = (userId) => {
    setResetUserId(userId)
    setResetForm({ password: '', confirmPassword: '' })
    setMessage({ text: '', type: '' })
    setShowResetModal(true)
  }

  return (
    <Layout titleKey="users">
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => {
            setMessage({ text: '', type: '' })
            setShowAddModal(true)
          }}
          className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: '#9b2626' }}
        >
          {t.addUser}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border" style={{ borderColor: '#dedad0' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: '#90887a' }}>...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#90887a' }}>{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f4' }}>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.name}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.email}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.role}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.createdAt}</th>
                  <th className="px-4 py-3 text-start font-semibold" style={{ color: '#18160f' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b hover:bg-[#fdf9f9]" style={{ borderColor: '#ede9e0' }}>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: u.role === 'admin' ? 'rgba(155,38,38,0.1)' : '#e6f9e6',
                          color: u.role === 'admin' ? '#9b2626' : '#166534',
                        }}
                      >
                        {u.role === 'admin' ? t.admin : t.worker}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openResetModal(u.user_id)}
                        className="text-sm font-medium transition-colors"
                        style={{ color: '#9b2626' }}
                      >
                        {t.resetPassword}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#18160f' }}>{t.addTitle}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.name}</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.email}</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.password}</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.role}</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                >
                  <option value="worker">{t.worker}</option>
                  <option value="admin">{t.admin}</option>
                </select>
              </div>
            </div>

            {message.text && (
              <div className={`mt-3 text-sm text-center py-2 px-3 rounded-lg border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddUser}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#9b2626' }}
              >
                {saving ? t.saving : t.save}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: '#dedad0', color: '#18160f' }}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#18160f' }}>{t.resetTitle}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.newPassword}</label>
                <input
                  type="password"
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#18160f' }}>{t.confirmPassword}</label>
                <input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            {message.text && (
              <div className={`mt-3 text-sm text-center py-2 px-3 rounded-lg border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleResetPassword}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#9b2626' }}
              >
                {saving ? t.saving : t.save}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
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

export default UserManagement
