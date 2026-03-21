import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './utils/networkInterceptor.js';
import { useEmailStore } from './store/useEmailStore';

// Initializing store auth listener
useEmailStore.getState().initAuth();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
