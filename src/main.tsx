import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { useStore } from './lib/store'
import { isAdminPath } from './lib/i18n'
import './index.css'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

// Apply the persisted language before first paint so fonts don't flash.
const path = basename && location.pathname.startsWith(basename) ? location.pathname.slice(basename.length) || '/' : location.pathname
document.documentElement.lang = isAdminPath(path) ? 'en' : useStore.getState().lang

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
