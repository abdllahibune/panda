import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './TrackOrder.css'

function TrackOrder() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const steps = ['pending', 'ordered', 'shipping', 'delivered']
  const stepLabels = { pending: 'مدفوع', ordered: 'تم الطلب', shipping: 'في الطريق', delivered: 'تم الاستلام' }
  const stepIcons = { pending: '💰', ordered: '🛍️', shipping: '🚚', delivered: '✅' }

  async function searchOrders() {
    if (!phone) return alert('أدخل رقم هاتفك')
    setLoading(true)
    const { data } = await supabase.from('orders').select('*').eq('customer_phone', phone).order('created_at', { ascending: false })
    setOrders(data || [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="track-page" dir="rtl">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>🐼 باندا</div>
          <button className="back-btn" onClick={() => navigate('/')}>→ العودة</button>
        </div>
      </header>

      <div className="track-container">
        <h1>تتبع طلبك 📦</h1>
        <p>أدخل رقم هاتفك لمعرفة حالة طلباتك</p>

        <div className="search-box">
          <input
            placeholder="أدخل رقم هاتفك"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchOrders()}
          />
          <button onClick={searchOrders}>{loading ? '...' : 'بحث'}</button>
        </div>

        {searched && orders.length === 0 && (
          <div className="no-orders">لا توجد طلبات بهذا الرقم</div>
        )}

        {orders.map(order => (
          <div className="order-track-card" key={order.id}>
            <div className="order-track-header">
              <span>#{order.id.slice(0,8).toUpperCase()}</span>
              <span>{new Date(order.created_at).toLocaleDateString('ar')}</span>
            </div>
            <p className="order-track-name">{order.product_name}</p>
            <p className="order-track-price">{order.total_price} أوقية</p>

            <div className="progress-bar">
              {steps.map((step, i) => {
                const currentIndex = steps.indexOf(order.status)
                const isActive = i <= currentIndex
                return (
                  <div key={step} className={`progress-step ${isActive ? 'active' : ''}`}>
                    <div className="step-circle">{isActive ? stepIcons[step] : '○'}</div>
                    <span>{stepLabels[step]}</span>
                    {i < steps.length - 1 && <div className={`step-line ${i < currentIndex ? 'done' : ''}`} />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrackOrder