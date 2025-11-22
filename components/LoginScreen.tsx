
import React, { useState } from 'react';
import { LogoIcon } from './Shared';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Strict email regex validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido (ex: nome@dominio.com).');
      return;
    }

    setIsLoading(true);

    // Simulating an API call with simplified access
    setTimeout(() => {
      // Explicitly grant access to the requested email, while maintaining general access for any valid email.
      if (email.trim().toLowerCase() === 'evaldo0510@gmail.com' || validateEmail(email)) {
        onLoginSuccess(email);
      } else {
        setError('Por favor, insira um e-mail válido.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f5f1e8] p-4 animate-fadeIn" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,172,110,0.05) 0%, rgba(245,241,232,1) 60%)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoIcon className="text-[#3e3535] w-16 h-16"/>
          <h1 className="text-5xl font-bold font-serif text-[#3e3535] mt-4">MarcenApp</h1>
          <p className="text-[#6a5f5f] text-lg mt-2">A revolução da marcenaria começa aqui.</p>
        </div>

        <div className="bg-[#fffefb]/80 backdrop-blur-sm p-8 rounded-xl border border-[#e6ddcd] shadow-2xl shadow-stone-300/30">
          <h2 className="text-2xl font-serif font-semibold text-center text-[#3e3535] mb-6">Acesse sua conta</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#6a5f5f]">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full bg-[#f0e9dc] border-2 border-[#e6ddcd] rounded-lg p-3 text-[#3e3535] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                placeholder="seu@email.com"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center font-bold animate-fadeIn">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-[#3e3535] bg-[#d4ac6e] hover:bg-[#c89f5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4ac6e] transition disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
