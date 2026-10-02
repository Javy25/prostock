import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './assets/styles.css'

// Importar Bootstrap y Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Si tienes un archivo de estilos CSS propio (ej: style.css o styles.css),
// muévelo a src/assets/styles.css e impórtalo aquí:
// import './assets/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)