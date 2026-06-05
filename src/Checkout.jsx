import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './Checkout.css'

function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [settings, setSettings] = useState({ shipping_cost: 500 })
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '' })
  const [paymentProof, setPaymentProof] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: p } = await supabase.from('products').select('*').eq('id', id).single()
      const { data: s } = await supabase.from('settings').select('*').eq('id', 1).single()
      setProduct(p)
      if (s) setSettings(s)
    }
    fetchData()
  }, [id])

  async function handleSubmit() {
    if (!form.customer_name || !form.customer_phone || !form.customer_address) {
      return alert('يرجى ملء جميع الحقول')
    }
    if (!paymentProof) return alert('يرجى رفع إثبات الدفع')

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const fileName = `${Date.now()}_proof`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, paymentProof)

    if (uploadError) {
      setLoading(false)
      return alert('خطأ في رفع الصورة، حاول مجدداً')
    }

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user?.id || null,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      total_price: product.price_mqr,
      payment_proof: uploadData.path,
      status: 'pending'
    }).select().single()

    setLoading(false)
    if (!error) {
      setOrderId(order.id.slice(0, 8).toUpperCase())
      setSuccess(true)
    } else {
      alert('حدث خطأ، حاول مجدداً')
    }
  }

  if (success) return (
    <div className="success-page" dir="rtl">
      <div className="success-box">
        <div className="success-icon">✅</div>
        <h2>تم استلام طلبك!</h2>
        <p>رقم الطلب: <strong>#{orderId}</strong></p>
        <p>سنتواصل معك قريباً على الرقم الذي أدخلته</p>
        <button onClick={() => navigate('/track')}>تتبع طلبي 📦</button>
        <button className="home-btn" onClick={() => navigate('/')}>العودة للرئيسية</button>
      </div>
    </div>
  )

  if (!product) return <div className="loading-page">جاري التحميل... 🐼</div>

  return (
    <div className="checkout-page" dir="rtl">
      <header className="header">
        <div className="header-inner">
          <div className="logo">🐼 باندا</div>
          <button className="back-btn" onClick={() => navigate(-1)}>→ العودة</button>
        </div>
      </header>

      <div className="checkout-container">
        <div className="checkout-form">
          <h2>تفاصيل الطلب</h2>

          <label>الاسم الكامل
            <input placeholder="أدخل اسمك الكامل" value={form.customer_name}
              onChange={e => setForm({...form, customer_name: e.target.value})} />
          </label>

          <label>رقم الهاتف
            <input placeholder="أدخل رقم هاتفك" value={form.customer_phone}
              onChange={e => setForm({...form, customer_phone: e.target.value})} />
          </label>

          <label>عنوان التسليم
            <input placeholder="المدينة، الحي، التفاصيل" value={form.customer_address}
              onChange={e => setForm({...form, customer_address: e.target.value})} />
          </label>

          <div className="payment-section">
            <h3>طريقة الدفع</h3>
            <div className="payment-methods">
              <div className="payment-method">💳 Bankily: <strong>22221234</strong></div>
              <div className="payment-method">💳 Masrifi: <strong>22221234</strong></div>
            </div>
            <p className="payment-note">ادفع المبلغ ثم ارفع صورة إثبات الدفع</p>

            <label className="upload-label">
              📎 رفع إثبات الدفع
              <input type="file" accept="image/*" onChange={e => setPaymentProof(e.target.files[0])} />
            </label>
            {paymentProof && <p className="file-name">✅ {paymentProof.name}</p>}
          </div>
        </div>

        <div className="order-summary">
          <h2>ملخص الطلب</h2>
          <div className="summary-product">
            {product.image_url && <img src={product.image_url} alt={product.name} />}
            <div>
              <p>{product.name}</p>
              <span>{product.price_mqr} أوقية</span>
            </div>
          </div>
          <div className="summary-line"><span>سعر المنتج</span><span>{product.price_mqr} أوقية</span></div>
          <div className="summary-line total"><span>الإجمالي</span><span>{product.price_mqr} أوقية</span></div>

          <button className="confirm-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب ✅'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout