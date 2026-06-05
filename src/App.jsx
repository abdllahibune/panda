import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'
import { useNavigate } from 'react-router-dom'

function App() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(12)
    if (!error) setProducts(data)
    setLoading(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="app" dir="rtl">

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">🐼 باندا</div>
          <nav className="nav">
            <a href="#">الرئيسية</a>
            <a href="#">الأقسام</a>
            <a href="#">طلباتي</a>
            <a href="/auth">حسابي</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <h1>تسوّق من العالم،<br />استلم في موريتانيا 🇲🇷</h1>
        <p>نطلب لك أي منتج وتستلمه في باب بيتك</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="ابحث عن ملابس، إلكترونيات، أحذية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button>ابحث الآن</button>
        </div>
        <div className="features">
          <div className="feature">
            <span>🚚</span>
            <strong>شحن أسبوعي منتظم</strong>
            <p>طلباتك تصل كل أسبوع</p>
          </div>
          <div className="feature">
            <span>💰</span>
            <strong>دفع بالأوقية</strong>
            <p>عبر Bankily أو Masrifi</p>
          </div>
          <div className="feature">
            <span>📦</span>
            <strong>تتبع طلبك</strong>
            <p>من الطلب حتى الاستلام</p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories">
        <h2>تسوق حسب القسم</h2>
        <div className="cat-grid">
          {['👗 ملابس نسائية','👟 أحذية','📱 إلكترونيات','🏠 المنزل','💄 جمال وعناية','🧸 ألعاب','⌚ ساعات','🎒 حقائب'].map((cat) => (
            <div className="cat-item" key={cat}>{cat}</div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products">
        <h2>منتجات مميزة</h2>
        {loading ? (
          <div className="loading">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {products.length === 0 ? 'لا توجد منتجات بعد — سيتم إضافتها قريباً 🐼' : 'لا توجد نتائج للبحث'}
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((product) => (
              <div className="product-card" key={product.id}>
                <div className="product-img">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} />
                    : '🛍️'
                  }
                </div>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">{product.price_mqr} أوقية</p>
                  <button className="order-btn" onClick={() => navigate(`/product/${product.id}`)}>اطلب الآن</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

export default App