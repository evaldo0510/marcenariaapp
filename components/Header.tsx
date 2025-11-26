
import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, UserIcon, HistoryIcon, LogoutIcon, InfoIcon, SunIcon, MoonIcon, MagicIcon, ShareIcon, WhatsappIcon, CheckIcon, LinkIcon, EmailIcon, ShieldIcon, CogIcon, ChartBarIcon, DownloadIcon, StoreIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface HeaderProps {
    userEmail: string;
    isAdmin: boolean;
    isPartner: boolean;
    isCarpenter: boolean;
    isStoreOwner: boolean;
    currentProject?: ProjectHistoryItem | null;
    onOpenToolsHub: () => void;
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
    onOpenSmartWorkshop: () => void;
    onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    userEmail, isAdmin, isPartner, isCarpenter, isStoreOwner, currentProject,
    onOpenToolsHub, onOpenHistory, onOpenAbout, 
    onOpenEncontraPro, onLogout, theme, setTheme, onOpenManagement, onOpenAdmin, onOpenPartnerPortal
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    
    // Strict check for Evaldo
    const isSuperAdmin = (userEmail || '').trim().toLowerCase() === 'evaldo0510@gmail.com';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
                setIsShareOpen(false);
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
        <header className="bg-[#2d2424] backdrop-blur-md sticky top-0 z-50 border-b border-[#4a4040] shadow-lg transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Left side: Brand */}
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={onOpenToolsHub}>
                        <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                            <LogoIcon className="text-[#d4ac6e] w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#f5f1e8] tracking-tight font-serif group-hover:text-[#d4ac6e] transition-colors">MarcenApp</h1>
                    </div>
                    
                    {/* Right side: Actions & User */}
                    <div className="flex items-center gap-3 md:gap-6">
                        <nav className="hidden md:flex items-center gap-3">
                            
                            {/* History Button - Available for everyone */}
                            <button onClick={onOpenHistory} className="flex items-center gap-2 text-[#e6ddcd] hover:text-white hover:bg-[#3e3535] px-3 py-2 rounded-lg transition-all text-sm font-medium" title="Meus Projetos">
                                <HistoryIcon className="w-5 h-5"/> Meus Projetos
                            </button>

                            {/* Main Creation Button (Go to Hub) */}
                            <button onClick={onOpenToolsHub} className="flex items-center gap-2 bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold py-2 px-5 rounded-lg hover:opacity-90 hover:shadow-lg transition-all duration-200 shadow-md text-sm transform hover:-translate-y-0.5">
                                <StoreIcon className="w-4 h-4"/> Início
                            </button>
                            
                            {installPrompt && (
                                <button onClick={handleInstallClick} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all duration-200 animate-pulse ml-2" title="Instalar Aplicativo">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            )}
                        </nav>
                        
                        {/* Share Button (Only when project active) */}
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
                                        <p className="text-xs text-[#d4ac6e] font-bold mt-1">{isSuperAdmin ? 'Super Admin' : 'Plano Profissional'}</p>
                                    </div>
                                    
                                    {/* SUPER ADMIN ONLY MENUS */}
                                    {isSuperAdmin && (
                                        <div className="mb-2 pb-2 border-b border-[#4a4040]">
                                            <p className="px-3 text-[10px] text-[#8a7e7e] uppercase font-bold mb-1">Gestão Avançada</p>
                                            <button onClick={() => { if(onOpenAdmin) onOpenAdmin(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 mb-1 text-sm transition-colors shadow-sm">
                                                <ShieldIcon className="w-4 h-4"/> Painel Admin
                                            </button>
                                            <button onClick={() => {onOpenManagement(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors">
                                                <ChartBarIcon className="w-4 h-4 text-[#8a7e7e]"/> Painel Oficina
                                            </button>
                                            <button onClick={() => {if(onOpenPartnerPortal) onOpenPartnerPortal(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors">
                                                <UserIcon className="w-4 h-4 text-[#8a7e7e]"/> Portal Parceiro
                                            </button>
                                        </div>
                                    )}

                                    {/* Mobile Only Buttons */}
                                    <div className="md:hidden space-y-1 mb-2">
                                        <button onClick={() => {onOpenToolsHub(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-[#2d2424] bg-[#d4ac6e] hover:bg-[#c89f5e] text-sm transition-colors"><MagicIcon className="w-4 h-4"/> Início (Hub)</button>
                                        <button onClick={() => {onOpenHistory(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#e6ddcd] hover:bg-[#2d2424] text-sm transition-colors"><HistoryIcon className="w-4 h-4 text-[#d4ac6e]"/> Meus Projetos</button>
                                    </div>

                                    <div className="my-2 h-px bg-[#4a4040]"></div>
                                    
                                    {/* Configurações e Sair */}
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
