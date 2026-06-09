import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './admin.css'
const RAPIDAPI_KEY = 'e69ad28a7dmsh028e4d8f9c683e3p1e2692jsnca2e6e385579'

async function fetchFromAliexpress(keyword) {
  const url = `https://aliexpress-datahub.p.rapidapi.com/item_search_3?q=${encodeURIComponent(keyword)}&page=1`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  })
  const data = await res.json()
  return data?.result?.resultList || []
}

function Admin() {
  const [page, setPage] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState({ usd_to_mqr: 40, margin_percent: 15, shipping_cost: 500 })
  const [loading, setLoading] = useState(true)

  // نموذج منتج جديد
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price_usd: '', image_url: '', source_url: '', category: ''
  })

  useEffect(() => {
    if (page === 'orders') fetchOrders()
    if (page === 'products') fetchProducts()
    if (page === 'settings') fetchSettings()
  }, [page])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) setSettings(data)
  }

  async function updateOrderStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.price_usd) return alert('الاسم والسعر مطلوبان')
    const price_mqr = newProduct.price_usd * settings.usd_to_mqr * (1 + settings.margin_percent / 100) + settings.shipping_cost
    await supabase.from('products').insert({ ...newProduct, price_usd: parseFloat(newProduct.price_usd), price_mqr: Math.round(price_mqr) })
    setNewProduct({ name: '', description: '', price_usd: '', image_url: '', source_url: '', category: '' })
    fetchProducts()
  }

  async function deleteProduct(id) {
    if (!confirm('حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  async function saveSettings() {
    await supabase.from('settings').update(settings).eq('id', 1)
    alert('تم حفظ الإعدادات ✅')
  }
  // AliExpress Scraper
  const [scraperQuery, setScraperQuery] = useState('')
  const [scraperResults, setScraperResults] = useState([])
  const [scraperLoading, setScraperLoading] = useState(false)
  const [importing, setImporting] = useState({})

  async function searchAliexpress() {
    if (!scraperQuery) return alert('اكتب كلمة بحث')
    setScraperLoading(true)
    setScraperResults([])
    try {
      const url = `https://aliexpress-datahub.p.rapidapi.com/item_search_3?q=${encodeURIComponent(scraperQuery)}&page=1`
      const res = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      })
      const data = await res.json()
      const items = data?.result?.resultList || []
      setScraperResults(items)
    } catch(e) {
      alert('خطأ في الاتصال')
    }
    setScraperLoading(false)
  }

  async function importProduct(item) {
    const id = item.item?.itemId
    setImporting(p => ({...p, [id]: true}))
    const name = item.item?.title || 'منتج'
    const image = item.item?.image || ''
    const price_usd = parseFloat(item.item?.sku?.def?.promotionPrice || item.item?.sku?.def?.price || 0)
    const usdRate = settings?.usd_to_mqr || 370
    const price_mqr = Math.round(price_usd * usdRate * 1.3)
    await supabase.from('products').insert({
      name, image_url: image, price_usd, price_mqr,
      description: '', category: 'عام', is_active: true
    })
    setImporting(p => ({...p, [id]: false}))
    alert('تم إضافة المنتج')
  }

  const statusLabels = {
    pending: '🟡 مدفوع',
    ordered: '🔵 مطلوب',
    shipping: '🚚 في الطريق',
    delivered: '✅ وصل'
  }

  return (
    <div className="admin" dir="rtl">
      <header className="admin-header">
        <h1>🐼 لوحة تحكم باندا</h1>
        <nav>
          <button className={page === 'orders' ? 'active' : ''} onClick={() => setPage('orders')}>📦 الطلبات</button>
          <button className={page === 'products' ? 'active' : ''} onClick={() => setPage('products')}>🛍️ المنتجات</button>
          <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>⚙️ الإعدادات</button>
          <button className={page === 'scraper' ? 'active' : ''} onClick={() => setPage('scraper')}>استيراد</button>
        </nav>
      </header>

      <main className="admin-main">

        {/* ORDERS */}
        {page === 'orders' && (
          <div>
            <h2>الطلبات ({orders.length})</h2>
            {loading ? <p>جاري التحميل...</p> : orders.length === 0 ? <p>لا توجد طلبات بعد</p> : (
              <div className="orders-list">
                {orders.map(order => (
                  <div className="order-card" key={order.id}>
                    <div className="order-info">
                      <strong>{order.customer_name}</strong>
                      <span>{order.customer_phone}</span>
                      <span>{order.customer_address}</span>
                      <span>{order.product_name}</span>
                      <span className="price">{order.total_price} أوقية</span>
                      <span className="date">{new Date(order.created_at).toLocaleDateString('ar')}</span>
                    </div>
                    <div className="order-status">
                      <span className="status-badge">{statusLabels[order.status]}</span>
                      <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}>
                        <option value="pending">مدفوع</option>
                        <option value="ordered">مطلوب</option>
                        <option value="shipping">في الطريق</option>
                        <option value="delivered">وصل</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {page === 'products' && (
          <div>
            <h2>إضافة منتج جديد</h2>
            <div className="add-product-form">
              <input placeholder="اسم المنتج *" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input placeholder="السعر بالدولار *" type="number" value={newProduct.price_usd} onChange={e => setNewProduct({...newProduct, price_usd: e.target.value})} />
              <input placeholder="رابط الصورة" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
              <input placeholder="رابط المنتج الأصلي" value={newProduct.source_url} onChange={e => setNewProduct({...newProduct, source_url: e.target.value})} />
              <input placeholder="القسم" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
              <textarea placeholder="الوصف" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <button className="add-btn" onClick={addProduct}>➕ إضافة المنتج</button>
            </div>

            <h2>المنتجات ({products.length})</h2>
            {loading ? <p>جاري التحميل...</p> : (
              <div className="products-list">
                {products.map(p => (
                  <div className="product-row" key={p.id}>
                    {p.image_url && <img src={p.image_url} alt={p.name} />}
                    <div>
                      <strong>{p.name}</strong>
                      <span>{p.price_mqr} أوقية</span>
                    </div>
                    <button className="delete-btn" onClick={() => deleteProduct(p.id)}>🗑️ حذف</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {page === 'settings' && (
          <div className="settings-form">
            <h2>إعدادات التسعير</h2>
            <label>سعر الصرف (1 دولار = ؟ أوقية)
              <input type="number" value={settings.usd_to_mqr} onChange={e => setSettings({...settings, usd_to_mqr: parseFloat(e.target.value)})} />
            </label>
            <label>نسبة الهامش (%)
              <input type="number" value={settings.margin_percent} onChange={e => setSettings({...settings, margin_percent: parseFloat(e.target.value)})} />
            </label>
            <label>تكلفة الشحن (أوقية)
              <input type="number" value={settings.shipping_cost} onChange={e => setSettings({...settings, shipping_cost: parseFloat(e.target.value)})} />
            </label>
            <button className="save-btn" onClick={saveSettings}>💾 حفظ الإعدادات</button>
          </div>
        )}

        {page === 'scraper' &&
          <div style={{padding:'20px'}}>
            <h2 style={{marginBottom:'16px'}}>استيراد منتجات من AliExpress</h2>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <input
                style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'14px', textAlign:'right'}}
                placeholder="ابحث... مثال: shoes, watch, bag"
                value={scraperQuery}
                onChange={e => setScraperQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAliexpress()}
              />
              <button
                style={{background:'#ff6900', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}
                onClick={searchAliexpress}
              >
                {scraperLoading ? '...' : 'بحث'}
              </button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px'}}>
              {scraperResults.map(item => {
                const id = item.item?.itemId
                const name = item.item?.title || 'منتج'
                const image = item.item?.image || ''
                const price = item.item?.sku?.def?.promotionPrice || item.item?.sku?.def?.price || '0'
                return (
                  <div key={id} style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden'}}>
                    <img src={image} alt={name} style={{width:'100%', aspectRatio:'1', objectFit:'cover'}} />
                    <div style={{padding:'8px'}}>
                      <p style={{fontSize:'12px', color:'#333', marginBottom:'6px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{name}</p>
                      <p style={{fontSize:'14px', fontWeight:'900', color:'#ff6900', marginBottom:'8px'}}>${price}</p>
                      <button
                        style={{width:'100%', background: importing[id] ? '#ccc' : '#ff6900', color:'white', border:'none', padding:'7px', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}}
                        onClick={() => importProduct(item)}
                        disabled={importing[id]}
                      >
                        {importing[id] ? 'جاري...' : 'اضف للموقع'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        }

      </main>
    </div>
  )
}

export default Admin