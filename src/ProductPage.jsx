import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './ProductPage.css'

function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)
      setLoading(false)
    }
    fetchProduct()
  }, [id])

  if (loading) return <div className="loading-page">جاري التحميل... 🐼</div>
  if (!product) return <div className="loading-page">المنتج غير موجود</div>

  return (
    <div className="product-page" dir="rtl">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>🐼 باندا</div>
          <button className="back-btn" onClick={() => navigate('/')}>→ العودة</button>
        </div>
      </header>

      <div className="product-container">
        <div className="product-image-section">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} />
            : <div className="no-img">🛍️</div>
          }
        </div>

        <div className="product-details">
          <span className="category-badge">{product.category || 'عام'}</span>
          <h1>{product.name}</h1>
          <div className="price-box">
            <span className="price">{product.price_mqr} أوقية</span>
            <span className="price-note">شامل الشحن والجمارك</span>
          </div>
          <p className="description">{product.description || 'منتج عالي الجودة يتم جلبه خصيصاً لك'}</p>

          <div className="info-boxes">
            <div className="info-box">🚚 التوصيل خلال 3-5 أسابيع</div>
            <div className="info-box">💰 الدفع مقدم بالأوقية</div>
            <div className="info-box">📦 شحن أسبوعي منتظم</div>
          </div>

          <button className="order-now-btn" onClick={() => navigate(`/checkout/${product.id}`)}>
            اطلب الآن 🛒
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductPage