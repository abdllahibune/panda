export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const { keyword, page = 1 } = req.query
  if (!keyword) return res.status(400).json({ error: 'keyword required' })

  try {
    // Get CJ Token
    const tokenRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abdllahibune@gmail.com',
        password: 'CJ_PASSWORD_HERE'
      })
    })
    const tokenData = await tokenRes.json()
    const token = tokenData?.data?.accessToken
    if (!token) return res.status(401).json({ error: 'CJ auth failed', raw: tokenData })

    // Search products
    const searchRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(keyword)}&pageNum=${page}&pageSize=50`, {
      headers: { 'CJ-Access-Token': token }
    })
    const searchData = await searchRes.json()
    const products = searchData?.data?.list || []

    res.json({
      total: searchData?.data?.total || 0,
      products: products.map(p => ({
        id: p.pid,
        name: p.productNameEn,
        image: p.productImage,
        price_usd: parseFloat(p.sellPrice || p.productPrice || 0),
        category: p.categoryName
      }))
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}