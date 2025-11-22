
import React, { useState, useRef, useEffect } from 'react';
import { LogoIcon, UserIcon, SearchIcon, HeadsetIcon, StoreIcon, HistoryIcon, LogoutIcon, InfoIcon, UsersIcon, SunIcon, MoonIcon, BookIcon, ToolsIcon, CurrencyDollarIcon, ChartBarIcon, BellIcon, WalletIcon, MagicIcon, CogIcon, ShieldIcon, EmailIcon, DownloadIcon, ShareIcon, WhatsappIcon, CopyIcon, CheckIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface HeaderProps {
    userEmail: string;
    isAdmin: boolean; // "Business" level or higher
    isPartner: boolean; // Specific for partner portal
    isCarpenter: boolean; // Specific for carpentry tools
    isStoreOwner: boolean; // Specific for store mode (currently restricted)
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
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = userEmail === 'evaldo0510@gmail.com';

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

    const handleEmailSupport = () => {
        window.location.href = 'mailto:suporte@marcenapp.com?subject=MarcenApp - Suporte';
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
        setCopyFeedback('Copiado!');
        setTimeout(() => {
            setCopyFeedback(null);
            setIsShareOpen(false);
        }, 2000);
    };
    
    return (
        <header className="bg-[#2d2424]/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm sticky top-0 z-30 border-b border-[#4a4040] shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:p-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Left side: Brand */}
                    <div className="flex items-center gap-3">
                        <LogoIcon className="text-[#d4ac6e] w-6 h-6 md:w-8 md:h-8" />
                        <h1 className="text-xl md:text-2xl font-bold text-[#f5f1e8] tracking-tight font-serif">MarcenApp</h1>
                    </div>
                    
                    {/* Right side: Actions & User */}
                    <div className="flex items-center gap-4">
                        {/* Action icons hidden on small screens */}
                        <nav className="hidden md:flex items-center gap-4">
                            
                            {/* Partner Shortcuts */}
                            {isPartner && (
                                <>
                                    <button onClick={onOpenNotifications} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all relative" title="Notificações">
                                        <BellIcon />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>
                                    <button onClick={onOpenWallet} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all" title="Minha Carteira">
                                        <WalletIcon />
                                    </button>
                                    <div className="w-px h-6 bg-[#4a4040]"></div>
                                    <button onClick={onOpenPartnerPortal} className="flex items-center gap-2 bg-[#d4ac6e] text-[#2d2424] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] transition shadow-sm text-sm">
                                        <UsersIcon className="w-4 h-4"/> Portal
                                    </button>
                                </>
                            )}

                            {/* Carpenter / Store Shortcuts */}
                            {isCarpenter && (
                                <>
                                    <div className="w-px h-6 bg-[#4a4040]"></div>
                                    {isStoreOwner && (
                                        <button onClick={onOpenStoreMode} className="flex items-center gap-2 bg-[#3e3535] text-[#f5f1e8] border border-[#4a4040] font-bold py-2 px-3 rounded-lg hover:bg-[#4a4040] transition shadow-sm text-sm" title="Mudar para modo Loja de Móveis">
                                            <StoreIcon className="w-4 h-4"/> Loja
                                        </button>
                                    )}
                                    <button onClick={onOpenProjectGenerator} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition shadow-sm text-sm">
                                        <MagicIcon className="w-4 h-4"/> Criar
                                    </button>
                                    <button onClick={onOpenManagement} className="flex items-center gap-2 bg-[#d4ac6e] text-[#2d2424] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] transition shadow-sm text-sm">
                                        <ChartBarIcon className="w-4 h-4"/> Gestão
                                    </button>
                                </>
                            )}
                            
                            <div className="w-px h-6 bg-[#4a4040]"></div>
                            
                            {installPrompt && (
                                <button onClick={handleInstallClick} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all animate-pulse" title="Instalar Aplicativo">
                                    <DownloadIcon />
                                </button>
                            )}

                            <button onClick={onOpenResearch} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all hover:scale-110" title="Pesquisar com Iara">
                                <SearchIcon />
                            </button>
                            <button onClick={onOpenLive} className="p-2 rounded-full text-[#d4ac6e] hover:bg-[#3e3535] transition-all hover:scale-110" title="Conversar com Iara (Voz)">
                                <HeadsetIcon />
                            </button>
                        </nav>
                        
                        {/* Share Menu */}
                        <div className="relative" ref={shareRef}>
                            <button 
                                onClick={() => currentProject ? setIsShareOpen(!isShareOpen) : null} 
                                disabled={!currentProject}
                                className={`p-2 rounded-full transition-all ${currentProject ? 'text-[#d4ac6e] hover:bg-[#3e3535] hover:scale-110' : 'text-gray-600 cursor-not-allowed'}`} 
                                title={currentProject ? "Compartilhar Projeto Atual" : "Nenhum projeto aberto"}
                            >
                                <ShareIcon />
                            </button>
                            
                            {isShareOpen && currentProject && (
                                <div className="absolute right-0 mt-3 w-60 bg-[#3e3535] border border-[#4a4040] rounded-xl shadow-2xl p-2 z-50 animate-fadeInUp">
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 border-b border-[#4a4040] mb-2">
                                        Compartilhar: {projectName}
                                    </div>
                                    <button onClick={handleWhatsappShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-400 hover:bg-[#2d2424] transition font-medium text-sm">
                                        <WhatsappIcon className="w-4 h-4" /> WhatsApp
                                    </button>
                                    <button onClick={handleEmailShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#f5f1e8] hover:bg-[#2d2424] transition font-medium text-sm">
                                        <EmailIcon className="w-4 h-4" /> E-mail
                                    </button>
                                    <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#d4ac6e] hover:bg-[#2d2424] transition font-medium text-sm">
                                        {copyFeedback ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />} 
                                        {copyFeedback || 'Copiar Link'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-[#3e3535] border border-[#4a4040] py-1.5 px-3 md:py-2 md:px-4 rounded-full hover:border-[#d4ac6e] transition-all group">
                                <UserIcon className="w-5 h-5 text-[#d4ac6e] group-hover:text-white transition-colors" />
                                <span className="hidden sm:inline text-sm font-bold text-[#f5f1e8]">{userEmail.split('@')[0]}</span>
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-[#3e3535] border border-[#4a4040] rounded-xl shadow-2xl p-2 z-50 animate-scaleIn max-h-[80vh] overflow-y-auto custom-scrollbar origin-top-right">
                                    <div className="px-4 py-3 bg-[#2d2424] rounded-lg mb-2">
                                        <p className="text-sm font-bold text-[#f5f1e8] truncate">{userEmail}</p>
                                        {isSuperAdmin && <p className="text-xs text-red-400 font-bold flex items-center gap-1 mt-1"><ShieldIcon className="w-3 h-3"/> Super Admin</p>}
                                        {!isSuperAdmin && isPartner && <p className="text-xs text-green-400 font-bold mt-1">Parceiro</p>}
                                    </div>
                                    
                                    {isSuperAdmin && (
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-white bg-red-600 hover:bg-red-700 mb-2 text-sm">
                                            <ShieldIcon className="w-4 h-4"/> Painel Super Admin
                                        </button>
                                    )}

                                    {/* Install Button for Mobile/Menu */}
                                    {installPrompt && (
                                        <button onClick={handleInstallClick} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#2d2424] bg-green-400 hover:bg-green-300 mb-2 font-bold animate-pulse text-sm">
                                            <DownloadIcon className="w-4 h-4" /> Instalar App
                                        </button>
                                    )}

                                    {/* Mobile Only Main Buttons */}
                                    {isCarpenter && (
                                        <div className="md:hidden space-y-1 mb-2">
                                            {isStoreOwner && (
                                                <button onClick={() => {onOpenStoreMode(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-[#f5f1e8] bg-[#4a4040] hover:bg-[#5a4f4f] text-sm"><StoreIcon className="w-4 h-4"/> Modo Loja</button>
                                            )}
                                            <button onClick={() => {onOpenProjectGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-sm"><MagicIcon className="w-4 h-4"/> Criar com IA</button>
                                            <button onClick={() => {onOpenManagement(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-[#2d2424] bg-[#d4ac6e] hover:bg-[#c89f5e] text-sm"><ChartBarIcon className="w-4 h-4"/> Gestão</button>
                                        </div>
                                    )}

                                    {isPartner && (
                                        <div className="md:hidden space-y-1 mb-2">
                                            <button onClick={() => {onOpenPartnerPortal(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded font-bold text-[#2d2424] bg-[#d4ac6e] hover:bg-[#c89f5e] text-sm"><UsersIcon className="w-4 h-4"/> Portal Parceiro</button>
                                            <button onClick={() => {onOpenNotifications(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#d4ac6e] hover:bg-[#4a4040] text-sm"><BellIcon className="w-4 h-4"/> Notificações</button>
                                            <button onClick={() => {onOpenWallet(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#d4ac6e] hover:bg-[#4a4040] text-sm"><WalletIcon className="w-4 h-4"/> Carteira</button>
                                        </div>
                                    )}

                                    <div className="my-2 h-px bg-[#4a4040]"></div>

                                    {isCarpenter && (
                                        <div className="space-y-1">
                                            <button onClick={() => {onOpenHistory(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><HistoryIcon className="w-4 h-4 text-[#d4ac6e]"/> Histórico</button>
                                            <button onClick={() => {onOpenClients(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><UsersIcon className="w-4 h-4 text-[#d4ac6e]"/> Clientes</button>
                                            
                                            <div className="px-3 py-2 text-xs font-bold text-[#8a7e7e] uppercase mt-2">Ferramentas</div>
                                            <button onClick={() => {onOpenBomGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><BookIcon className="w-4 h-4 text-[#8a7e7e]"/> Gerador BOM</button>
                                            <button onClick={() => {onOpenCuttingPlanGenerator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><ToolsIcon className="w-4 h-4 text-[#8a7e7e]"/> Plano de Corte</button>
                                            <button onClick={() => {onOpenCostEstimator(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><CurrencyDollarIcon className="w-4 h-4 text-[#8a7e7e]"/> Custos</button>
                                        </div>
                                    )}

                                    {/* Mobile shortcuts for header tools */}
                                    <div className="md:hidden border-t border-[#4a4040] my-2 pt-2 space-y-1">
                                        <button onClick={() => {onOpenResearch(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><SearchIcon className="w-4 h-4 text-[#d4ac6e]"/> Pesquisar</button>
                                        <button onClick={() => {onOpenLive(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><HeadsetIcon className="w-4 h-4 text-[#d4ac6e]"/> Voz</button>
                                    </div>

                                    <div className="my-2 h-px bg-[#4a4040]"></div>
                                    
                                    <button onClick={handleOpenApiKey} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm">
                                        <CogIcon className="w-4 h-4 text-gray-400"/> Configurar API
                                    </button>
                                    <button onClick={handleThemeToggle} className="w-full flex items-center justify-between px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm">
                                        <span className="flex items-center gap-3"><span className="text-gray-400">{theme === 'light' ? <MoonIcon className="w-4 h-4"/> : <SunIcon className="w-4 h-4"/>}</span> Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
                                    </button>
                                    <button onClick={() => {onOpenAbout(); setIsMenuOpen(false);}} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><InfoIcon className="w-4 h-4 text-gray-400"/> Sobre</button>
                                    <button onClick={handleEmailSupport} className="w-full flex items-center gap-3 px-3 py-2 rounded text-[#f5f1e8] hover:bg-[#4a4040] text-sm"><EmailIcon className="w-4 h-4 text-gray-400"/> Suporte</button>
                                    
                                    <div className="my-2 h-px bg-[#4a4040]"></div>
                                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded text-red-400 hover:bg-red-900/20 text-sm font-bold"><LogoutIcon className="w-4 h-4"/> Sair</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
