
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Root = () => {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);
