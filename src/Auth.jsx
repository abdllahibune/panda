import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './Auth.css'

function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    if (!form.email || !form.password) return setMessage('يرجى ملء جميع الحقول')
    setLoading(true)
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })
      if (error) setMessage('خطأ في البريد أو كلمة السر')
      else navigate('/')
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      })
      if (error) setMessage('خطأ في إنشاء الحساب')
      else setMessage('✅ تم إنشاء الحساب — تحقق من بريدك للتفعيل')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-box">
        <div className="auth-logo">🐼 باندا</div>
        <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>

        <input
          placeholder="البريد الإلكتروني"
          type="email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
        />
        <input
          placeholder="كلمة السر"
          type="password"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {message && <p className={`auth-message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'جاري التحميل...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب؟'}
          <span onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
            {mode === 'login' ? ' سجل الآن' : ' سجل دخول'}
          </span>
        </p>

        <button className="skip-btn" onClick={() => navigate('/')}>تصفح بدون حساب</button>
      </div>
    </div>
  )
}

export default Auth