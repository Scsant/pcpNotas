import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { Toaster } from 'react-hot-toast'; // ✅ já tá certinho

import { AuthProvider } from './context/AuthContext'; // ✅ Não precisa mudar aqui, só o nome do arquivo importa


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* ✅ ENVOLVE TUDO COM CONTEXTO */}
      <>
        <Toaster position="top-right" reverseOrder={false} />
        <App />
      </>
    </AuthProvider>
  </React.StrictMode>
);
