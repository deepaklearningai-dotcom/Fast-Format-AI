import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app mounted successfully");
} catch (error) {
  console.error("Failed to mount React application:", error);
  rootElement.innerHTML = `<div style="color: red; padding: 20px;">Failed to start app: ${error instanceof Error ? error.message : String(error)}</div>`;
}