import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SocietyConfigProvider } from './context/SocietyConfigContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SocietyConfigProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SocietyConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
