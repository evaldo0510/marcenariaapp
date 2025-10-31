import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LoginScreen } from './components/LoginScreen';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AuthWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check session storage on initial load
    const storedEmail = sessionStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    sessionStorage.setItem('userEmail', email);
    setUserEmail(email);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    setUserEmail('');
    setIsAuthenticated(false);
  };

  return (
    <React.StrictMode>
      {isAuthenticated ? <App onLogout={handleLogout} userEmail={userEmail} /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />}
    </React.StrictMode>
  );
};


const root = ReactDOM.createRoot(rootElement);
root.render(<AuthWrapper />);