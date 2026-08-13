import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { RuntimeProvider } from './services/runtime.js';
import './index.css';

// Host calls: mount(domNode, { authToken, tenant, user, permissions, theme, eventBus, apiBaseUrl })
export function mount(el, runtimeContext) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <RuntimeProvider value={runtimeContext}>
        <App />
      </RuntimeProvider>
    </React.StrictMode>
  );
  return () => root.unmount();
}
