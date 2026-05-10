import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LangProvider } from './utils/lang'
import { SalesInvoiceProvider } from './utils/salesInvoice'
import { ReturnsProvider } from './utils/returns'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <SalesInvoiceProvider>
        <ReturnsProvider>
          <App />
        </ReturnsProvider>
      </SalesInvoiceProvider>
    </LangProvider>
  </StrictMode>,
)
