export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })

  const productId = url.match(/item\/(\d+)/)?.[1] || url.match(/\/(\d{10,})\./)?.[1]
  if (!productId) return res.status(400).json({ error: 'invalid url' })

  const APP_KEY = '536002'
  const APP_SECRET = 'emexeL3m2hHgoeXQdLVEEMT5sZ8stamy'
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)

  const params = {
    app_key: APP_KEY,
    method: 'aliexpress.affiliate.productdetail.get',
    sign_method: 'sha256',
    timestamp,
    v: '2.0',
    product_ids: productId,
    fields: 'product_id,product_title,product_main_image_url,target_sale_price,target_original_price',
    target_currency: 'USD',
    target_language: 'AR',
    tracking_id: 'panda_store'
  }

  // Sign with Web Crypto API
  const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('')
  const encoder = new TextEncoder()
  const keyData = encoder.encode(APP_SECRET)
  const msgData = encoder.encode(sorted)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const hashArray = Array.from(new Uint8Array(signature))
  params.sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  const query = new URLSearchParams(params).toString()
  const apiUrl = `https://api-sg.aliexpress.com/sync?${query}`

  try {
    const response = await fetch(apiUrl)
    const data = await response.json()
    const result = data?.aliexpress_affiliate_productdetail_get_response?.resp_result

    if (result?.resp_code !== 200) {
      return res.status(400).json({ error: result?.resp_msg || 'API error', raw: data })
    }

    const product = result.result?.products?.traffic_product_d_t_o?.[0]
    if (!product) return res.status(404).json({ error: 'Product not found' })

    res.json({
      id: product.product_id,
      name: product.product_title,
      image: product.product_main_image_url,
      price_usd: parseFloat(product.target_sale_price || product.target_original_price)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}