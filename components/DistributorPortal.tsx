
import React, { useState, useEffect } from 'react';
import { LogoIcon, HandshakeIcon, TrophyIcon, PresentationIcon, AcademicCapIcon, ChartBarIcon, CurrencyDollarIcon } from './Shared';
import { getDistributorProfile, createDistributorProfile } from '../services/historyService';
import type { DistributorProfile } from '../types';
import { OnboardingMaterial } from './OnboardingMaterial';
import { MarketingStrategy } from './MarketingStrategy';

interface DistributorPortalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PortalTab = 'dashboard' | 'marcenarias' | 'comissoes' | 'materiais' | 'treinamento';

export const DistributorPortal: React.FC<DistributorPortalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
    const [profile, setProfile] = useState<DistributorProfile | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        }
    }, [isOpen]);

    const loadProfile = async () => {
        // Simulate getting the current user's profile
        let p = await getDistributorProfile();
        if (!p) {
            // Create a mock profile for demo purposes if none exists
            p = await createDistributorProfile({
                name: 'Parceiro Exemplo',
                email: 'parceiro@exemplo.com',
                region: 'São Paulo - SP',
                level: 'bronze',
                totalSales: 12500,
                commissionRate: 15,
                joinDate: Date.now()
            });
        }
        setProfile(p);
    };

    if (!isOpen) return null;

    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-[#d4ac6e] to-[#b99256] p-6 rounded-xl text-[#3e3535] shadow-lg">
                <h3 className="font-bold text-lg mb-1">Comissões Totais</h3>
                <p className="text-3xl font-bold">R$ {(profile?.totalSales || 0) * 0.15}</p>
                <p className="text-sm opacity-80 mt-2">Próximo pagamento: 10/11</p>
            </div>
            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Nível Atual</h3>
                <div className="flex items-center gap-2 mt-2">
                    <TrophyIcon className={`w-8 h-8 ${profile?.level === 'bronze' ? 'text-amber-700' : 'text-yellow-400'}`} />
                    <span className="text-2xl font-bold capitalize text-[#3e3535] dark:text-[#f5f1e8]">{profile?.level}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-4">
                    <div className="bg-[#d4ac6e] h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">60% para nível Prata</p>
            </div>
            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Marcenarias Ativas</h3>
                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">12</p>
                <p className="text-xs text-green-500 mt-2 flex items-center">▲ 2 este mês</p>
            </div>
             <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase">Taxa de Conversão</h3>
                <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">18%</p>
                <p className="text-xs text-gray-400 mt-2">Média do setor: 12%</p>
            </div>
        </div>
    );

    const renderMarcenarias = () => (
        <div className="bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                <h3 className="font-bold text-lg">Minhas Marcenarias</h3>
                <button className="bg-[#d4ac6e] text-[#3e3535] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#c89f5e]">Nova Marcenaria</button>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-[#2d2424] text-gray-500">
                    <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Plano</th>
                        <th className="p-4">Entrou em</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                    {[1, 2, 3].map((i) => (
                        <tr key={i}>
                            <td className="p-4 font-medium text-[#3e3535] dark:text-[#f5f1e8]">Marcenaria Exemplo {i}</td>
                            <td className="p-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Ativo</span></td>
                            <td className="p-4 text-gray-600 dark:text-gray-300">Profissional</td>
                            <td className="p-4 text-gray-400">10/10/2023</td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
                        <button onClick={() => setActiveTab('treinamento')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'treinamento' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <AcademicCapIcon className="w-5 h-5" /> Treinamento & Onboarding
                        </button>
                        <button onClick={() => setActiveTab('materiais')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'materiais' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <PresentationIcon className="w-5 h-5" /> Materiais de Venda
                        </button>
                        <button onClick={() => setActiveTab('marcenarias')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'marcenarias' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <HandshakeIcon className="w-5 h-5" /> Minhas Marcenarias
                        </button>
                        <button onClick={() => setActiveTab('comissoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'comissoes' ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <CurrencyDollarIcon className="w-5 h-5" /> Comissões
                        </button>
                    </nav>
                    <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-500">
                                {profile?.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8]">{profile?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">Parceiro {profile?.level}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center px-6">
                        <h1 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] capitalize">
                            {activeTab === 'treinamento' ? 'Universidade do Parceiro' : 
                             activeTab === 'materiais' ? 'Central de Marketing' : activeTab}
                        </h1>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            Sair do Portal
                        </button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'marcenarias' && renderMarcenarias()}
                        {activeTab === 'treinamento' && <OnboardingMaterial />}
                        {activeTab === 'materiais' && <MarketingStrategy />}
                        {activeTab === 'comissoes' && (
                            <div className="text-center text-gray-500 py-20">
                                <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-xl font-bold">Relatório de Comissões</h3>
                                <p>Seu histórico de pagamentos aparecerá aqui.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
