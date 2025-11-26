
// ... existing imports
import React, { useState, useEffect, useRef } from 'react';
import { 
  HammerIcon, 
  RulerIcon, 
  ArrowRightIcon, 
  PlayCircleIcon, 
  MenuIcon, 
  XIcon, 
  CheckIcon,
  SmartphoneIcon, 
  EmailIcon,
  ZapIcon,
  MessageCircleIcon,
  PhoneIcon,
  MapPinIcon,
  Maximize2Icon,
  DocumentTextIcon,
  CalculatorIcon,
  UsersIcon,
  LogoIcon,
  ClockIcon,
  MagicIcon,
  BookIcon
} from './Shared';

interface LandingPageProps {
  onLoginSuccess: (email: string, role?: 'user' | 'partner') => void;
}

// Componente Principal
export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  // ... existing state ...
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Estado para controlar qual modal está aberto (Funcionalidade ou Imagem)
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Estado para PWA
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // ... existing effects ...
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
      if (installPrompt) {
          installPrompt.prompt();
      } else {
          // Fallback para iOS ou se não houver prompt
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
          if (isIOS) {
             alert("Para instalar no iPhone:\n1. Toque no botão Compartilhar (quadrado com seta)\n2. Selecione 'Adicionar à Tela de Início'");
          } else {
             alert("Para instalar, use o menu do seu navegador e selecione 'Instalar Aplicativo' ou 'Adicionar à Tela Inicial'.");
          }
      }
  };

  // Login/Signup Scroll Logic
  const loginRef = useRef<HTMLDivElement>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'partner'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollToLogin = (mode: 'login' | 'signup') => {
      setIsLoginMode(mode === 'login');
      loginRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      setTimeout(() => {
          if (isLoginMode) {
              if (email.trim() && email.includes('@')) {
                  onLoginSuccess(email, 'user');
              } else {
                  setError('Por favor, insira um e-mail válido.');
              }
          } else {
              if (email.trim() && email.includes('@') && name.trim()) {
                  onLoginSuccess(email, accountType);
              } else {
                  setError('Por favor, preencha todos os campos.');
              }
          }
          setIsLoading(false);
      }, 1000);
  };

  // ... existing modal lock effect ...
  useEffect(() => {
    if (selectedFeature || selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedFeature, selectedImage]);

  // ... existing services data ...
  const services = [
    {
      id: 1,
      icon: <MagicIcon className="w-8 h-8 text-[#d4ac6e]" />,
      title: "Projetos 3D com IA",
      shortDesc: "Transforme ideias em imagens fotorrealistas em segundos usando inteligência artificial.",
      fullDesc: "Não perca tempo desenhando do zero. Descreva o móvel ou tire uma foto do ambiente, e nossa IA gera visualizações 3D impressionantes para você apresentar ao cliente e fechar a venda na hora.",
      benefits: [
        { icon: <ZapIcon className="w-5 h-5" />, text: "Geração instantânea via texto ou voz" },
        { icon: <CheckIcon className="w-5 h-5" />, text: "Renderização fotorrealista automática" },
        { icon: <SmartphoneIcon className="w-5 h-5" />, text: "Funciona direto no celular" },
        { icon: <DocumentTextIcon className="w-5 h-5" />, text: "Várias opções de estilo e acabamento" }
      ],
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200"
    },
    {
      id: 2,
      icon: <RulerIcon className="w-8 h-8 text-[#d4ac6e]" />,
      title: "Planos de Corte",
      shortDesc: "Otimize o uso das chapas de MDF e evite desperdícios na produção.",
      fullDesc: "Nosso sistema calcula a melhor disposição das peças na chapa. Você economiza material, dinheiro e tempo de serra. Exporte o plano direto para a produção.",
      benefits: [
        { icon: <ZapIcon className="w-5 h-5" />, text: "Redução de até 30% no desperdício" },
        { icon: <DocumentTextIcon className="w-5 h-5" />, text: "Diagrama de corte visual" },
        { icon: <CheckIcon className="w-5 h-5" />, text: "Lista de peças detalhada" },
        { icon: <SmartphoneIcon className="w-5 h-5" />, text: "Leve o plano para a esquadrejadeira" }
      ],
      image: "https://images.unsplash.com/photo-1622372738946-e215733cb96b?auto=format&fit=crop&q=80&w=1200"
    },
    {
      id: 3,
      icon: <CalculatorIcon className="w-8 h-8 text-[#d4ac6e]" />,
      title: "Orçamentos e Listas",
      shortDesc: "Gere preços precisos e listas de materiais (BOM) automaticamente.",
      fullDesc: "Nunca mais tenha prejuízo por esquecer ferragens ou errar no cálculo de horas. O app gera a lista de compras técnica e calcula o preço final de venda baseado na sua margem de lucro.",
      benefits: [
        { icon: <BookIcon className="w-5 h-5" />, text: "Lista de Materiais (BOM) automática" },
        { icon: <ZapIcon className="w-5 h-5" />, text: "Cálculo de custo de material + mão de obra" },
        { icon: <CheckIcon className="w-5 h-5" />, text: "Sugestão de preço de venda ideal" },
        { icon: <MessageCircleIcon className="w-5 h-5" />, text: "Geração de proposta em PDF" }
      ],
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200"
    }
  ];

  // ... existing testimonials and gallery ...
  const testimonials = [
    {
      text: "Antes eu perdia horas desenhando no papel. Com o MarcenApp, gero o 3D na frente do cliente e fecho a venda na hora!",
      author: "João Ferreira",
      role: "Marceneiro Autônomo"
    },
    {
      text: "A lista de materiais automática me salvou de vários prejuízos. Agora compro exatamente o que preciso.",
      author: "Ricardo Oliveira",
      role: "Dono da Oliveira Móveis"
    },
    {
      text: "O plano de corte no celular é muito prático. Consigo ver como cortar a chapa direto na oficina.",
      author: "Marcos Santos",
      role: "Marcenaria Fina Santos"
    }
  ];

  const galleryImages = [
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1595515106967-14348984f548?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1616594039964-40891f913c53?auto=format&fit=crop&q=80&w=800", 
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800" 
  ];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1622372738946-e215733cb96b?auto=format&fit=crop&q=80&w=800"; 
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#3e3535] font-sans selection:bg-[#d4ac6e] selection:text-[#3e3535]">
      
      {/* Navbar Fixa */}
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-[#fffefb]/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="relative">
               <LogoIcon className="w-10 h-10 text-[#d4ac6e]" />
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#f5f1e8]"></div>
            </div>
            <div className="flex flex-col">
                <span className={`text-xl font-bold tracking-tight leading-none ${scrolled ? 'text-[#3e3535]' : 'text-[#3e3535]'}`}>MarcenApp</span>
                <span className="text-[10px] uppercase tracking-widest text-[#a89d8d] font-bold">Intelligence</span>
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'App', 'Depoimentos'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-[#6a5f5f] hover:text-[#d4ac6e] font-medium transition-colors relative group text-sm uppercase tracking-wide"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#d4ac6e] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
            <button onClick={handleInstallApp} className="bg-[#f0e9dc] border border-[#e6ddcd] text-[#3e3535] px-5 py-2 rounded-full font-bold hover:bg-[#e6ddcd] hover:shadow-md transition-all duration-300 flex items-center gap-2 text-sm">
              <SmartphoneIcon className="w-4 h-4" />
              Baixar App
            </button>
            <button onClick={() => scrollToLogin('login')} className="bg-[#3e3535] text-white px-6 py-2 rounded-full font-bold hover:bg-[#2d2424] transition shadow-lg hover:shadow-xl text-sm">
              Entrar
            </button>
          </div>

          {/* Botão Mobile */}
          <button className="md:hidden text-[#3e3535] p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
          </button>
        </div>

        {/* Menu Mobile Expandido */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-[#fffefb] shadow-lg overflow-hidden transition-all duration-300 ease-in-out border-t border-[#e6ddcd] ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col p-6 gap-4">
            {['Funcionalidades', 'App', 'Depoimentos'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-bold text-[#6a5f5f] hover:text-[#d4ac6e]" onClick={() => setIsMenuOpen(false)}>{item}</a>
            ))}
            <div className="h-px bg-[#e6ddcd] my-2"></div>
            <button onClick={handleInstallApp} className="bg-[#f0e9dc] text-[#3e3535] w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <SmartphoneIcon className="w-5 h-5" /> Baixar App
            </button>
            <button onClick={() => scrollToLogin('login')} className="bg-[#3e3535] text-white w-full py-3 rounded-xl font-bold">Acessar Conta</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="início" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* ... existing hero content ... */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#d4ac6e]/10 rounded-bl-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4ac6e]/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 space-y-8 animate-fadeInUp">
              <div className="inline-flex items-center gap-2 bg-[#fffefb] border border-[#e6ddcd] text-[#3e3535] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm">
                <span className="w-2 h-2 bg-[#d4ac6e] rounded-full animate-pulse"></span>
                NOVO: Crie Móveis com Voz e IA
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-[#3e3535] leading-tight">
                Seus projetos de marcenaria <span className="text-[#d4ac6e] relative inline-block">
                    Prontos
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#d4ac6e] opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                </span> em minutos.
              </h1>
              
              <p className="text-lg text-[#6a5f5f] leading-relaxed max-w-xl border-l-4 border-[#d4ac6e] pl-4">
                Transforme ideias em projetos 3D, gere planos de corte e calcule orçamentos sem complicação. 
                <br/><span className="font-bold text-[#3e3535]">Do rascunho à produção na palma da sua mão.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => scrollToLogin('signup')} className="bg-[#3e3535] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#2d2424] hover:scale-105 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group">
                  <ZapIcon className="w-5 h-5 text-[#d4ac6e]" />
                  Começar Grátis
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({behavior: 'smooth'})} className="bg-transparent border-2 border-[#3e3535]/10 text-[#3e3535] px-8 py-4 rounded-xl font-bold text-lg hover:border-[#d4ac6e] hover:text-[#d4ac6e] transition-all duration-300 flex items-center justify-center gap-2">
                  <PlayCircleIcon className="w-5 h-5" />
                  Ver Ferramentas
                </button>
              </div>
              
              <div className="flex items-center gap-4 pt-4 text-sm text-[#8a7e7e]">
                 <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <img key={i} className="w-8 h-8 rounded-full border-2 border-[#f5f1e8]" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    ))}
                 </div>
                 <p>Junte-se a +2.000 marceneiros</p>
              </div>
            </div>
            
            <div className="md:w-1/2 relative perspective-1000">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform md:rotate-y-12 hover:rotate-y-0 transition-all duration-700 ease-out group border-[6px] border-[#fffefb]">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                <img 
                    src="https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&q=80&w=800" 
                    alt="Marcenaria Moderna" 
                    className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700"
                    onError={handleImageError}
                />
                
                <div className="absolute bottom-6 left-6 right-6 bg-[#fffefb]/90 backdrop-blur p-4 rounded-xl shadow-lg z-20 flex items-center gap-4 animate-fadeInUp">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <ClockIcon />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#8a7e7e] uppercase">Economia de Tempo</p>
                        <p className="font-bold text-[#3e3535]">Projetos 10x mais rápidos</p>
                    </div>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#d4ac6e] rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#3e3535] rounded-full opacity-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ... existing functionality, gallery and testimonials sections ... */}
      <section id="funcionalidades" className="py-24 bg-[#fffefb]">
        {/* Content maintained same as before */}
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#3e3535] mb-4">Ferramentas Poderosas</h2>
            <div className="w-20 h-1.5 bg-[#d4ac6e] mx-auto rounded-full mb-6"></div>
            <p className="text-[#6a5f5f] text-lg">
              Tudo o que você precisa para projetar, orçar e produzir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div 
                key={service.id}
                onClick={() => setSelectedFeature(service)}
                className="bg-[#f5f1e8] p-8 rounded-3xl hover:bg-[#fffefb] border border-transparent hover:border-[#d4ac6e] hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-[#d4ac6e] w-16 h-16 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="mb-6 bg-[#fffefb] w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 border border-[#e6ddcd]">
                  {service.icon}
                </div>
                
                <h3 className="text-xl font-bold text-[#3e3535] mb-3 group-hover:text-[#d4ac6e] transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-[#6a5f5f] leading-relaxed mb-4">
                  {service.shortDesc}
                </p>
                
                <div className="flex items-center gap-2 text-[#d4ac6e] text-sm font-bold group-hover:translate-x-2 transition-transform">
                  Ver Detalhes <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="app" className="py-24 bg-[#3e3535] text-[#f5f1e8] relative overflow-hidden">
        {/* Content maintained same as before */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#d4ac6e 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Resultados Reais</h2>
              <p className="text-[#dcd6c8] text-lg max-w-md">Veja exemplos de projetos criados com a Inteligência Artificial do MarcenApp.</p>
            </div>
            <button className="text-[#d4ac6e] hover:text-white font-bold flex items-center gap-2 group transition-colors border-b border-transparent hover:border-[#d4ac6e] pb-1">
                Ver Galeria Completa <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedImage(img)}
                className={`relative group overflow-hidden rounded-2xl cursor-zoom-in border border-[#4a4040] shadow-2xl ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <img src={img} alt={`Feature ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 min-h-[250px] opacity-90 group-hover:opacity-100" onError={handleImageError}/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2424] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[#d4ac6e] text-xs font-bold uppercase tracking-wider mb-1 block">Projeto {idx + 1}</span>
                  <h3 className="text-xl font-bold text-white">Render 3D</h3>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Maximize2Icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="depoimentos" className="py-24 bg-[#d4ac6e] relative overflow-hidden">
        {/* Content maintained same as before */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#3e3535]/10 to-transparent"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-[#3e3535] mb-16">Marceneiros que aprovam</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#fffefb] p-10 md:p-14 rounded-[2.5rem] shadow-2xl relative">
               <div className="text-6xl text-[#d4ac6e] absolute -top-8 left-10 font-serif">"</div>
               <div className="min-h-[180px] flex flex-col justify-center">
                   <p className="text-xl md:text-2xl text-[#3e3535] font-medium italic leading-relaxed">
                     {testimonials[activeTestimonial].text}
                   </p>
               </div>
               <div className="mt-8 flex items-center justify-center gap-4">
                   <div className="w-14 h-14 bg-[#f5f1e8] rounded-full overflow-hidden border-2 border-[#d4ac6e]">
                       <img src={`https://i.pravatar.cc/150?img=${activeTestimonial + 50}`} alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-left">
                       <h4 className="font-bold text-lg text-[#3e3535] leading-tight">{testimonials[activeTestimonial].author}</h4>
                       <span className="text-[#8a7e7e] text-sm font-medium">{testimonials[activeTestimonial].role}</span>
                   </div>
               </div>
            </div>
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, idx) => (
                <button key={idx} onClick={() => setActiveTestimonial(idx)} className={`h-3 rounded-full transition-all duration-300 ${idx === activeTestimonial ? 'bg-[#3e3535] w-8' : 'bg-[#3e3535]/30 w-3 hover:bg-[#3e3535]/50'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Login Section (Integrated) */}
      <section id="login" ref={loginRef} className="py-24 px-6 bg-[#fffefb]">
          <div className="w-full max-w-lg mx-auto">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-[#3e3535]">
                      {isLoginMode ? 'Acesse sua conta' : 'Comece Agora'}
                  </h2>
                  <p className="text-[#6a5f5f] text-lg mt-2">
                      {isLoginMode ? 'Bem-vindo de volta!' : 'Crie sua conta gratuita e explore o futuro.'}
                  </p>
              </div>
              
              <div className="bg-[#f5f1e8] p-8 rounded-3xl border border-[#e6ddcd] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4ac6e] to-[#b99256]"></div>
                  
                  {/* Toggle Switch */}
                  <div className="flex justify-center mb-8 bg-[#e6ddcd] p-1 rounded-xl">
                      <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? 'bg-[#fffefb] text-[#3e3535] shadow-sm' : 'text-[#8a7e7e] hover:text-[#3e3535]'}`}
                          onClick={() => setIsLoginMode(false)}
                      >
                          Criar Conta
                      </button>
                      <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLoginMode ? 'bg-[#fffefb] text-[#3e3535] shadow-sm' : 'text-[#8a7e7e] hover:text-[#3e3535]'}`}
                          onClick={() => setIsLoginMode(true)}
                      >
                          Já tenho conta
                      </button>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                      {/* Only show extra fields if signing up */}
                      {!isLoginMode && (
                          <>
                              <div className="animate-fadeIn">
                                  <label className="block text-xs font-bold text-[#8a7e7e] uppercase mb-2 tracking-wide">
                                      Eu sou:
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                      <button
                                          type="button"
                                          onClick={() => setAccountType('user')}
                                          className={`py-3 px-3 rounded-xl text-sm font-bold transition border-2 flex flex-col items-center gap-2 ${accountType === 'user' ? 'bg-[#fffefb] border-[#d4ac6e] text-[#3e3535]' : 'bg-[#fffefb] border-transparent text-gray-400 hover:border-[#e6ddcd]'}`}
                                      >
                                          <HammerIcon className="w-5 h-5" /> Marceneiro
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => setAccountType('partner')}
                                          className={`py-3 px-3 rounded-xl text-sm font-bold transition border-2 flex flex-col items-center gap-2 ${accountType === 'partner' ? 'bg-[#fffefb] border-[#3e3535] text-[#3e3535]' : 'bg-[#fffefb] border-transparent text-gray-400 hover:border-[#e6ddcd]'}`}
                                      >
                                          <UsersIcon className="w-5 h-5" /> Sou Parceiro
                                      </button>
                                  </div>
                              </div>

                              <div className="animate-fadeIn">
                                  <label htmlFor="name-landing" className="block text-sm font-bold text-[#3e3535] mb-1">
                                      Nome Completo
                                  </label>
                                  <input
                                      id="name-landing"
                                      name="name"
                                      type="text"
                                      required={!isLoginMode}
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      className="w-full p-3 rounded-xl border-2 border-[#e6ddcd] bg-[#fffefb] text-[#3e3535] focus:outline-none focus:border-[#d4ac6e] transition placeholder:text-[#dcd6c8]"
                                      placeholder="Como gostaria de ser chamado?"
                                  />
                              </div>
                          </>
                      )}

                      <div>
                          <label htmlFor="email-landing" className="block text-sm font-bold text-[#3e3535] mb-1">
                              E-mail {isLoginMode ? '' : 'Profissional'}
                          </label>
                          <div className="relative">
                            <EmailIcon className="absolute left-3 top-3.5 w-5 h-5 text-[#a89d8d]" />
                            <input
                                id="email-landing"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 p-3 rounded-xl border-2 border-[#e6ddcd] bg-[#fffefb] text-[#3e3535] focus:outline-none focus:border-[#d4ac6e] transition placeholder:text-[#dcd6c8]"
                                placeholder="seu@email.com"
                            />
                          </div>
                      </div>
                      
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                            <XIcon className="w-4 h-4" /> {error}
                        </div>
                      )}
                      
                      <div className="pt-2">
                          <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg text-base font-bold text-[#3e3535] bg-[#d4ac6e] hover:bg-[#c89f5e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4ac6e] transition disabled:opacity-70 hover:-translate-y-1"
                          >
                              {isLoading ? <span className="w-5 h-5 border-2 border-[#3e3535] border-t-transparent rounded-full animate-spin"></span> : null}
                              {isLoading 
                                ? (isLoginMode ? 'Entrando...' : 'Criando conta...') 
                                : (isLoginMode ? 'Acessar Sistema' : (accountType === 'partner' ? 'Credenciar Distribuidor' : 'Começar Grátis'))}
                          </button>
                      </div>
                      
                      <p className="text-xs text-center text-[#8a7e7e]">
                          {isLoginMode ? 'Não tem senha. O acesso é liberado via e-mail.' : 'Sem necessidade de cartão de crédito.'}
                      </p>
                  </form>
              </div>
          </div>
      </section>

      {/* ... existing footer and modals ... */}
      {/* Footer */}
      <footer className="bg-[#2d2424] text-[#a89d8d] py-12 border-t border-[#4a4040]">
        {/* ... same content ... */}
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#d4ac6e] rounded-lg flex items-center justify-center text-[#3e3535] shadow-lg">
                    <LogoIcon className="w-6 h-6" />
                </div>
                <div>
                    <span className="text-xl font-bold text-[#f5f1e8] block leading-none">MarcenApp</span>
                    <span className="text-[10px] uppercase text-[#d4ac6e] font-bold tracking-widest">Intelligence</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed opacity-80">
                Transformando a marcenaria tradicional com o poder da inteligência artificial.
              </p>
            </div>
            {/* ... other footer cols ... */}
            <div>
              <h4 className="text-[#f5f1e8] font-bold mb-4 text-sm uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#funcionalidades" className="hover:text-[#d4ac6e] transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-[#d4ac6e] transition-colors">Planos & Preços</a></li>
                <li><a href="#" className="hover:text-[#d4ac6e] transition-colors">Para Parceiros</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#f5f1e8] font-bold mb-4 text-sm uppercase tracking-wider">Contato</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#3e3535] flex items-center justify-center"><PhoneIcon className="w-4 h-4" /></div> 
                    (11) 96122-6754
                </li>
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#3e3535] flex items-center justify-center"><EmailIcon className="w-4 h-4" /></div> 
                    suporte@marcenapp.com
                </li>
                <li className="flex items-center gap-3 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#3e3535] flex items-center justify-center"><MapPinIcon className="w-4 h-4" /></div> 
                    São Paulo, SP
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#f5f1e8] font-bold mb-4 text-sm uppercase tracking-wider">Newsletter</h4>
              <p className="text-xs mb-3 opacity-70">Receba dicas de marcenaria e novidades.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Seu e-mail" className="bg-[#3e3535] border border-[#4a4040] rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-[#d4ac6e] text-white transition" />
                <button className="bg-[#d4ac6e] text-[#3e3535] px-3 rounded-lg hover:bg-[#c89f5e] transition-colors font-bold"><ArrowRightIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#4a4040] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-60">
            <p>&copy; {new Date().getFullYear()} MarcenApp. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-[#2d2424]/80 backdrop-blur-sm" onClick={() => setSelectedFeature(null)}></div>
          <div className="bg-[#fffefb] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-[#e6ddcd] flex flex-col md:flex-row overflow-hidden">
            <button 
              onClick={() => setSelectedFeature(null)} 
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white transition-colors z-30 text-[#3e3535] shadow-sm"
            >
              <XIcon className="w-6 h-6" />
            </button>
            
            <div className="md:w-2/5 h-64 md:h-auto relative">
                <img 
                    src={selectedFeature.image} 
                    alt={selectedFeature.title} 
                    className="w-full h-full object-cover" 
                    onError={handleImageError}
                />
                <div className="absolute inset-0 bg-[#3e3535]/20"></div>
                <div className="absolute bottom-6 left-6 bg-[#fffefb]/90 backdrop-blur p-3 rounded-2xl shadow-lg border border-[#e6ddcd]">
                  {selectedFeature.icon}
                </div>
            </div>

            <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center text-[#3e3535] bg-[#fffefb]">
                <h3 className="text-3xl font-black mb-4">{selectedFeature.title}</h3>
                <p className="text-[#6a5f5f] text-lg mb-8 leading-relaxed">
                  {selectedFeature.fullDesc}
                </p>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {selectedFeature.benefits.map((benefit: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-[#f5f1e8] p-4 rounded-xl border border-[#e6ddcd]">
                      <div className="text-[#d4ac6e] mt-0.5 bg-[#fffefb] p-1 rounded-full shadow-sm">{benefit.icon}</div>
                      <span className="text-sm font-bold text-[#3e3535] mt-0.5">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-auto">
                  <button onClick={() => {setSelectedFeature(null); scrollToLogin('signup');}} className="flex-1 bg-[#d4ac6e] text-[#3e3535] py-3.5 rounded-xl font-bold hover:bg-[#c89f5e] transition-colors shadow-md flex justify-center items-center gap-2 hover:-translate-y-0.5 transform">
                    <ZapIcon className="w-5 h-5" /> Testar Agora
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
            <XIcon className="w-10 h-10" />
          </button>
          <img 
            src={selectedImage} 
            alt="Zoom" 
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border-4 border-[#3e3535]" 
            onClick={(e) => e.stopPropagation()} 
            onError={handleImageError}
          />
          <p className="absolute bottom-8 text-white/70 text-sm">Toque fora para fechar</p>
        </div>
      )}

    </div>
  );
}
