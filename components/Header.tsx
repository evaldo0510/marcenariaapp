
import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, UserIcon, SearchIcon, HeadsetIcon, StoreIcon, HistoryIcon, LogoutIcon, InfoIcon, UsersIcon, SunIcon, MoonIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, ChartBarIcon, BellIcon, WalletIcon, MagicIcon, CogIcon, ShieldIcon, EmailIcon } from './Shared';

interface HeaderProps {
    userEmail: string;
    isAdmin: boolean; // "Business" level or higher
    isPartner: boolean; // Specific for partner portal
    isCarpenter: boolean; // Specific for carpentry tools
    isStoreOwner: boolean; // Specific for store mode (currently restricted)
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
    onOpenAR: () => void;
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onOpenManagement: () => void;
    onOpenPartnerPortal: () => void;
    onOpenNotifications: () => void;
    onOpenWallet: () => void;
    onOpenProjectGenerator: () => void;
    onOpenStoreMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    userEmail, isAdmin, isPartner, isCarpenter, isStoreOwner,
    onOpenResearch, onOpenLive, onOpenDistributors, onOpenClients, onOpenHistory, onOpenAbout, onOpenBomGenerator, onOpenCuttingPlanGenerator, onOpenCostEstimator, onOpenWhatsapp, onOpenAutoPurchase, onOpenEmployeeManagement, onOpenLearningHub, onOpenEncontraPro, onOpenAR, onLogout, theme, setTheme, onOpenManagement, onOpenPartnerPortal, onOpenNotifications, onOpenWallet, onOpenProjectGenerator, onOpenStoreMode 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = userEmail === 'evaldo0510@gmail.com';

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

    const handleOpenApiKey = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setIsMenuOpen(false);
        }
    }

    const handleEmailSupport = () => {
        window.location.href = 'mailto:suporte@marcenapp.com?subject=MarcenApp - Suporte';
    }
    
    return (
        <header className="bg-[#f5f1e8]/95 dark:bg-[#2d2424]/95 backdrop-blur-sm sticky top-0 z-30 border-b border-[#e6ddcd] dark:border-[#4a4040]">
            <div className="max-w-7xl mx-auto px-4 sm:p-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Left side: Brand */}
                    <div className="flex items-center gap-3">
                        <LogoIcon className="text-[#3e3535] dark:text-[#f5f1e8] w-6 h-6 md:w-7 md:h-7" />
                        <h1 className="text-xl md:text-2xl font-semibold text-[#3e3535] dark:text-[#f5f1e8] tracking-tight">MarcenApp</h1>
                    </div>
                    
                    {/* Right side: Actions & User */}
                    <div className="flex items-center gap-2">
                        {/* Action icons hidden on small screens */}
                        <nav className="hidden md:flex items-center gap-2">
                            
                            {/* Partner Shortcuts */}
                            {isPartner && (
                                <>
                                    <button onClick={onOpenNotifications} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors relative" title="Notificações">
                                        <BellIcon />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>
                                    <button onClick={onOpenWallet} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" title="Minha Carteira">
                                        <WalletIcon />
                                    </button>
                                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    <button onClick={onOpenPartnerPortal} className="flex items-center gap-2 bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] transition shadow-sm text-sm">
                                        <UsersIcon className="w-4 h-4"/> Portal Parceiro
                                    </button>
                                </>
                            )}

                            {/* Carpenter / Store Shortcuts */}
                            {isCarpenter && (
                                <>
                                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    {isStoreOwner && (
                                        <button onClick={onOpenStoreMode} className="flex items-center gap-2 bg-[#3e3535] dark:bg-[#f5f1e8] text-white dark:text-[#3e3535] font-bold py-2 px-3 rounded-lg hover:opacity-90 transition shadow-sm text-sm" title="Mudar para modo Loja de Móveis">
                                            <StoreIcon className="w-4 h-4"/> Modo Loja
                                        </button>
                                    )}
                                    <button onClick={onOpenProjectGenerator} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition shadow-sm text-sm">
                                        <MagicIcon className="w-4 h-4"/> Criar com IA
                                    </button>
                                    <button onClick={onOpenManagement} className="flex items-center gap-2 bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] transition shadow-sm text-sm">
                                        <ChartBarIcon className="w-4 h-4"/> Gestão
                                    </button>
                                </>
                            )}
                            
                            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                            <button onClick={onOpenResearch} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Pesquisar com Iara">
                                <SearchIcon />
                            </button>
                            <button onClick={onOpenLive} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Conversar com Iara (Voz)">
                                <HeadsetIcon />
                            </button>
                            <button onClick={handleEmailSupport} className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] hover:text-[#3e3535] dark:hover:text-[#f5f1e8] transition-colors" title="Suporte via E-mail">
                                <EmailIcon />
                            </button>
                        </nav>
                        
                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-[#e6ddcd] dark:bg-[#4a4040] py-1.5 px-3 md:py-2 md:px-3 rounded-full hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition-colors">
                                <UserIcon className="w-5 h-5 text-[#3e3535] dark:text-[#f5f1e8]" />
                                <span className="hidden sm:inline text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8]">{userEmail.split('@')[0]}</span>
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-72 md:w-64 bg-[#fffefb] dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#4a4040] rounded-lg shadow-xl p-2 z-50 animate-scaleIn max-h-[80vh] overflow-y-auto custom-scrollbar" style={{transformOrigin: 'top right'}}>
                                    <div className="px-3 py-2">
                                        <p className="text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8] truncate">{userEmail}</p>
                                        {isSuperAdmin && <p className="text-xs text-red-600 font-bold flex items-center gap-1"><ShieldIcon className="w-3 h-3"/> Super Admin</p>}
                                        {!isSuperAdmin && isPartner && <p className="text-xs text-green-600 dark:text-green-400 font-bold">Parceiro</p>}
                                    </div>
                                    <div className="my-2 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    
                                    {isSuperAdmin && (
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 mb-2">
                                            <ShieldIcon /> Painel Super Admin
                                        </button>
                                    )}

                                    {/* Mobile Only Main Buttons */}
                                    {isCarpenter && (
                                        <>
                                            {isStoreOwner && (
                                                <button onClick={() => {onOpenStoreMode(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-white bg-[#3e3535] dark:bg-[#f5f1e8] dark:text-[#3e3535] hover:opacity-90 mb-1 md:hidden"><StoreIcon /> Modo Loja</button>
                                            )}
                                            <button onClick={() => {onOpenProjectGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 mb-2 md:hidden"><MagicIcon /> Criar com IA</button>
                                            <button onClick={() => {onOpenManagement(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-[#3e3535] dark:text-[#f5f1e8] bg-[#f0e9dc] dark:bg-[#2d2424] hover:bg-[#e6ddcd] mb-1 md:hidden"><ChartBarIcon /> Dashboard Gestão</button>
                                        </>
                                    )}

                                    {isPartner && (
                                        <>
                                            <button onClick={() => {onOpenPartnerPortal(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-[#3e3535] dark:text-[#f5f1e8] bg-[#d4ac6e] hover:bg-[#c89f5e] mb-2 md:hidden"><UsersIcon /> Portal do Parceiro</button>
                                            <nav className="flex flex-col gap-1 md:hidden">
                                                <button onClick={() => {onOpenNotifications(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><BellIcon /> Notificações</button>
                                                <button onClick={() => {onOpenWallet(); setIsMenuOpen(false);}} className="flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><WalletIcon /> Carteira</button>
                                            </nav>
                                        </>
                                    )}

                                    {isCarpenter && (
                                        <>
                                            <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                            <button onClick={() => {onOpenHistory(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><HistoryIcon /> Histórico de Projetos</button>
                                            <button onClick={() => {onOpenClients(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><UsersIcon /> Clientes</button>
                                            <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                            <div className="text-sm px-3 py-2 text-[#6a5f5f] dark:text-[#c7bca9]">
                                                <strong>Ferramentas</strong>
                                            </div>
                                            <button onClick={() => {onOpenBomGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><BookIcon /> Gerador de BOM</button>
                                            <button onClick={() => {onOpenCuttingPlanGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><ToolsIcon /> Plano de Corte</button>
                                            <button onClick={() => {onOpenCostEstimator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><CurrencyDollarIcon /> Estimativa de Custos</button>
                                        </>
                                    )}

                                    {/* Mobile shortcuts for header tools */}
                                    <div className="md:hidden border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                    <button onClick={() => {onOpenResearch(); setIsMenuOpen(false);}} className="md:hidden w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><SearchIcon /> Pesquisar com Iara</button>
                                    <button onClick={() => {onOpenLive(); setIsMenuOpen(false);}} className="md:hidden w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><HeadsetIcon /> Conversa de Voz</button>

                                    <div className="my-1 h-px bg-[#e6ddcd] dark:bg-[#5a4f4f]"></div>
                                    <button onClick={handleOpenApiKey} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]">
                                        <CogIcon /> Configurar Chave API
                                    </button>
                                    <button onClick={handleThemeToggle} className="w-full flex items-center justify-between px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]">
                                        <span className="flex items-center gap-3">{theme === 'light' ? <MoonIcon /> : <SunIcon />} Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
                                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#d4ac6e]' : 'bg-[#dcd6c8]'}`}>
                                            <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                    </button>
                                    <button onClick={() => {onOpenAbout(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><InfoIcon /> Sobre</button>
                                    <button onClick={handleEmailSupport} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535]"><EmailIcon /> Suporte</button>
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
