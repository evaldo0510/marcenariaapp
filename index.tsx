import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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
    // Capture Referral Code form URL if present
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
        sessionStorage.setItem('referrerCode', refCode);
        // Optional: Clear URL to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check session storage on initial load
    const storedEmail = sessionStorage.getItem('userEmail');
    const storedPlan = sessionStorage.getItem('userPlan');
    if (storedEmail && storedPlan) {
      setUserEmail(storedEmail);
      setUserPlan(storedPlan);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (emailInput: string, role: 'user' | 'partner' = 'user') => {
    const email = emailInput.trim().toLowerCase();
    // If logging in as a partner, set plan to 'partner'. Otherwise default to 'hobby'.
    // If Evaldo, he will override this in App.tsx anyway, but 'business' is a safe default for him here.
    let plan = role === 'partner' ? 'partner' : 'hobby';
    if (email === 'evaldo0510@gmail.com') plan = 'business';

    sessionStorage.setItem('userEmail', email);
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