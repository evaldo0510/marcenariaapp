import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, UserIcon, SearchIcon, HeadsetIcon, StoreIcon, HistoryIcon, LogoutIcon, InfoIcon, UsersIcon, SunIcon, MoonIcon, CheckIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, WhatsappIcon, CommunityIcon, ProIcon } from './Shared';

interface HeaderProps {
    userEmail: string;
    isAdmin: boolean;
    onOpenResearch: () => void;
    onOpenLive: () => void;
    onOpenDistributors: () => void;
    onOpenClients: () => void;
    onOpenHistory: () => void;
    onOpenAbout: () => void;
    onOpenBomGenerator: () => void;
    onOpenCuttingPlanGenerator: () => void;
    onOpenCostEstimator: () => void;
    onOpenWhatsapp: () => void;
    onOpenAutoPurchase: () => void;
    onOpenEmployeeManagement: () => void;
    onOpenLearningHub: () => void;
    onOpenEncontraPro: () => void;
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, isAdmin, onOpenResearch, onOpenLive, onOpenDistributors, onOpenClients, onOpenHistory, onOpenAbout, onOpenBomGenerator, onOpenCuttingPlanGenerator, onOpenCostEstimator, onOpenWhatsapp, onOpenAutoPurchase, onOpenEmployeeManagement, onOpenLearningHub, onOpenEncontraPro, onLogout, theme, setTheme }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleThemeToggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    
    return (
        <header className="bg-[#f5f1e8]/80 dark:bg-[#2d2424]/80 backdrop-blur-sm sticky top-0 z-30 border-b border-[#e6ddcd] dark:border-[#4a4040]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Left side: Brand */}
                    <div className="flex items-center gap-3">
                        <LogoIcon className="text-[#3e3535] dark:text-[#f5f1e8]" />
                        <h1 className="text-2xl font-semibold text-[#3e3535] dark:text-[#f5f1e8] tracking-tight">MarcenApp</h1>
                    </div>
                    
                    {/* Right side: Actions & User */}
                    <div className="flex items-center gap-2">
                        {/* Action icons hidden on small screens */}
                        <nav className="hidden md:flex items-center gap-2">
                                <button onClick={onOpenEncontraPro} className="p-2 rounded-full text-indigo-500 hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="EncontraPro - Marketplace">
                                    <ProIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onOpenWhatsapp} className="p-2 rounded-full text-green-500 hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="Integração WhatsApp (Beta)">
                                    <WhatsappIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onOpenAutoPurchase} className="p-2 rounded-full text-blue-500 hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="Compra Automática (Beta)">
                                    <StoreIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onOpenEmployeeManagement} className="p-2 rounded-full text-yellow-500 hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="Gestão de Funcionários (Beta)">
                                    <UsersIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onOpenLearningHub} className="p-2 rounded-full text-purple-500 hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="Hub de Aprendizagem">
                                    <CommunityIcon className="w-5 h-5" />
                                </button>
                                <div className="w-px h-6 bg-[#e6ddcd] dark:border-[#4a4040] mx-2"></div>
                            <button onClick={onOpenResearch} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Pesquisar com Iara">
                                <SearchIcon />
                            </button>
                            <button onClick={onOpenLive} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Conversar com Iara (Voz)">
                                <HeadsetIcon />
                            </button>
                             <button onClick={onOpenDistributors} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Encontrar Distribuidores">
                                <StoreIcon />
                            </button>
                        </nav>
                        
                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-[#e6ddcd] dark:bg-[#4a4040] py-2 px-3 rounded-full hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition-colors">
                                <UserIcon className="w-5 h-5 text-[#3e3535] dark:text-[#f5f1e8]" />
                                <span className="hidden sm:inline text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8]">{userEmail.split('@')[0]}</span>
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-[#fffefb] dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#4a4040] rounded-lg shadow-xl p-2 z-10 animate-scaleIn" style={{transformOrigin: 'top right'}}>
                                    <div className="px-3 py-2">
                                        <p className="text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8] truncate">{userEmail}</p>
                                        {isAdmin && <p className="text-xs text-green-600 dark:text-green-400 font-bold">Acesso Antecipado Ativo</p>}
                                    </div>
                                    <div className="my-2 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    <nav className="flex flex-col gap-1 md:hidden">
                                            <button onClick={() => {onOpenEncontraPro(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><ProIcon /> EncontraPro</button>
                                            <button onClick={() => {onOpenWhatsapp(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><WhatsappIcon /> WhatsApp (Beta)</button>
                                            <button onClick={() => {onOpenAutoPurchase(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><StoreIcon /> Compras (Beta)</button>
                                            <button onClick={() => {onOpenEmployeeManagement(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><UsersIcon /> Equipe (Beta)</button>
                                            <button onClick={() => {onOpenLearningHub(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><CommunityIcon /> Hub de Aprendizagem</button>
                                        <button onClick={() => {onOpenResearch(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><SearchIcon /> Pesquisar com Iara</button>
                                        <button onClick={() => {onOpenLive(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><HeadsetIcon /> Conversar com Iara</button>
                                        <button onClick={() => {onOpenDistributors(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><StoreIcon /> Distribuidores</button>
                                        <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    </nav>
                                    <button onClick={() => {onOpenHistory(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><HistoryIcon /> Histórico de Projetos</button>
                                    <button onClick={() => {onOpenClients(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><UsersIcon /> Clientes</button>
                                    <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    <div className="text-sm px-3 py-2 text-[#6a5f5f] dark:text-[#c7bca9]">
                                        <strong>Ferramentas Autônomas</strong>
                                    </div>
                                    <button onClick={() => {onOpenBomGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><BookIcon /> Gerador de BOM</button>
                                    <button onClick={() => {onOpenCuttingPlanGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><ToolsIcon /> Plano de Corte</button>
                                    <button onClick={() => {onOpenCostEstimator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><CurrencyDollarIcon /> Estimativa de Custos</button>
                                    <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    <button onClick={handleThemeToggle} className="w-full flex items-center justify-between px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]">
                                        <span className="flex items-center gap-3">{theme === 'light' ? <MoonIcon /> : <SunIcon />} Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
                                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#d4ac6e]' : 'bg-[#dcd6c8]'}`}>
                                            <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                    </button>
                                    <button onClick={() => {onOpenAbout(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><InfoIcon /> Sobre</button>
                                    <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"><LogoutIcon /> Sair</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};