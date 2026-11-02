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

const app = (
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// `pnpm build:static` prerenders public routes in English (scripts/prerender.mjs).
// Hydrate only when the markup is for this path and the visitor is on English;
// otherwise drop it and client-render as before.
const root = document.getElementById('root')!
const prerendered = root.dataset.prerendered
const here = location.pathname.replace(/\/+$/, '') || '/'
const wantsTamil = useStore.getState().lang === 'ta' || new URLSearchParams(location.search).get('lang') === 'ta'
if (prerendered && prerendered === here && root.firstElementChild && !wantsTamil) {
  ReactDOM.hydrateRoot(root, app)
} else {
  root.textContent = ''
  ReactDOM.createRoot(root).render(app)
}
