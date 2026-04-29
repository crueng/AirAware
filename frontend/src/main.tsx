import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "react-datepicker/dist/react-datepicker.css" 
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)