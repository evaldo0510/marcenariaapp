
import React, { useState } from 'react';
import { LogoIcon } from './Shared';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Strict email regex validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string) => {
      return password.length >= 6;
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
      if (field === 'email') setEmail(value);
      if (field === 'password') setPassword(value);

      // Clear specific error on change
      setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string; general?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido.';
    }

    if (!validatePassword(password)) {
        newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setIsLoading(true);

    // Simulating an API call with simplified access
    setTimeout(() => {
      // Explicitly grant access to the requested email, while maintaining general access for any valid email.
      if (email.trim().toLowerCase() === 'evaldo0510@gmail.com' || validateEmail(email)) {
        onLoginSuccess(email);
      } else {
        setErrors({ general: 'Credenciais inválidas.' });
      }
      setIsLoading(false);
    }, 1000);
  };

  const getInputClass = (hasError: boolean) => {
      const base = "mt-1 block w-full bg-[#f0e9dc] border-2 rounded-lg p-3 text-[#3e3535] focus:outline-none focus:ring-2 transition";
      if (hasError) {
          return `${base} border-red-500 focus:ring-red-500 focus:border-red-500`;
      }
      return `${base} border-[#e6ddcd] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]`;
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
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={getInputClass(!!errors.email)}
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#6a5f5f]">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={getInputClass(!!errors.password)}
                placeholder="******"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            
            {errors.general && <p className="text-red-500 text-sm text-center font-bold animate-fadeIn bg-red-50 p-2 rounded">{errors.general}</p>}

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
