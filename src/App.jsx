import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './App.css'

const CATS = [
  { icon: '👗', name: 'ملابس' },
  { icon: '👟', name: 'أحذية' },
  { icon: '📱', name: 'إلكترونيات' },
  { icon: '🏠', name: 'منزل' },
  { icon: '💄', name: 'جمال' },
  { icon: '🧸', name: 'ألعاب' },
  { icon: '⌚', name: 'ساعات' },
  { icon: '🎒', name: 'حقائب' },
  { icon: '🍳', name: 'مطبخ' },
  { icon: '🏋', name: 'رياضة' },
]

export default function App() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(40)
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <header className="g-header">
        <div className="g-header-inner">
          <div className="g-logo" onClick={() => navigate('/')}>باندا</div>
          <div className="g-search">
            <input
              placeholder="ابحث عن أي منتج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button>🔍</button>
          </div>
          <nav className="g-nav">
            <a href="/"><span className="icon">🏠</span>الرئيسية</a>
            <a href="/track"><span className="icon">📦</span>طلباتي</a>
            <a href="/auth"><span className="icon">👤</span>حسابي</a>
          </nav>
        </div>
      </header>

      <div className="hero">
        <h1>تسوق من العالم، استلم في موريتانيا</h1>
        <p>نطلب لك أي منتج وتستلمه في باب بيتك</p>
        <div className="hero-tags">
          <div className="hero-tag">شحن أسبوعي</div>
          <div className="hero-tag">دفع بالأوقية</div>
          <div className="hero-tag">تتبع طلبك</div>
          <div className="hero-tag">دفع مقدم آمن</div>
        </div>
      </div>

      <div className="cats">
        {CATS.map(c => (
          <button className="cat" key={c.name}>
            <div className="cat-icon">{c.icon}</div>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">منتجات مميزة</div>
          <div className="section-more">عرض الكل</div>
        </div>

        {loading ? (
          <div className="state">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="state">لا توجد منتجات بعد</div>
        ) : (
          <div className="grid">
            {filtered.map(p => (
              <div className="card" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
                <div className="card-img">
                  {p.image_url
                    ? <img src={`https://wsrv.nl/?url=${encodeURIComponent(p.image_url)}`} alt={p.name} />
                    : '🛍'
                  }
                </div>
                <div className="card-body">
                  <p className="card-name">{p.name}</p>
                  <p className="card-price">{p.price_mqr} <span>أوقية</span></p>
                  <button className="btn-order"
                    onClick={e => { e.stopPropagation(); navigate(`/product/${p.id}`) }}>
                    اطلب الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="g-bottom-nav">
        <a href="/" className="active"><span className="icon">🏠</span>الرئيسية</a>
        <a href="#"><span className="icon">📂</span>الأقسام</a>
        <a href="/track"><span className="icon">📦</span>طلباتي</a>
        <a href="/auth"><span className="icon">👤</span>حسابي</a>
      </nav>
    </div>
  )
}