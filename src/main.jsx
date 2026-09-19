import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Register Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
