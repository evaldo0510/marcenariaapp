
import React, { useState, useEffect } from 'react';
import { LogoIcon, HandshakeIcon, TrophyIcon, PresentationIcon, AcademicCapIcon, ChartBarIcon, CurrencyDollarIcon, ShieldIcon, UsersIcon, LinkIcon, StoreIcon, CheckIcon } from './Shared';
import { getDistributorProfile, createDistributorProfile } from '../services/historyService';
import { getNetworkById, OFFICIAL_NETWORKS } from '../services/distributorData';
import type { DistributorProfile } from '../types';
import { OnboardingMaterial } from './OnboardingMaterial';
import { MarketingStrategy } from './MarketingStrategy';
import { DistributorLinkSystem } from './DistributorLinkSystem';
import { DistributorClientPanel } from './DistributorClientPanel';

interface DistributorPortalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PortalTab = 'dashboard' | 'marcenarias' | 'comissoes' | 'materiais' | 'treinamento' | 'link';

export const DistributorPortal: React.FC<DistributorPortalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
    const [profile, setProfile] = useState<any>(null); // Using any for flexibility with local storage structure for now
    const [network, setNetwork] = useState<any>(null);
    
    // Check if current user is Super Admin (Evaldo)
    const userEmail = sessionStorage.getItem('userEmail');
    const isSuperAdmin = (userEmail || '').trim().toLowerCase() === 'evaldo0510@gmail.com';

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const loadProfile = async () => {
        // First check local storage for the new onboarding flow data
        const localProfile = localStorage.getItem('distributorProfile');
        
        if (localProfile) {
            const p = JSON.parse(localProfile);
            setProfile(p);
            if (p.networkId) {
                const net = getNetworkById(p.networkId);
                setNetwork(net);
            }
        } else {
            // Fallback to mock or DB profile
            let p = await getDistributorProfile();
            if (!p) {
                p = await createDistributorProfile({
                    name: isSuperAdmin ? 'Super Admin (Evaldo)' : 'Parceiro Exemplo',
                    email: userEmail || 'parceiro@exemplo.com',
                    region: 'São Paulo - SP',
                    level: isSuperAdmin ? 'platinum' : 'bronze',
                    totalSales: isSuperAdmin ? 450000 : 12500,
                    commissionRate: isSuperAdmin ? 100 : 15,
                    joinDate: Date.now(),
                    status: 'active'
                });
            }
            setProfile(p);
        }
    };

    if (!isOpen) return null;

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            {isSuperAdmin && (
                <div className="col-span-full bg-red-50 border border-red-200 p-4 rounded-lg mb-4 flex items-center gap-3 text-red-800">
                    <ShieldIcon />
                    <strong>Modo Super Admin:</strong> Você está visualizando o painel global de todos os parceiros.
                </div>
            )}
            
            {/* Status Badge */}
            <div className="col-span-full mb-4 p-4 rounded-xl bg-white dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {network ? (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ backgroundColor: network.color }}>
                            {network.name.charAt(0)}
                        </div>
                    ) : (
                        <div className="bg-[#d4ac6e] p-3 rounded-full text-[#3e3535]"><StoreIcon className="w-6 h-6" /></div>
                    )}
                    <div>
                        <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">
                            {profile?.branch || network?.name || 'Painel do Parceiro'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Representante: {profile?.name || userEmail}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs uppercase text-gray-400 font-bold">ID Parceiro</span>
                    <span className="font-mono text-[#d4ac6e] font-bold">{profile?.partnerId || '---'}</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#d4ac6e] to-[#b99256] p-6 rounded-xl text-[#3e3535] shadow-lg">
                <h3 className="font-bold text-lg mb-1">{isSuperAdmin ? 'Comissões Pagas (Total)' : 'Comissões a Receber'}</h3>
                <p className="text-3xl font-bold">R$ {((profile?.totalSales || 5000) * 0.15).toFixed(2)}</p>
                <p className="text-sm opacity-80 mt-2">Próximo pagamento: 10/11</p>
            </div>
            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Nível Atual</h3>
                <div className="flex items-center gap-2 mt-2">
                    <TrophyIcon className={`w-8 h-8 ${profile?.level === 'bronze' ? 'text-amber-700' : 'text-yellow-400'}`} />
                    <span className="text-2xl font-bold capitalize text-[#3e3535] dark:text-[#f5f1e8]">{profile?.level || 'Bronze'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-4">
                    <div className="bg-[#d4ac6e] h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">60% para nível Prata</p>
            </div>
            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Marcenarias Indicadas</h3>
                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">{isSuperAdmin ? '1,240' : '12'}</p>
                <p className="text-xs text-green-500 mt-2 flex items-center">▲ {isSuperAdmin ? '150' : '3'} este mês</p>
            </div>
             <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Taxa de Conversão</h3>
                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">{isSuperAdmin ? '15%' : '25%'}</p>
                <p className="text-xs text-gray-400 mt-2">Média do setor: 12%</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-[#2d2424] z-50 flex flex-col animate-fadeIn">
            {/* Sidebar */}
            <div className="flex h-full">
                <aside className="w-64 bg-[#fffefb] dark:bg-[#3e3535] border-r border-[#e6ddcd] dark:border-[#4a4040] flex flex-col hidden md:flex">
                    <div className="p-6 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                        <div className="flex items-center gap-2 text-[#b99256] dark:text-[#d4ac6e]">
                            <HandshakeIcon className="w-6 h-6" />
                            <span className="font-bold text-lg">Portal Parceiro</span>
                        </div>
                    </div>
                    <nav className="flex-grow p-4 space-y-2">
                        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <ChartBarIcon className="w-5 h-5" /> Dashboard
                        </button>
                        <button onClick={() => setActiveTab('link')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'link' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <LinkIcon className="w-5 h-5" /> Link de Indicação
                        </button>
                        <button onClick={() => setActiveTab('marcenarias')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'marcenarias' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <UsersIcon className="w-5 h-5" /> {isSuperAdmin ? 'Todas Marcenarias' : 'Meus Clientes'}
                        </button>
                        <button onClick={() => setActiveTab('treinamento')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'treinamento' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <AcademicCapIcon className="w-5 h-5" /> Treinamento
                        </button>
                        <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'materiais' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <PresentationIcon className="w-5 h-5" /> Marketing
                        </button>
                        <button onClick={() => setActiveTab('comissoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'comissoes' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <CurrencyDollarIcon className="w-5 h-5" /> Extrato Financeiro
                        </button>
                    </nav>
                    <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040]">
                        <div className="flex items-center gap-3">
                            {network ? (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: network.color }}>
                                    {network.name.charAt(0)}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-500">
                                    {profile?.name?.charAt(0) || 'P'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] truncate max-w-[120px]">{profile?.name || 'Parceiro'}</p>
                                <p className="text-xs text-gray-500 capitalize">{network?.name || 'Independente'}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center px-6">
                        <h1 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] capitalize">
                            {activeTab === 'link' ? 'Sistema de Indicação' : 
                             activeTab === 'marcenarias' ? 'Minha Carteira' : activeTab}
                        </h1>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            Sair do Portal
                        </button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'link' && <DistributorLinkSystem />}
                        {activeTab === 'marcenarias' && <DistributorClientPanel />}
                        {activeTab === 'treinamento' && <OnboardingMaterial />}
                        {activeTab === 'materiais' && <MarketingStrategy />}
                        {activeTab === 'comissoes' && (
                            <div className="text-center text-gray-500 py-20">
                                <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-xl font-bold">Relatório de Comissões</h3>
                                <p>{isSuperAdmin ? 'Histórico de pagamentos globais.' : 'Seu histórico de pagamentos aparecerá aqui.'}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
