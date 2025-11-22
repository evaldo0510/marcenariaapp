
import React, { useState, useRef } from 'react';
import { LogoIcon, CubeIcon, BlueprintIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, StarIcon, CheckIcon, StoreIcon, ChartBarIcon, HandshakeIcon } from './Shared';

interface LandingPageProps {
  onLoginSuccess: (email: string, role?: 'user' | 'partner') => void;
}

const plans = [
  {
    name: 'Hobby',
    price: 'Grátis',
    priceDescription: 'para sempre',
    description: 'Para entusiastas e pequenos projetos pessoais.',
    features: [
      '3 projetos por mês',
      'Geração 3D Básica',
      'Planta Baixa Automática',
      'Acesso à Comunidade',
    ],
    cta: 'Começar Grátis',
    planId: 'hobby',
    highlight: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 69,90',
    priceDescription: '/mês',
    description: 'Para marceneiros autônomos e designers.',
    features: [
      'Projetos Ilimitados',
      'Render 3D em 4K (IA Avançada)',
      'Plano de Corte & Lista de Compras',
      'Orçamentos em PDF',
      'CRM Básico de Clientes',
      'Suporte Prioritário',
    ],
    cta: 'Ser Profissional',
    planId: 'pro',
    highlight: true,
    badge: 'Mais Popular'
  },
  {
    name: 'Oficina',
    price: 'R$ 199,90',
    priceDescription: '/mês',
    description: 'Gestão completa para marcenarias e lojas.',
    features: [
      'Tudo do Profissional',
      'Gestão Financeira & Estoque',
      'Modo Loja (Showroom Virtual)',
      'Gestão de Equipe (Multi-usuário)',
      'Relatórios de Produtividade',
      'Contratos Digitais',
    ],
    cta: 'Migrar para Oficina',
    planId: 'business',
    highlight: false,
  },
  {
    name: 'Parceiro',
    price: 'R$ 390,00',
    priceDescription: '/mês',
    description: 'Para distribuidores e redes de fornecedores.',
    features: [
      'Portal do Distribuidor Exclusivo',
      'Gestão de Comissões e Vendas',
      'Painel de Múltiplos Clientes',
      'Materiais de Marketing White-label',
      'API de Integração',
      'Gerente de Conta Dedicado',
    ],
    cta: 'Tornar-se Parceiro',
    planId: 'partner',
    highlight: false,
    badge: 'B2B'
  },
];

const PlanCard: React.FC<{ plan: typeof plans[0]; onSelect: () => void; }> = ({ plan, onSelect }) => {
  const isHighlight = plan.highlight;
  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 shadow-lg transition-all duration-300 ${isHighlight ? 'border-[#d4ac6e] bg-[#fffefb] dark:bg-[#3e3535] scale-105 z-10' : 'border-[#e6ddcd] dark:border-[#4a4040] bg-white dark:bg-[#2d2424] hover:shadow-xl'}`}>
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4ac6e] text-[#3e3535] px-4 py-1 rounded-full text-sm font-bold shadow-md uppercase tracking-wide">
          {plan.badge}
        </div>
      )}
      <div className="flex-grow">
        <h3 className="text-2xl font-bold font-serif text-center text-[#3e3535] dark:text-[#f5f1e8]">{plan.name}</h3>
        <div className="mt-4 text-center">
          <span className="text-4xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{plan.price}</span>
          <span className="text-sm text-[#6a5f5f] dark:text-[#c7bca9] block">{plan.priceDescription}</span>
        </div>
        <p className="mt-4 text-center text-sm text-[#8a7e7e] dark:text-[#a89d8d] min-h-[40px]">{plan.description}</p>
        
        <div className="my-6 border-t border-dashed border-[#e6ddcd] dark:border-[#4a4040]"></div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <CheckIcon className={`w-5 h-5 flex-shrink-0 mr-3 ${isHighlight ? 'text-[#d4ac6e]' : 'text-green-500'}`} />
              <span className="text-[#3e3535] dark:text-[#f5f1e8]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <button 
        onClick={onSelect}
        className={`w-full mt-8 font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ${isHighlight ? 'bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535]' : 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'}`}
      >
        {plan.cta}
      </button>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-[#fffefb]/60 dark:bg-[#3e3535]/60 p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
        <div className="inline-block p-4 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full mb-4 text-[#b99256] dark:text-[#d4ac6e]">
            {icon}
        </div>
        <h3 className="text-xl font-semibold font-serif mb-2 text-[#3e3535] dark:text-[#f5f1e8]">{title}</h3>
        <p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9] leading-relaxed">{children}</p>
    </div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; role: string; imageSrc: string; }> = ({ quote, name, role, imageSrc }) => (
    <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-md flex flex-col h-full">
        <div className="flex text-yellow-500 mb-4">
            <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite /> <StarIcon isFavorite />
        </div>
        <p className="text-[#6a5f5f] dark:text-[#c7bca9] italic mb-6 text-sm flex-grow">"{quote}"</p>
        <div className="flex items-center gap-3 mt-auto">
            <img src={imageSrc} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-[#d4ac6e]" />
            <div>
                <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8] text-sm">{name}</p>
                <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d]">{role}</p>
            </div>
        </div>
    </div>
);

const GalleryImage: React.FC<{ src: string; alt: string; title: string }> = ({ src, alt, title }) => (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg aspect-[4/3] cursor-pointer">
        <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
            <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [accountType, setAccountType] = useState<'user' | 'partner'>('user');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(false); // State to toggle between Login/Signup
    
    const loginRef = useRef<HTMLDivElement>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            if (isLoginMode) {
                // Login Mode: Just needs email (passwordless demo)
                if (email.trim() && email.includes('@')) {
                    onLoginSuccess(email, 'user'); // Default role for login unless we have a backend
                } else {
                    setError('Por favor, insira um e-mail válido.');
                }
            } else {
                // Signup Mode: Needs full details
                if (email.trim() && email.includes('@') && name.trim()) {
                    onLoginSuccess(email, accountType);
                } else {
                    setError('Por favor, preencha todos os campos obrigatórios para o cadastro.');
                }
            }
            setIsLoading(false);
        }, 1000);
    };

    const scrollToSection = (mode: 'login' | 'signup') => {
        setIsLoginMode(mode === 'login');
        loginRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] animate-fadeIn overflow-x-hidden">
            {/* Header */}
            <header className="py-4 px-6 md:px-12 flex justify-between items-center bg-[#f5f1e8]/90 dark:bg-[#2d2424]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                <div className="flex items-center gap-3">
                    <LogoIcon className="w-8 h-8 text-[#3e3535] dark:text-[#d4ac6e]" />
                    <h1 className="text-2xl font-bold tracking-tight font-serif">MarcenApp</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })} className="hidden md:block text-sm font-bold hover:text-[#d4ac6e] transition">Planos</button>
                    <button
                        onClick={() => scrollToSection('login')}
                        className="text-[#3e3535] dark:text-[#f5f1e8] hover:text-[#d4ac6e] dark:hover:text-[#d4ac6e] font-bold py-2 px-4 transition"
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => scrollToSection('signup')}
                        className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-6 rounded-lg hover:opacity-90 transition shadow-md"
                    >
                        Criar Conta
                    </button>
                </div>
            </header>

            <main>
                {/* Hero Section - FIXED IMAGE */}
                <section className="py-16 md:py-24 px-6 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-[#d4ac6e]/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <h2 className="text-4xl md:text-6xl font-bold font-serif mb-6 animate-fadeInUp leading-tight">
                                Sua Marcenaria Digital.<br/> 
                                <span className="text-[#b99256] dark:text-[#d4ac6e]">Inteligente e Lucrativa.</span>
                            </h2>
                            <p className="text-lg md:text-xl text-[#6a5f5f] dark:text-[#c7bca9] mb-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                                Do orçamento à entrega. Utilize Inteligência Artificial para criar projetos 3D, otimizar planos de corte e gerenciar sua oficina em uma única plataforma.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                                <button
                                    onClick={() => scrollToSection('signup')}
                                    className="bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg flex items-center justify-center gap-2"
                                >
                                    <CubeIcon /> Testar Grátis
                                </button>
                                <button
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-4 px-10 rounded-xl shadow border border-[#e6ddcd] dark:border-[#4a4040] hover:bg-[#f5f1e8] dark:hover:bg-[#2d2424] transition-all text-lg"
                                >
                                    Ver Recursos
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            {/* REPLACED WITH HIGH RELIABILITY URL */}
                            <img 
                                src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=1000&auto=format&fit=crop" 
                                alt="Cozinha Planejada MarcenApp" 
                                className="rounded-2xl shadow-2xl border-4 border-white dark:border-[#4a4040] w-full object-cover transform rotate-2 hover:rotate-0 transition-transform duration-500"
                            />
                            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-[#3e3535] p-4 rounded-xl shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex items-center gap-3 animate-scaleIn" style={{ animationDelay: '0.6s' }}>
                                <div className="bg-green-100 p-2 rounded-full">
                                    <CheckIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">Orçamento Aprovado</p>
                                    <p className="text-xs text-gray-500">R$ 18.500,00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Tecnologia que Gera Valor</h2>
                            <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Ferramentas integradas para eliminar o desperdício e aumentar suas vendas.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FeatureCard icon={<CubeIcon className="w-8 h-8"/>} title="Projetos com IA">
                                Crie renders 3D fotorrealistas a partir de fotos ou comandos de voz em segundos.
                            </FeatureCard>
                            <FeatureCard icon={<ToolsIcon className="w-8 h-8"/>} title="Plano de Corte">
                                Otimização automática de chapas que reduz em até 30% o desperdício de material.
                            </FeatureCard>
                            <FeatureCard icon={<ChartBarIcon className="w-8 h-8"/>} title="Gestão Completa">
                                Controle financeiro, estoque, cronograma Kanban e equipe em um só lugar.
                            </FeatureCard>
                             <FeatureCard icon={<StoreIcon className="w-8 h-8"/>} title="Modo Loja">
                                Transforme seu tablet em um catálogo digital interativo para fechar vendas na hora.
                            </FeatureCard>
                        </div>
                    </div>
                </section>

                {/* Project Gallery Section - FIXED IMAGES */}
                <section className="py-20 px-6 bg-[#fffefb] dark:bg-[#2d2424]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Crie Projetos Incríveis</h2>
                            <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Veja o que é possível fazer com a inteligência artificial do MarcenApp.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <GalleryImage 
                                src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format&fit=crop" 
                                alt="Cozinha Moderna" 
                                title="Cozinhas" 
                            />
                            <GalleryImage 
                                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop" 
                                alt="Sala de Estar" 
                                title="Salas de Estar" 
                            />
                            <GalleryImage 
                                src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop" 
                                alt="Dormitório" 
                                title="Dormitórios" 
                            />
                            <GalleryImage 
                                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop" 
                                alt="Escritório" 
                                title="Escritórios" 
                            />
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20 px-6 bg-[#f5f1e8] dark:bg-[#3e3535]/50">
                     <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif">Quem usa, recomenda</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard 
                                name="Carlos Ferreira"
                                role="Dono da Marcenaria CF"
                                quote="O MarcenApp organizou minha oficina. Antes eu perdia horas calculando plano de corte na mão. Agora é automático."
                                imageSrc="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                            />
                             <TestimonialCard 
                                name="Juliana Andrade"
                                role="Arquiteta e Designer"
                                quote="A qualidade dos renders gerados pela IA é impressionante. Meus clientes fecham o projeto muito mais rápido."
                                imageSrc="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                            />
                             <TestimonialCard 
                                name="Ricardo Martins"
                                role="Distribuidor Parceiro"
                                quote="Como parceiro, consigo gerenciar meus clientes marceneiros e oferecer uma solução que realmente ajuda eles a crescerem."
                                imageSrc="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                            />
                        </div>
                     </div>
                </section>

                {/* Plans Section */}
                <section id="plans" className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Escolha o Plano Ideal</h2>
                            <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Investimento que se paga no primeiro projeto.</p>
                        </div>
                        {/* Plan Grid: Adjusted for 4 items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                            {plans.map(plan => (
                                <PlanCard key={plan.name} plan={plan} onSelect={() => scrollToSection('signup')} />
                            ))}
                        </div>
                        
                        <div className="mt-12 text-center">
                            <div className="inline-block bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2">
                                    <HandshakeIcon /> Programa de Parceiros
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                    Tem uma loja de ferragens ou é influenciador? <button onClick={() => scrollToSection('signup')} className="underline font-bold hover:text-blue-900">Torne-se um Parceiro Autorizado</button> e ganhe comissões recorrentes.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Login/CTA Section - UPDATED WITH TABS */}
                <section id="login" ref={loginRef} className="py-20 px-6 bg-[#fffefb] dark:bg-[#3e3535]">
                    <div className="w-full max-w-md mx-auto">
                        <div className="flex flex-col items-center mb-8">
                            <h2 className="text-3xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] text-center">
                                {isLoginMode ? 'Acesse sua conta' : 'Comece Agora'}
                            </h2>
                            <p className="text-[#6a5f5f] dark:text-[#c7bca9] text-lg mt-2 text-center">
                                {isLoginMode ? 'Bem-vindo de volta!' : 'Crie sua conta gratuita e explore o futuro.'}
                            </p>
                        </div>
                        <div className="bg-[#f5f1e8] dark:bg-[#2d2424] p-8 rounded-2xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-xl">
                            
                            {/* Toggle Switch */}
                            <div className="flex justify-center mb-6 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                                <button
                                    type="button"
                                    className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${!isLoginMode ? 'border-[#d4ac6e] text-[#d4ac6e]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-[#3e3535] dark:hover:text-[#f5f1e8]'}`}
                                    onClick={() => setIsLoginMode(false)}
                                >
                                    Criar Conta
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${isLoginMode ? 'border-[#d4ac6e] text-[#d4ac6e]' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-[#3e3535] dark:hover:text-[#f5f1e8]'}`}
                                    onClick={() => setIsLoginMode(true)}
                                >
                                    Já tenho conta
                                </button>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Only show extra fields if signing up */}
                                {!isLoginMode && (
                                    <>
                                        <div className="animate-fadeIn">
                                            <label className="block text-sm font-bold text-[#6a5f5f] dark:text-[#c7bca9] mb-2">
                                                Quero ser:
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setAccountType('user')}
                                                    className={`py-2 px-3 rounded-lg text-sm font-bold transition ${accountType === 'user' ? 'bg-[#d4ac6e] text-[#3e3535] shadow-md' : 'bg-white dark:bg-[#3e3535] text-gray-500 border border-[#e6ddcd] dark:border-[#4a4040]'}`}
                                                >
                                                    Marceneiro
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAccountType('partner')}
                                                    className={`py-2 px-3 rounded-lg text-sm font-bold transition ${accountType === 'partner' ? 'bg-[#3e3535] text-white shadow-md' : 'bg-white dark:bg-[#3e3535] text-gray-500 border border-[#e6ddcd] dark:border-[#4a4040]'}`}
                                                >
                                                    Parceiro
                                                </button>
                                            </div>
                                        </div>

                                        <div className="animate-fadeIn">
                                            <label htmlFor="name-landing" className="block text-sm font-bold text-[#6a5f5f] dark:text-[#c7bca9] mb-1">
                                                Nome Completo
                                            </label>
                                            <input
                                                id="name-landing"
                                                name="name"
                                                type="text"
                                                required={!isLoginMode}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-[#e6ddcd] dark:border-[#5a4f4f] bg-white dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] transition"
                                                placeholder="Seu nome"
                                            />
                                        </div>

                                        <div className="animate-fadeIn">
                                            <label htmlFor="phone-landing" className="block text-sm font-bold text-[#6a5f5f] dark:text-[#c7bca9] mb-1">
                                                Telefone / WhatsApp
                                            </label>
                                            <input
                                                id="phone-landing"
                                                name="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full p-3 rounded-xl border border-[#e6ddcd] dark:border-[#5a4f4f] bg-white dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] transition"
                                                placeholder="(XX) XXXXX-XXXX"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="email-landing" className="block text-sm font-bold text-[#6a5f5f] dark:text-[#c7bca9] mb-1">
                                        E-mail {isLoginMode ? '' : 'Profissional'}
                                    </label>
                                    <input
                                        id="email-landing"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-[#e6ddcd] dark:border-[#5a4f4f] bg-white dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] transition"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded animate-fadeIn">{error}</p>}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-[#3e3535] bg-[#d4ac6e] hover:bg-[#c89f5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4ac6e] transition disabled:opacity-70"
                                    >
                                        {isLoading ? (isLoginMode ? 'Entrando...' : 'Criando conta...') : (isLoginMode ? 'Acessar Sistema' : (accountType === 'partner' ? 'Criar Conta de Parceiro' : 'Criar Conta Grátis'))}
                                    </button>
                                </div>
                                <p className="text-xs text-center text-gray-500">
                                    {isLoginMode ? 'Não tem senha. O acesso é via e-mail para este demo.' : 'Sem necessidade de cartão de crédito para o plano Hobby.'}
                                </p>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#e6ddcd] dark:bg-[#2d2424] border-t border-[#dcd6c8] dark:border-[#4a4040] text-[#6a5f5f] dark:text-[#a89d8d] py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <LogoIcon className="w-6 h-6"/>
                            <span className="font-bold font-serif text-lg text-[#3e3535] dark:text-[#f5f1e8]">MarcenApp</span>
                        </div>
                        <p className="text-sm">A plataforma definitiva para marceneiros modernos.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-[#d4ac6e]">Funcionalidades</a></li>
                            <li><a href="#" className="hover:text-[#d4ac6e]">Planos e Preços</a></li>
                            <li><a href="#" className="hover:text-[#d4ac6e]">Atualizações</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-[#d4ac6e]">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-[#d4ac6e]">Comunidade</a></li>
                            <li><a href="#" className="hover:text-[#d4ac6e]">Fale Conosco</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-[#d4ac6e]">Termos de Uso</a></li>
                            <li><a href="#" className="hover:text-[#d4ac6e]">Privacidade</a></li>
                        </ul>
                    </div>
                </div>
                <div className="text-center pt-8 border-t border-[#dcd6c8] dark:border-[#4a4040]">
                    <p>&copy; {new Date().getFullYear()} MarcenApp Tecnologia. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};
