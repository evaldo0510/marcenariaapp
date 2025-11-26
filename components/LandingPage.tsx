
import React, { useState, useEffect, useRef } from 'react';
import { 
  HammerIcon, 
  RulerIcon, 
  ArrowRightIcon, 
  MenuIcon, 
  XIcon, 
  CheckIcon,
  SmartphoneIcon, 
  ZapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalculatorIcon,
  UsersIcon,
  LogoIcon,
  MagicIcon,
  BookIcon,
  StarIcon,
  SparklesIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon
} from './Shared';

interface LandingPageProps {
  onLoginSuccess: (email: string, role?: 'user' | 'partner') => void;
}

// --- COMPONENTE SLIDER ANTES/DEPOIS ---
const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const stopDragging = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[300px] md:h-[500px] rounded-2xl overflow-hidden cursor-col-resize select-none shadow-2xl border-4 border-white group"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={stopDragging}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* Imagem DEPOIS (Fundo) */}
      <img 
        src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1600" 
        alt="Projeto 3D Renderizado" 
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
      />
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold border border-white/20 shadow-lg">
        ✨ Render Iara 3D
      </div>

      {/* Imagem ANTES (Sobreposta com clip-path) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-[#d4ac6e] bg-[#f5f1e8]"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1600" 
          alt="Rascunho no Papel" 
          className="absolute inset-0 w-full h-full object-cover filter sepia contrast-125"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100vw' }} 
          draggable="false"
        />
        <div className="absolute top-4 left-4 bg-white/90 text-[#3e3535] px-4 py-1.5 rounded-full text-xs font-bold border border-[#d4ac6e] shadow-lg">
          ✏️ Rascunho
        </div>
      </div>

      {/* Manipulador (Handle) */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-[#d4ac6e] cursor-col-resize z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-[#d4ac6e] rounded-full flex items-center justify-center shadow-xl border-4 border-white transform transition-transform group-hover:scale-110">
          <div className="flex gap-1">
              <div className="w-0.5 h-4 bg-[#3e3535]/50"></div>
              <div className="w-0.5 h-4 bg-[#3e3535]/50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'partner'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
          if (email.trim() && email.includes('@')) {
              onLoginSuccess(email, isLoginMode ? 'user' : accountType);
          } else {
              setError('Insira um e-mail válido.');
          }
          setIsLoading(false);
      }, 1000);
  };

  const handleInstallApp = () => {
      if (installPrompt) installPrompt.prompt();
      else alert("Use o menu do navegador para instalar o App.");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d2424] font-sans selection:bg-[#d4ac6e] selection:text-white overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#faf9f6]/90 backdrop-blur-xl border-b border-[#e6ddcd] py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-[#2d2424] p-2 rounded-lg text-[#d4ac6e] transition-transform group-hover:rotate-6 shadow-lg">
               <LogoIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#2d2424]">MarcenApp</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-medium hover:text-[#d4ac6e] transition-colors">Recursos</a>
            <a href="#demonstracao" className="text-sm font-medium hover:text-[#d4ac6e] transition-colors">Como Funciona</a>
            <a href="#historias" className="text-sm font-medium hover:text-[#d4ac6e] transition-colors">Histórias</a>
            
            <div className="h-6 w-px bg-[#e6ddcd]"></div>
            
            <button onClick={() => scrollToLogin('login')} className="text-sm font-bold hover:text-[#d4ac6e] transition-colors">
              Entrar
            </button>
            <button onClick={() => scrollToLogin('signup')} className="bg-[#2d2424] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#d4ac6e] hover:text-[#2d2424] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Começar Grátis
            </button>
          </div>

          <button className="md:hidden p-2 text-[#2d2424]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-[#faf9f6] border-b border-[#e6ddcd] overflow-hidden transition-all duration-300 shadow-xl ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 space-y-4">
            <a href="#recursos" className="block text-lg font-bold text-[#2d2424]" onClick={() => setIsMenuOpen(false)}>Recursos</a>
            <a href="#demonstracao" className="block text-lg font-bold text-[#2d2424]" onClick={() => setIsMenuOpen(false)}>Como Funciona</a>
            <div className="h-px bg-[#e6ddcd]"></div>
            <button onClick={() => scrollToLogin('login')} className="block w-full text-left text-lg font-bold py-2 text-[#2d2424]">Entrar</button>
            <button onClick={() => scrollToLogin('signup')} className="block w-full bg-[#2d2424] text-white text-center py-3 rounded-xl font-bold shadow-md">Criar Conta</button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#d4ac6e]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#2d2424]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e6ddcd] rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fadeIn">
                <SparklesIcon className="w-4 h-4 text-[#d4ac6e]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6a5f5f]">Nova IA Generativa 2.5</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-[#2d2424] leading-[1.1] mb-6 animate-fadeInUp">
              Sua Marcenaria,<br />
              <span className="italic text-[#d4ac6e] relative">
                Reimaginada.
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#d4ac6e]/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" /></svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#6a5f5f] max-w-2xl mx-auto leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              Transforme rascunhos em projetos 3D, planos de corte e orçamentos em segundos. 
              A primeira inteligência artificial criada para marceneiros modernos.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <button onClick={() => scrollToLogin('signup')} className="bg-[#2d2424] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#d4ac6e] hover:text-[#2d2424] transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
                <ZapIcon className="w-5 h-5" /> Começar Agora
              </button>
              {installPrompt && (
                <button onClick={handleInstallApp} className="bg-white text-[#2d2424] border border-[#e6ddcd] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#f5f1e8] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                  <SmartphoneIcon className="w-5 h-5" /> Baixar App
                </button>
              )}
            </div>
          </div>

          {/* BENTO GRID HERO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
             {/* Card 1: 3D Render (Large) */}
             <div className="md:col-span-8 bg-white rounded-3xl border border-[#e6ddcd] p-3 shadow-xl overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
                <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-[#2d2424]">
                    <BeforeAfterSlider />
                </div>
             </div>

             {/* Card 2: Stats (Small) */}
             <div className="md:col-span-4 bg-[#2d2424] rounded-3xl p-8 flex flex-col justify-between text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4ac6e] rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-[#d4ac6e] backdrop-blur-sm border border-white/10">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Economia</h3>
                    <p className="text-white/60 text-sm">Média por projeto</p>
                </div>
                <div>
                    <p className="text-5xl font-mono font-bold tracking-tight text-[#d4ac6e]">30%</p>
                    <p className="text-sm text-white/60 mt-2">Menos desperdício de chapas com nosso Nesting AI.</p>
                </div>
             </div>

             {/* Card 3: Mobile (Small) */}
             <div className="md:col-span-4 bg-[#f0e9dc] rounded-3xl p-8 border border-[#d4ac6e]/20 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-serif font-bold text-[#2d2424] mb-2">No seu bolso.</h3>
                <p className="text-[#6a5f5f] text-sm mb-6">Leve o projeto para a obra e apresente no tablet ou celular.</p>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/50 rounded-tl-full"></div>
                <div className="relative z-10 flex items-center gap-2 text-[#2d2424] font-bold text-sm bg-white/80 backdrop-blur px-4 py-2 rounded-lg w-fit shadow-sm border border-white/50">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    Modo Offline
                </div>
             </div>

             {/* Card 4: Features (Medium) */}
             <div className="md:col-span-8 bg-white rounded-3xl border border-[#e6ddcd] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#d4ac6e]/50 transition-colors">
                <div className="space-y-4 flex-1">
                    <h3 className="text-2xl font-serif font-bold text-[#2d2424]">Tudo em um lugar.</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {['Plano de Corte', 'Lista de Compras', 'Orçamento PDF', 'Contrato Legal'].map(item => (
                            <div key={item} className="flex items-center gap-2 text-[#6a5f5f] text-sm bg-[#f5f1e8] px-3 py-2 rounded-lg">
                                <CheckIcon className="w-4 h-4 text-[#d4ac6e]" /> {item}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-20 h-24 bg-[#2d2424] rounded-xl shadow-lg transform -rotate-6 flex items-center justify-center border border-[#4a4040] text-[#d4ac6e]">
                        <DocumentTextIcon className="w-8 h-8" />
                    </div>
                    <div className="w-20 h-24 bg-[#d4ac6e] rounded-xl shadow-lg transform rotate-6 flex items-center justify-center text-[#2d2424] border border-[#b99256]">
                        <CalculatorIcon className="w-8 h-8" />
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- TRUST MARQUEE --- */}
      <section className="py-10 border-y border-[#e6ddcd] bg-white overflow-hidden">
        <div className="container mx-auto px-6 mb-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a89d8d]">Compatível com materiais das melhores redes</p>
        </div>
        <div className="flex w-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
            <div className="flex animate-scroll gap-16 min-w-full justify-around items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-2xl font-black text-[#3e3535]">LEO MADEIRAS</span>
                <span className="text-2xl font-black text-[#3e3535]">DURATEX</span>
                <span className="text-2xl font-black text-[#3e3535]">GMAD</span>
                <span className="text-2xl font-black text-[#3e3535]">ARAUCO</span>
                <span className="text-2xl font-black text-[#3e3535]">GUARARAPES</span>
                <span className="text-2xl font-black text-[#3e3535]">GASÔMETRO</span>
                {/* Duplicate for infinite loop illusion */}
                <span className="text-2xl font-black text-[#3e3535]">LEO MADEIRAS</span>
                <span className="text-2xl font-black text-[#3e3535]">DURATEX</span>
                <span className="text-2xl font-black text-[#3e3535]">GMAD</span>
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="demonstracao" className="py-24 bg-[#faf9f6]">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-16 items-center">
                <div className="md:w-1/2 space-y-8">
                    <div className="inline-block bg-[#d4ac6e]/10 text-[#b99256] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Tecnologia Iara Vision</div>
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-[#2d2424] leading-tight">
                        Do papel para a realidade em <span className="text-[#d4ac6e]">segundos</span>.
                    </h2>
                    <p className="text-[#6a5f5f] text-lg leading-relaxed">
                        Não sabe usar programas CAD complexos? Sem problemas. Tire uma foto do seu rascunho ou do ambiente vazio, fale o que você quer, e nossa IA faz o resto.
                    </p>
                    
                    <div className="space-y-6">
                        {[
                            { icon: <MagicIcon className="w-6 h-6" />, title: "Interpretação Inteligente", desc: "Reconhece paredes, medidas e anotações manuscritas automaticamente." },
                            { icon: <BookIcon className="w-6 h-6" />, title: "Catálogo Real", desc: "Aplica texturas de MDF e materiais disponíveis no mercado brasileiro." },
                            { icon: <RulerIcon className="w-6 h-6" />, title: "Precisão Técnica", desc: "Gera plantas baixas respeitando normas de arquitetura." }
                        ].map((feat, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-[#e6ddcd]">
                                <div className="w-12 h-12 bg-white border border-[#e6ddcd] rounded-full flex items-center justify-center text-[#d4ac6e] shadow-sm shrink-0">
                                    {feat.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#2d2424] text-lg">{feat.title}</h4>
                                    <p className="text-sm text-[#6a5f5f] leading-relaxed">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="md:w-1/2 w-full relative">
                    <div className="absolute -inset-4 bg-[#d4ac6e]/20 rounded-[2.5rem] rotate-3 blur-lg"></div>
                    <div className="relative bg-white p-3 rounded-[2rem] shadow-2xl border border-[#e6ddcd]">
                        <img 
                            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1600" 
                            alt="Interface App" 
                            className="w-full rounded-[1.5rem]"
                        />
                        
                        {/* Floating Cards */}
                        <div className="absolute -left-6 top-20 bg-[#2d2424] text-white p-4 rounded-xl shadow-xl border border-[#4a4040] animate-bounce" style={{ animationDuration: '3s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"><CheckIcon className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-gray-400">Status</p>
                                    <p className="font-bold">Projeto Gerado</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -right-6 bottom-20 bg-white text-[#2d2424] p-4 rounded-xl shadow-xl border border-[#e6ddcd] animate-bounce" style={{ animationDuration: '4s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#d4ac6e] rounded-full flex items-center justify-center"><ZapIcon className="w-6 h-6 text-white" /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Tempo</p>
                                    <p className="font-bold">12 Segundos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="historias" className="py-24 bg-[#2d2424] text-[#f5f1e8] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10"></div>
        
        <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-serif mb-6">De Marceneiro para Marceneiro</h2>
                <p className="text-[#a89d8d] text-lg">
                    Veja como profissionais de todo o Brasil estão modernizando suas oficinas e fechando mais contratos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        name: "Ricardo Silva",
                        role: "Marcenaria RS - SP",
                        text: "O MarcenApp mudou a forma como vendo. O cliente fecha na hora quando vê o 3D no tablet. Antes eu demorava dias desenhando.",
                        image: "https://randomuser.me/api/portraits/men/32.jpg"
                    },
                    {
                        name: "Ana Beatriz",
                        role: "Designer de Interiores - RJ",
                        text: "A precisão do plano de corte é incrível. Economizo pelo menos 20% de material em cada obra. O sistema se pagou na primeira semana.",
                        image: "https://randomuser.me/api/portraits/women/44.jpg"
                    },
                    {
                        name: "Carlos Mendes",
                        role: "Móveis Planejados - MG",
                        text: "Eu tinha dificuldade em orçar a mão de obra corretamente. A calculadora do app me deu clareza e agora sei exatamente meu lucro.",
                        image: "https://randomuser.me/api/portraits/men/67.jpg"
                    }
                ].map((test, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors relative">
                        <div className="text-[#d4ac6e] text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
                        <p className="text-gray-300 italic mb-6 relative z-10">{test.text}</p>
                        <div className="flex items-center gap-4">
                            <img src={test.image} alt={test.name} className="w-12 h-12 rounded-full border-2 border-[#d4ac6e]" />
                            <div>
                                <h4 className="font-bold text-[#f5f1e8]">{test.name}</h4>
                                <p className="text-xs text-[#d4ac6e]">{test.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- LOGIN / SIGNUP SECTION --- */}
      <section id="acesso" ref={loginRef} className="py-24 bg-[#fffefb]">
        <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto bg-[#f5f1e8] rounded-[3rem] overflow-hidden shadow-2xl border border-[#e6ddcd] flex flex-col md:flex-row relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4ac6e]/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Form Side */}
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center relative z-10">
                    <div className="mb-8">
                        <h3 className="text-3xl font-serif font-bold text-[#2d2424] mb-2">
                            {isLoginMode ? 'Bem-vindo de volta' : 'Comece a usar agora'}
                        </h3>
                        <p className="text-[#6a5f5f]">
                            {isLoginMode ? 'Acesse seus projetos e orçamentos.' : 'Teste grátis por 7 dias. Sem cartão de crédito.'}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className="bg-[#e6ddcd] p-1.5 rounded-xl flex mb-8 shadow-inner">
                        <button 
                            onClick={() => setIsLoginMode(false)}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? 'bg-white text-[#2d2424] shadow-md' : 'text-[#6a5f5f] hover:text-[#2d2424]'}`}
                        >
                            Criar Conta
                        </button>
                        <button 
                            onClick={() => setIsLoginMode(true)}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLoginMode ? 'bg-white text-[#2d2424] shadow-md' : 'text-[#6a5f5f] hover:text-[#2d2424]'}`}
                        >
                            Entrar
                        </button>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        {!isLoginMode && (
                            <div>
                                <label className="block text-xs font-bold uppercase text-[#8a7e7e] mb-1.5 ml-1">Seu Nome</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full p-3.5 pl-4 rounded-xl border border-[#e6ddcd] bg-white focus:border-[#d4ac6e] focus:ring-2 focus:ring-[#d4ac6e]/20 outline-none transition"
                                        placeholder="João Silva"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold uppercase text-[#8a7e7e] mb-1.5 ml-1">E-mail Profissional</label>
                            <input 
                                type="email" 
                                className="w-full p-3.5 pl-4 rounded-xl border border-[#e6ddcd] bg-white focus:border-[#d4ac6e] focus:ring-2 focus:ring-[#d4ac6e]/20 outline-none transition"
                                placeholder="contato@marcenaria.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        {!isLoginMode && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button type="button" onClick={() => setAccountType('user')} className={`p-4 rounded-xl border-2 text-sm font-bold transition flex flex-col items-center gap-2 ${accountType === 'user' ? 'border-[#d4ac6e] bg-white text-[#2d2424] shadow-sm' : 'border-transparent bg-[#e6ddcd]/50 text-gray-500 hover:bg-[#e6ddcd]'}`}>
                                    <HammerIcon className={`w-6 h-6 ${accountType === 'user' ? 'text-[#d4ac6e]' : 'text-gray-400'}`} /> Sou Marceneiro
                                </button>
                                <button type="button" onClick={() => setAccountType('partner')} className={`p-4 rounded-xl border-2 text-sm font-bold transition flex flex-col items-center gap-2 ${accountType === 'partner' ? 'border-[#2d2424] bg-white text-[#2d2424] shadow-sm' : 'border-transparent bg-[#e6ddcd]/50 text-gray-500 hover:bg-[#e6ddcd]'}`}>
                                    <UsersIcon className={`w-6 h-6 ${accountType === 'partner' ? 'text-[#2d2424]' : 'text-gray-400'}`} /> Sou Lojista
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#2d2424] text-white font-bold py-4 rounded-xl hover:bg-[#d4ac6e] hover:text-[#2d2424] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isLoading ? 'Processando...' : (isLoginMode ? 'Acessar Sistema' : 'Criar Conta Grátis')} <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* Image Side */}
                <div className="md:w-1/2 bg-[#2d2424] relative overflow-hidden min-h-[300px] md:min-h-auto">
                    <img 
                        src="https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=1200" 
                        alt="Marcenaria Moderna" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2d2424] via-[#2d2424]/40 to-transparent"></div>
                    
                    <div className="absolute bottom-10 left-10 right-10 text-white">
                        <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-5 h-5 text-[#d4ac6e] fill-current" />)}
                        </div>
                        <p className="text-xl italic font-serif font-medium leading-relaxed text-[#f5f1e8]/90">"A organização que o MarcenApp trouxe para minha oficina é impagável. Hoje consigo pegar 3x mais projetos."</p>
                        <div className="mt-6 border-l-4 border-[#d4ac6e] pl-4">
                            <p className="font-bold text-lg">Roberto Almeida</p>
                            <p className="text-sm text-[#d4ac6e]">Móveis Planejados Almeida</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#fffefb] border-t border-[#e6ddcd] pt-16 pb-8">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-1">
                    <div className="inline-flex items-center gap-2 mb-4 text-[#2d2424]">
                        <LogoIcon className="w-8 h-8 text-[#d4ac6e]" />
                        <span className="font-serif font-bold text-2xl">MarcenApp</span>
                    </div>
                    <p className="text-[#6a5f5f] text-sm leading-relaxed mb-6">
                        A plataforma definitiva para marceneiros que querem projetar, vender e produzir com inteligência artificial.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="p-2 bg-[#f5f1e8] rounded-full text-[#2d2424] hover:bg-[#d4ac6e] transition"><InstagramIcon className="w-5 h-5" /></a>
                        <a href="#" className="p-2 bg-[#f5f1e8] rounded-full text-[#2d2424] hover:bg-[#d4ac6e] transition"><FacebookIcon className="w-5 h-5" /></a>
                        <a href="#" className="p-2 bg-[#f5f1e8] rounded-full text-[#2d2424] hover:bg-[#d4ac6e] transition"><LinkedinIcon className="w-5 h-5" /></a>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold text-[#2d2424] mb-4">Produto</h4>
                    <ul className="space-y-2 text-sm text-[#6a5f5f]">
                        <li><a href="#" className="hover:text-[#d4ac6e]">Projeto 3D</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Plano de Corte</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Orçamentos</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Gestão Financeira</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-[#2d2424] mb-4">Empresa</h4>
                    <ul className="space-y-2 text-sm text-[#6a5f5f]">
                        <li><a href="#" className="hover:text-[#d4ac6e]">Sobre Nós</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Seja Parceiro</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Blog</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Carreiras</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-[#2d2424] mb-4">Suporte</h4>
                    <ul className="space-y-2 text-sm text-[#6a5f5f]">
                        <li><a href="#" className="hover:text-[#d4ac6e]">Central de Ajuda</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Tutoriais</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Contato</a></li>
                        <li><a href="#" className="hover:text-[#d4ac6e]">Status do Sistema</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-[#e6ddcd] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-[#a89d8d]">
                    &copy; {new Date().getFullYear()} MarcenApp Intelligence. Todos os direitos reservados.
                </p>
                <div className="flex gap-6 text-xs text-[#6a5f5f] font-medium">
                    <a href="#" className="hover:text-[#d4ac6e]">Termos de Uso</a>
                    <a href="#" className="hover:text-[#d4ac6e]">Privacidade</a>
                </div>
            </div>
        </div>
      </footer>

    </div>
  );
};
