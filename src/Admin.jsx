import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './admin.css'

function Admin() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Product form
  const [pForm, setPForm] = useState({ name: '', price_mqr: '', shipping_cost: '', description: '', category_id: '', is_active: true })
  const [pImage, setPImage] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  // Category form
  const [cForm, setCForm] = useState({ name: '' })
  const [cImage, setCImage] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: p }, { data: c }, { data: o }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('orders').select('*').order('created_at', { ascending: false })
    ])
    setProducts(p || [])
    setCategories(c || [])
    setOrders(o || [])
  }

  async function uploadImage(file, bucket) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  }

  async function saveProduct() {
    if (!pForm.name || !pForm.price_mqr) return setMsg('اسم المنتج والسعر مطلوبان')
    setLoading(true)
    let image_url = editingProduct?.image_url || null
    if (pImage) image_url = await uploadImage(pImage, 'product-images')
    const payload = { ...pForm, price_mqr: parseInt(pForm.price_mqr), shipping_cost: parseInt(pForm.shipping_cost) || 0, image_url }
    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id)
      setMsg('تم تحديث المنتج')
    } else {
      await supabase.from('products').insert(payload)
      setMsg('تم إضافة المنتج')
    }
    setPForm({ name: '', price_mqr: '', shipping_cost: '', description: '', category_id: '', is_active: true })
    setPImage(null)
    setEditingProduct(null)
    setLoading(false)
    fetchAll()
  }

  async function deleteProduct(id) {
    if (!confirm('حذف المنتج؟')) return
    await supabase.from('products').delete().eq('id', id)
    fetchAll()
  }

  function editProduct(p) {
    setEditingProduct(p)
    setPForm({ name: p.name, price_mqr: p.price_mqr, shipping_cost: p.shipping_cost || 0, description: p.description || '', category_id: p.category_id || '', is_active: p.is_active })
    setTab('products')
    window.scrollTo(0, 0)
  }

  async function saveCategory() {
    if (!cForm.name) return setMsg('اسم القسم مطلوب')
    setLoading(true)
    let image_url = null
    if (cImage) image_url = await uploadImage(cImage, 'categories')
    await supabase.from('categories').insert({ ...cForm, image_url })
    setCForm({ name: '' })
    setCImage(null)
    setMsg('تم إضافة القسم')
    setLoading(false)
    fetchAll()
  }

  async function deleteCategory(id) {
    if (!confirm('حذف القسم؟')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchAll()
  }

  async function updateOrderStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchAll()
  }

  const STATUS = { pending: 'مدفوع', ordered: 'تم الطلب', shipping: 'في الطريق', delivered: 'وصل' }
  const STATUS_COLORS = { pending: '#f59e0b', ordered: '#3b82f6', shipping: '#8b5cf6', delivered: '#10b981' }

  return (
    <div className="adm" dir="rtl">
      <header className="adm-header">
        <div className="adm-logo">لوحة تحكم باندا</div>
        <div className="adm-tabs">
          {[['products','المنتجات'],['categories','الأقسام'],['orders','الطلبات']].map(([key,label]) => (
            <button key={key} className={`adm-tab ${tab===key?'active':''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        <a href="/" className="adm-site-btn">الموقع</a>
      </header>

      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ✕</div>}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <div className="adm-content">
          <div className="adm-form-card">
            <h2>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label>اسم المنتج *</label>
                <input value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} placeholder="اسم المنتج" />
              </div>
              <div className="adm-field">
                <label>القسم</label>
                <select value={pForm.category_id} onChange={e => setPForm({...pForm, category_id: e.target.value})}>
                  <option value="">بدون قسم</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="adm-field">
                <label>السعر (أوقية) *</label>
                <input type="number" value={pForm.price_mqr} onChange={e => setPForm({...pForm, price_mqr: e.target.value})} placeholder="0" />
              </div>
              <div className="adm-field">
                <label>سعر الشحن (أوقية)</label>
                <input type="number" value={pForm.shipping_cost} onChange={e => setPForm({...pForm, shipping_cost: e.target.value})} placeholder="0" />
              </div>
              <div className="adm-field adm-span-2">
                <label>الوصف</label>
                <textarea value={pForm.description} onChange={e => setPForm({...pForm, description: e.target.value})} placeholder="وصف المنتج..." rows={3} />
              </div>
              <div className="adm-field">
                <label>صورة المنتج</label>
                <input type="file" accept="image/*" onChange={e => setPImage(e.target.files[0])} />
                {pImage && <span className="adm-file-name">{pImage.name}</span>}
                {editingProduct?.image_url && !pImage && <img src={editingProduct.image_url} className="adm-thumb" />}
              </div>
              <div className="adm-field adm-center">
                <label>ظاهر في الموقع</label>
                <input type="checkbox" checked={pForm.is_active} onChange={e => setPForm({...pForm, is_active: e.target.checked})} />
              </div>
            </div>
            <div className="adm-form-actions">
              <button className="adm-btn-primary" onClick={saveProduct} disabled={loading}>
                {loading ? 'جاري الحفظ...' : editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
              </button>
              {editingProduct && <button className="adm-btn-secondary" onClick={() => { setEditingProduct(null); setPForm({ name:'',price_mqr:'',shipping_cost:'',description:'',category_id:'',is_active:true }) }}>إلغاء</button>}
            </div>
          </div>

          <div className="adm-table-card">
            <h2>المنتجات ({products.length})</h2>
            <table className="adm-table">
              <thead>
                <tr><th>الصورة</th><th>الاسم</th><th>السعر</th><th>الشحن</th><th>القسم</th><th>ظاهر</th><th>إجراء</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.image_url ? <img src={p.image_url} className="adm-thumb" /> : '—'}</td>
                    <td>{p.name}</td>
                    <td>{p.price_mqr} أوقية</td>
                    <td>{p.shipping_cost || 0} أوقية</td>
                    <td>{p.categories?.name || '—'}</td>
                    <td><span className={`adm-badge ${p.is_active ? 'green' : 'gray'}`}>{p.is_active ? 'نعم' : 'لا'}</span></td>
                    <td>
                      <button className="adm-btn-edit" onClick={() => editProduct(p)}>تعديل</button>
                      <button className="adm-btn-delete" onClick={() => deleteProduct(p.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {tab === 'categories' && (
        <div className="adm-content">
          <div className="adm-form-card">
            <h2>إضافة قسم جديد</h2>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label>اسم القسم *</label>
                <input value={cForm.name} onChange={e => setCForm({...cForm, name: e.target.value})} placeholder="مثال: ملابس، إلكترونيات..." />
              </div>
              <div className="adm-field">
                <label>صورة القسم</label>
                <input type="file" accept="image/*" onChange={e => setCImage(e.target.files[0])} />
                {cImage && <span className="adm-file-name">{cImage.name}</span>}
              </div>
            </div>
            <button className="adm-btn-primary" onClick={saveCategory} disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'إضافة القسم'}
            </button>
          </div>

          <div className="adm-grid-categories">
            {categories.map(c => (
              <div className="adm-cat-card" key={c.id}>
                {c.image_url ? <img src={c.image_url} /> : <div className="adm-cat-placeholder">لا توجد صورة</div>}
                <div className="adm-cat-name">{c.name}</div>
                <button className="adm-btn-delete" onClick={() => deleteCategory(c.id)}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="adm-content">
          <div className="adm-table-card">
            <h2>الطلبات ({orders.length})</h2>
            <table className="adm-table">
              <thead>
                <tr><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>المنتج</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(0,8).toUpperCase()}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_phone}</td>
                    <td>{o.product_name}</td>
                    <td>{o.total_price} أوقية</td>
                    <td>
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                        style={{ background: STATUS_COLORS[o.status], color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                        {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString('ar')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin