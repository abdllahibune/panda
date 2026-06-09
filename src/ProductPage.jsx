import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './ProductPage.css'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => { setProduct(data); setLoading(false) })
  }, [id])

  if (loading) return <div className="pp-loading">جاري التحميل...</div>
  if (!product) return <div className="pp-loading">المنتج غير موجود</div>

  return (
    <div className="pp-page">
      <header className="g-header">
        <div className="g-header-inner">
          <div className="g-logo" onClick={() => navigate('/')}>باندا</div>
          <button className="g-back" onClick={() => navigate(-1)}>رجوع</button>
        </div>
      </header>

      <div className="pp-body">
        <div className="pp-img">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} />
            : '🛍'
          }
        </div>

        <div className="pp-info">
          <span className="pp-badge">{product.category || 'عام'}</span>
          <h1 className="pp-name">{product.name}</h1>
          <div>
            <div className="pp-price">{product.price_mqr} <span>أوقية</span></div>
            <div className="pp-note">شامل الشحن والجمارك</div>
          </div>
          {product.description && <p className="pp-desc">{product.description}</p>}
          <div className="pp-features">
            <div className="pp-feature">التوصيل خلال 3-5 أسابيع</div>
            <div className="pp-feature">الدفع مقدم بالأوقية</div>
            <div className="pp-feature">شحن أسبوعي منتظم</div>
          </div>
          <button className="pp-btn" onClick={() => navigate(`/checkout/${product.id}`)}>
            اطلب الآن
          </button>
        </div>
      </div>
    </div>
  )
}