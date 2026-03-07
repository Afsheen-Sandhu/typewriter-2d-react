import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './ultimate-typewriter.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
