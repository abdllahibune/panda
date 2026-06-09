import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './Checkout.css'

export default function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '' })
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => setProduct(data))
  }, [id])

  async function submit() {
    if (!form.customer_name || !form.customer_phone || !form.customer_address)
      return alert('يرجى ملء جميع الحقول')
    if (!proof) return alert('يرجى رفع إثبات الدفع')

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: up, error: ue } = await supabase.storage
      .from('payment-proofs').upload(`${Date.now()}_proof`, proof)

    if (ue) { setLoading(false); return alert('خطأ في رفع الصورة') }

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user?.id || null,
      ...form,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      total_price: product.price_mqr,
      payment_proof: up.path,
      status: 'pending'
    }).select().single()

    setLoading(false)
    if (!error) { setOrderId(order.id.slice(0, 8).toUpperCase()); setSuccess(true) }
    else alert('حدث خطأ، حاول مجدداً')
  }

  if (success) return (
    <div className="co-success">
      <div className="co-success-box">
        <div className="co-success-icon">✅</div>
        <h2>تم استلام طلبك</h2>
        <p>رقم الطلب: <strong>#{orderId}</strong></p>
        <p>سنتواصل معك قريباً</p>
        <button onClick={() => navigate('/track')}>تتبع طلبي</button>
        <button className="co-btn-sec" onClick={() => navigate('/')}>العودة للرئيسية</button>
      </div>
    </div>
  )

  if (!product) return <div className="co-loading">جاري التحميل...</div>

  return (
    <div className="co-page">
      <header className="g-header">
        <div className="g-header-inner">
          <div className="g-logo" onClick={() => navigate('/')}>باندا</div>
          <button className="g-back" onClick={() => navigate(-1)}>رجوع</button>
        </div>
      </header>

      <div className="co-body">
        <div className="co-form">
          <h2>تفاصيل التوصيل</h2>

          <label className="co-label">الاسم الكامل
            <input className="co-input" placeholder="أدخل اسمك الكامل"
              value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
          </label>

          <label className="co-label">رقم الهاتف
            <input className="co-input" placeholder="أدخل رقم هاتفك"
              value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
          </label>

          <label className="co-label">عنوان التسليم
            <input className="co-input" placeholder="المدينة، الحي، التفاصيل"
              value={form.customer_address} onChange={e => setForm({...form, customer_address: e.target.value})} />
          </label>

          <div className="co-pay">
            <h3>طريقة الدفع</h3>
            <div className="co-method">Bankily: <strong>22221234</strong></div>
            <div className="co-method">Masrifi: <strong>22221234</strong></div>
            <p className="co-note">ادفع المبلغ ثم ارفع صورة إثبات الدفع</p>
            <label className="co-upload">
              ارفع إثبات الدفع
              <input type="file" accept="image/*" onChange={e => setProof(e.target.files[0])} />
            </label>
            {proof && <p className="co-filename">✓ {proof.name}</p>}
          </div>
        </div>

        <div className="co-summary">
          <h2>ملخص الطلب</h2>
          <div className="co-prod">
            {product.image_url && <img src={product.image_url} alt={product.name} />}
            <div className="co-prod-info">
              <p>{product.name}</p>
              <span>{product.price_mqr} أوقية</span>
            </div>
          </div>
          <div className="co-row"><span>سعر المنتج</span><span>{product.price_mqr} أوقية</span></div>
          <div className="co-total"><span>الإجمالي</span><span>{product.price_mqr} أوقية</span></div>
          <button className="co-btn" onClick={submit} disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
          </button>
        </div>
      </div>
    </div>
  )
}