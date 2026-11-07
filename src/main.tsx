import './polyfills' // ต้องอยู่บรรทัดแรก: เติม API ให้เบราว์เซอร์เก่า
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installGlobalErrorHandler } from './services/errorLogger'

// ติดตั้ง global error tracking
installGlobalErrorHandler()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
