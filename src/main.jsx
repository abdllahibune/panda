import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'
import ProductPage from './ProductPage.jsx'
import Checkout from './Checkout.jsx'
import TrackOrder from './TrackOrder.jsx'
import Auth from './Auth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)