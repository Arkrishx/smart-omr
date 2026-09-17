import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Support custom backend URL, environment variable, or live tunnel fallback
const savedBackendUrl = localStorage.getItem('SMART_OMR_BACKEND_URL');
const defaultBackendUrl = savedBackendUrl || import.meta.env.VITE_API_URL || 'https://nine-cups-hug.loca.lt';

if (defaultBackendUrl) {
  axios.defaults.baseURL = defaultBackendUrl;
}

// Bypass tunnel reminder screen for localtunnel / reverse proxies
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

// Global Axios Response Interceptor:
// If an API request returns HTML (which happens when Vercel rewrites /api/* to /index.html in SPA mode),
// reject it so components treat it as a Network/Backend error rather than parsing HTML as JSON!
axios.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || '';
    if (typeof response.data === 'string' && (contentType.includes('text/html') || response.data.trim().startsWith('<!doctype html>'))) {
      const err = new Error('Backend offline or returned HTML');
      err.isHtmlFallback = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

