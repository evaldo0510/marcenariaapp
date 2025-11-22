
import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, UserIcon, SearchIcon, HeadsetIcon, StoreIcon, HistoryIcon, LogoutIcon, InfoIcon, UsersIcon, SunIcon, MoonIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, ChartBarIcon, BellIcon, WalletIcon, MagicIcon, CogIcon, ShieldIcon, EmailIcon, DownloadIcon, ShareIcon, WhatsappIcon, CopyIcon, CheckIcon, ClipboardListIcon, LinkIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface HeaderProps {
    userEmail: string;
    isAdmin: boolean;
    isPartner: boolean;
    isCarpenter: boolean;
    isStoreOwner: boolean;
    currentProject?: ProjectHistoryItem | null;
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
    userEmail, isAdmin, isPartner, isCarpenter, isStoreOwner, currentProject,
    onOpenResearch, onOpenLive, onOpenDistributors, onOpenClients, onOpenHistory, onOpenAbout, onOpenBomGenerator, onOpenCuttingPlanGenerator, onOpenCostEstimator, onOpenWhatsapp, onOpenAutoPurchase, onOpenEmployeeManagement, onOpenLearningHub, onOpenEncontraPro, onOpenAR, onLogout, theme, setTheme, onOpenManagement, onOpenPartnerPortal, onOpenNotifications, onOpenWallet, onOpenProjectGenerator, onOpenStoreMode 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const quickMenuRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = userEmail === 'evaldo0510@gmail.com';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
                setIsShareOpen(false);
            }
            if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
                setIsQuickMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
        setIsMenuOpen(false);
    };

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
        setIsQuickMenuOpen(false);
    }

    // --- SHARE LOGIC ---
    const projectLink = currentProject ? `https://marcenapp.com/p/${currentProject.id}` : '';
    const projectName = currentProject?.name || 'Meu Projeto';

    const handleWhatsappShare = () => {
        if (!currentProject) return;
        const text = encodeURIComponent(`Confira o projeto "${projectName}" que criei no MarcenApp: ${projectLink}`);
        window.open(`whatsapp://send?text=${text}`, '_blank');
        setIsShareOpen(false);
    };

    const handleEmailShare = () => {
        if (!currentProject) return;
        const subject = encodeURIComponent(`Projeto MarcenApp: ${projectName}`);
        const body = encodeURIComponent(`Veja o projeto aqui: ${projectLink}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setIsShareOpen(false);
    };

    const handleCopyLink = () => {
        if (!currentProject) return;
        navigator.clipboard.writeText(projectLink);
        setCopyFeedback('Link Copiado!');
        setTimeout(() => {
            setCopyFeedback(null);
            setIsShareOpen(false);
        }, 2000);
    };
    
    return (
        <header className="bg-[#2d2424] backdrop-blur-md sticky top-0 z-30 border-b border-[#4a4040] shadow-lg transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Left side: Brand */}
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                            <LogoIcon className="text-[#d4ac6e] w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#f5f1e8] tracking-tight font-serif group-hover:text-[#d4ac6e] transition-colors">MarcenApp</h1>
                    </div>
                    
                    {/* Right side: Actions & User */}
                    <div className="flex items-center gap-3 md:gap-6">
                        {/* Action icons */}
                        <nav className="hidden md:flex items-center gap-3">
                            
                            {/* Partner Shortcuts */}
                            {isPartner && (
                                <div className="flex items-center gap-3 mr-2 border-r border-[#4a4040] pr-4">
                                    <button onClick={onOpenNotifications} className="p-2 rounded-full text-[#e6ddcd] hover:bg-[#3e3535] hover:text-[#d4ac6e] transition-all duration-200 relative" title="Notificações">
                                        <BellIcon className="w-6 h-6" />
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#2d2424]"></span>
                                    </button>
                                    <button onClick={onOpenWallet} className="p-2 rounded-full text-[#e6ddcd] hover:bg-[#3e3535] hover:text-[#d4ac6e] transition-all duration-200" title="Minha Carteira">
                                        <WalletIcon className="w-6 h-6" />
                                    </button>
                                    <button onClick={onOpenPartnerPortal} className="flex items-center gap-2 bg-[#d4ac6e] text-[#2d2424] font-bold py-1.5 px-4 rounded-lg hover:bg-[#c89f5e] hover:shadow-md transition-all duration-200 text-sm">
                                        <UsersIcon className="w-4 h-4"/> Portal
                                    </button>
                                </div>
                            )}

                            {/* Carpenter / Store Shortcuts */}
                            {isCarpenter && (
                                <div className="flex items-center gap-3">
                                    {isStoreOwner && (
                                        <button onClick={onOpenStoreMode} className="flex items-center gap-2 bg-[#3e3535] text-[#e6ddcd] border border-[#4a4040] font-bold py-1.5 px-4 rounded-lg hover:bg-[#4a4040] hover:border-[#d4ac6e] hover:text-[#d4ac6e] transition-all duration-200 shadow-sm text-sm" title="Mudar para modo Loja de Móveis">
                                            <StoreIcon className="w-4 h-4"/> Loja
                                        </button>
                                    )}
                                    <button onClick={onOpenProjectGenerator} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-1.5 px-4 rounded-lg hover:opacity-90 hover:shadow-lg transition-all duration-200 shadow-md text-sm transform hover:-translate-y-0.5">
                                        <MagicIcon className="w-4 h-4"/> Criar
                                    </button>
                                    <button onClick={onOpenManagement} className="flex items-center gap-2 bg-[#d4ac6e] text-[#2d2424] font-bold py-1.5 px-4 rounded-lg hover:bg-[#c89f5e] hover:shadow-md transition-all duration-200 shadow-sm text-sm">
                                        <ChartBarIcon className="w-4 h-4"/> Gestão
                                    </button>
                                </div>
                            )}
                            
                            {installPrompt && (
                                <button onClick={handleInstallClick} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all duration-200 animate-pulse" title="Instalar Aplicativo">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            )}

                            <button onClick={onOpenLive} className="p-2 rounded-full text-[#e6ddcd] hover:bg-[#3e3535] hover:text-[#d4ac6e] transition-all duration-200 hover:scale-110" title="Conversar com Iara (Voz)">
                                <HeadsetIcon className="w-6 h-6" />
                            </button>

                            {/* Direct Contact Button */}
                            <button onClick={handleEmailSupport} className="p-2 rounded-full text-[#e6ddcd] hover:bg-[#3e3535] hover:text-[#d4ac6e] transition-all duration-200" title="Suporte via E-mail">
                                <EmailIcon className="w-6 h-6" />
                            </button>
                            
                            {/* Quick Menu Dropdown */}
                            <div className="relative" ref={quickMenuRef}>
                                <button 
                                    onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
                                    className="flex items-center gap-2 p-2 rounded-full text-[#e6ddcd] hover:bg-[#3e3535] hover:text-[#d4ac6e] transition-all duration-200"
                                    title="Menu Rápido"
                                >
                                    <ClipboardListIcon className="w-6 h-6" />
                                </button>
                                
                                {isQuickMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-[#3e3535] border border-[#4a4040] rounded-xl shadow-2xl py-2 z-50 animate-scaleIn origin-top-right">
                                        <button onClick={handleEmailSupport} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#e6ddcd] hover:bg-[#2d2424] hover:text-[#d4ac6e] transition-colors">
                                            <EmailIcon className="w-4 h-4 text-[#d4ac6e]" /> Contato
                                        </button>
                                        <button onClick={() => { onOpenResearch(); setIsQuickMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#e6ddcd] hover:bg-[#2d2424] hover:text-[#d4ac6e] transition-colors">
                                            <SearchIcon className="w-4 h-4 text-[#d4ac6e]" /> Pesquisar
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(true); setIsQuickMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#e6ddcd] hover:bg-[#2d2424] hover:text-[#d4ac6e] transition-colors">
                                            <UserIcon className="w-4 h-4 text-[#d4ac6e]" /> Meu Perfil
                                        </button>
                                    </div>
                                )}
                            </div>
                        </nav>
                        
                        {/* Share Button - Prominently Placed */}
                        <div className="relative" ref={shareRef}>
                            <button 
                                onClick={() => currentProject ? setIsShareOpen(!isShareOpen) : null} 
                                disabled={!currentProject}
                                className={`flex items-center justify-center p-2 rounded-full border border-[#4a4040] transition-all duration-200 ${currentProject ? 'bg-[#3e3535] text-[#d4ac6e] hover:bg-[#d4ac6e] hover:text-[#3e3535] hover:shadow-md' : 'bg-transparent text-[#6a5f5f] cursor-not-allowed'}`}
                                title={currentProject ? "Compartilhar Projeto" : "Abra um projeto para compartilhar"}
                            >
                                <ShareIcon className="w-5 h-5" />
                            </button>
                            
                            {isShareOpen && currentProject && (
                                <div className="absolute right-0 mt-4 w-64 bg-[#3e3535] border border-[#4a4040] rounded-xl shadow-2xl z-50 animate-fadeInUp origin-top-right overflow-hidden">
                                    <div className="px-4 py-3 bg-[#2d2424] border-b border-[#4a4040]">
                                        <p className="text-xs font-bold text-[#a89d8d] uppercase tracking-wider">Compartilhar Projeto</p>
                                        <p className="text-sm font-medium text-[#f5f1e8] truncate mt-1">{currentProject.name}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button onClick={handleWhatsappShare} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-[#2d2424] transition-colors font-medium text-sm group">
                                            <WhatsappIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> WhatsApp
                                        </button>
                                        <button onClick={handleEmailShare} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] transition-colors font-medium text-sm group">
                                            <EmailIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> E-mail
                                        </button>
                                        <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#d4ac6e] hover:bg-[#2d2424] transition-colors font-medium text-sm group">
                                            {copyFeedback ? <CheckIcon className="w-5 h-5 text-green-500" /> : <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />} 
                                            {copyFeedback || 'Copiar Link'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-3 bg-[#3e3535] border border-[#4a4040] py-1.5 pl-2 pr-4 rounded-full hover:border-[#d4ac6e] hover:shadow-md transition-all duration-200 group">
                                <div className="w-8 h-8 rounded-full bg-[#2d2424] flex items-center justify-center group-hover:bg-[#d4ac6e] transition-colors">
                                    <UserIcon className="w-5 h-5 text-[#d4ac6e] group-hover:text-[#2d2424] transition-colors" />
                                </div>
                                <span className="hidden sm:inline text-sm font-bold text-[#e6ddcd] group-hover:text-white transition-colors">{userEmail.split('@')[0]}</span>
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-4 w-72 bg-[#3e3535] border border-[#4a4040] rounded-xl shadow-2xl p-2 z-50 animate-scaleIn max-h-[85vh] overflow-y-auto custom-scrollbar origin-top-right">
                                    <div className="px-4 py-4 bg-[#2d2424] rounded-lg mb-2 border border-[#4a4040]">
                                        <p className="text-sm font-bold text-[#f5f1e8] truncate">{userEmail}</p>
                                        {isSuperAdmin && <p className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1"><ShieldIcon className="w-3 h-3"/> Super Admin</p>}
                                        {!isSuperAdmin && isPartner && <p className="text-xs text-green-400 font-bold mt-1">Parceiro</p>}
                                    </div>
                                    
                                    {isSuperAdmin && (
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 mb-2 text-sm transition-colors shadow-sm">
                                            <ShieldIcon className="w-4 h-4"/> Painel Super Admin
                                        </button>
                                    )}

                                    {/* Install Button for Mobile/Menu */}
                                    {installPrompt && (
                                        <button onClick={handleInstallClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#2d2424] bg-green-400 hover:bg-green-300 mb-2 font-bold animate-pulse text-sm transition-colors shadow-sm">
                                            <DownloadIcon className="w-4 h-4" /> Instalar App
                                        </button>
                                    )}

                                    {/* Mobile Only Main Buttons */}
                                    {isCarpenter && (
                                        <div className="md:hidden space-y-1 mb-2">
                                            {isStoreOwner && (
                                                <button onClick={() => {onOpenStoreMode(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[#e6ddcd] bg-[#4a4040] hover:bg-[#5a4f4f] text-sm transition-colors"><StoreIcon className="w-4 h-4"/> Modo Loja</button>
                                            )}
                                            <button onClick={() => {onOpenProjectGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-sm transition-colors"><MagicIcon className="w-4 h-4"/> Criar com IA</button>
                                            <button onClick={() => {onOpenManagement(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[#2d2424] bg-[#d4ac6e] hover:bg-[#c89f5e] text-sm transition-colors"><ChartBarIcon className="w-4 h-4"/> Gestão</button>
                                        </div>
                                    )}

                                    {isPartner && (
                                        <div className="md:hidden space-y-1 mb-2">
                                            <button onClick={() => {onOpenPartnerPortal(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[#2d2424] bg-[#d4ac6e] hover:bg-[#c89f5e] text-sm transition-colors"><UsersIcon className="w-4 h-4"/> Portal Parceiro</button>
                                            <button onClick={() => {onOpenNotifications(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#d4ac6e] hover:bg-[#2d2424] text-sm transition-colors"><BellIcon className="w-4 h-4"/> Notificações</button>
                                            <button onClick={() => {onOpenWallet(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#d4ac6e] hover:bg-[#2d2424] text-sm transition-colors"><WalletIcon className="w-4 h-4"/> Carteira</button>
                                        </div>
                                    )}

                                    <div className="my-2 h-px bg-[#4a4040]"></div>

                                    {isCarpenter && (
                                        <div className="space-y-1">
                                            <button onClick={() => {onOpenHistory(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><HistoryIcon className="w-4 h-4 text-[#d4ac6e]"/> Histórico</button>
                                            <button onClick={() => {onOpenClients(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><UsersIcon className="w-4 h-4 text-[#d4ac6e]"/> Clientes</button>
                                            
                                            <div className="px-3 py-2 text-[10px] font-bold text-[#8a7e7e] uppercase mt-2 tracking-widest">Ferramentas</div>
                                            <button onClick={() => {onOpenBomGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><BookIcon className="w-4 h-4 text-[#8a7e7e]"/> Gerador BOM</button>
                                            <button onClick={() => {onOpenCuttingPlanGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><ToolsIcon className="w-4 h-4 text-[#8a7e7e]"/> Plano de Corte</button>
                                            <button onClick={() => {onOpenCostEstimator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><CurrencyDollarIcon className="w-4 h-4 text-[#8a7e7e]"/> Custos</button>
                                        </div>
                                    )}

                                    {/* Mobile shortcuts for header tools */}
                                    <div className="md:hidden border-t border-[#4a4040] my-2 pt-2 space-y-1">
                                        <button onClick={() => {onOpenResearch(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><SearchIcon className="w-4 h-4 text-[#d4ac6e]"/> Pesquisar</button>
                                        <button onClick={() => {onOpenLive(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><HeadsetIcon className="w-4 h-4 text-[#d4ac6e]"/> Voz</button>
                                        <button onClick={handleEmailSupport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><EmailIcon className="w-4 h-4 text-[#d4ac6e]"/> Suporte</button>
                                    </div>

                                    <div className="my-2 h-px bg-[#4a4040]"></div>
                                    
                                    <button onClick={handleOpenApiKey} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors">
                                        <CogIcon className="w-4 h-4 text-[#8a7e7e]"/> Configurar API
                                    </button>
                                    <button onClick={handleThemeToggle} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors">
                                        <span className="flex items-center gap-3"><span className="text-[#8a7e7e]">{theme === 'light' ? <MoonIcon className="w-4 h-4"/> : <SunIcon className="w-4 h-4"/>}</span> Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
                                    </button>
                                    <button onClick={() => {onOpenAbout(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><InfoIcon className="w-4 h-4 text-[#8a7e7e]"/> Sobre</button>
                                    
                                    <div className="my-2 h-px bg-[#4a4040]"></div>
                                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 text-sm font-bold transition-colors"><LogoutIcon className="w-4 h-4"/> Sair</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
