import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

import { Toaster } from 'react-hot-toast' // 👈 IMPORTA AQUI

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <Toaster position="top-right" reverseOrder={false} /> {/* 👈 USA AQUI */}
      <App />
    </>
  </React.StrictMode>,
)
