import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LandingPage } from './components/LandingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AuthWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    // Check session storage on initial load
    const storedEmail = sessionStorage.getItem('userEmail');
    const storedPlan = sessionStorage.getItem('userPlan');
    if (storedEmail && storedPlan) {
      setUserEmail(storedEmail);
      setUserPlan(storedPlan);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    const plan = 'hobby';
    sessionStorage.setItem('userEmail', email);
    // Default new users to the free hobby plan for instant access
    sessionStorage.setItem('userPlan', plan);
    setUserEmail(email);
    setUserPlan(plan);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userPlan');
    setUserEmail('');
    setUserPlan(null);
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    if (isAuthenticated && userPlan) {
        return <App onLogout={handleLogout} userEmail={userEmail} userPlan={userPlan} />;
    }
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <React.StrictMode>
      {renderContent()}
    </React.StrictMode>
  );
};


const root = ReactDOM.createRoot(rootElement);
root.render(<AuthWrapper />);