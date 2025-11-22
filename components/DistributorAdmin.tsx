
import React, { useState } from 'react';
import { 
    UsersIcon, 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    CogIcon, 
    ShieldIcon, 
    CheckIcon,
    TrashIcon
} from './Shared';

export const DistributorAdmin: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
        { id: 'distributors', label: 'Distribuidores', icon: UsersIcon },
        { id: 'approvals', label: 'Aprovações', icon: ShieldIcon },
        { id: 'commissions', label: 'Comissões', icon: CurrencyDollarIcon },
        { id: 'config', label: 'Configurações', icon: CogIcon },
        // Additional placeholders for the "10 tabs" requirement
        { id: 'reports', label: 'Relatórios', icon: ChartBarIcon },
        { id: 'marketing', label: 'Marketing', icon: ChartBarIcon },
        { id: 'integrations', label: 'Integrações', icon: CogIcon },
        { id: 'support', label: 'Suporte', icon: UsersIcon },
        { id: 'logs', label: 'Logs', icon: ShieldIcon },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 text-sm uppercase font-bold">Total de Parceiros</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">124</p>
                            <p className="text-green-500 text-xs mt-1">+12 essa semana</p>
                        </div>
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 text-sm uppercase font-bold">Vendas via Parceiros</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">R$ 45.200</p>
                            <p className="text-green-500 text-xs mt-1">+18% vs mês anterior</p>
                        </div>
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 text-sm uppercase font-bold">Comissões Pendentes</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">R$ 6.780</p>
                            <button className="text-[#d4ac6e] text-xs font-bold mt-2 hover:underline">Processar Pagamentos</button>
                        </div>
                    </div>
                );
            case 'distributors':
                return (
                    <div className="bg-white dark:bg-[#3e3535] rounded-lg border border-gray-200 dark:border-[#4a4040] overflow-hidden animate-fadeIn">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-[#2d2424]">
                                <tr>
                                    <th className="p-4">Nome</th>
                                    <th className="p-4">Nível</th>
                                    <th className="p-4">Vendas</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td className="p-4 font-medium">Parceiro {i}</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Ouro</span></td>
                                        <td className="p-4">R$ {i * 1500},00</td>
                                        <td className="p-4 text-green-500">Ativo</td>
                                        <td className="p-4"><button className="text-blue-500 hover:underline">Detalhes</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'approvals':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <h3 className="font-bold text-lg">Solicitações de Parceiros</h3>
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] flex justify-between items-center">
                                <div>
                                    <p className="font-bold">Candidato {i}</p>
                                    <p className="text-sm text-gray-500">candidato{i}@email.com</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"><CheckIcon className="w-5 h-5" /></button>
                                    <button className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"><TrashIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return (
                    <div className="text-center py-20 text-gray-500 animate-fadeIn">
                        <CogIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Módulo {activeTab} em construção.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full min-h-[600px] bg-gray-100 dark:bg-[#2d2424] rounded-lg overflow-hidden">
            <aside className="w-64 bg-white dark:bg-[#3e3535] border-r border-gray-200 dark:border-[#4a4040] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-[#4a4040]">
                    <h2 className="font-bold text-lg text-[#b99256]">Admin Parceiros</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors mb-1 ${activeTab === tab.id ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#4a4040]'}`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-6 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
                {renderContent()}
            </main>
        </div>
    );
};
