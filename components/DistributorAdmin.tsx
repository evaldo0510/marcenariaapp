
import React, { useState, useEffect } from 'react';
import { 
    UsersIcon, 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    CogIcon, 
    ShieldIcon, 
    CheckIcon,
    TrashIcon,
    PlusIcon,
    SearchIcon,
    UserAddIcon
} from './Shared';
import { getPartners, savePartner, updatePartnerStatus, deletePartner, getClients } from '../services/historyService';
import type { Partner, Client } from '../types';

export const DistributorAdmin: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [partners, setPartners] = useState<Partner[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPartner, setNewPartner] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pData, cData] = await Promise.all([getPartners(), getClients()]);
            // Calculate sales for each partner based on clients linked to them (mock logic for sales sum)
            const partnersWithStats = pData.map(p => {
                const partnerClients = cData.filter(c => c.partnerId === p.id);
                // Mock: each active client contributes 1000 to sales
                const sales = partnerClients.filter(c => c.status === 'active').length * 1000; 
                return { ...p, totalSales: sales };
            });
            setPartners(partnersWithStats);
            setClients(cData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
        await updatePartnerStatus(id, status);
        loadData();
    };

    const handleApprove = async (id: string) => {
        await updatePartnerStatus(id, 'active');
        loadData();
    }

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este parceiro? Todos os dados vinculados serão perdidos.")) {
            await deletePartner(id);
            loadData();
        }
    };

    const handleAddPartner = async () => {
        if (!newPartner.name || !newPartner.email) return;
        await savePartner({
            name: newPartner.name,
            email: newPartner.email,
            phone: newPartner.phone,
            status: 'active', // Admin adds as active by default
            level: 'bronze'
        });
        setShowAddModal(false);
        setNewPartner({ name: '', email: '', phone: '' });
        loadData();
    };

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
        { id: 'distributors', label: 'Parceiros', icon: UsersIcon },
        { id: 'approvals', label: 'Aprovações', icon: ShieldIcon },
        { id: 'commissions', label: 'Comissões', icon: CurrencyDollarIcon },
    ];

    const pendingPartners = partners.filter(p => p.status === 'pending');
    const activePartners = partners.filter(p => p.status === 'active');
    const totalSales = partners.reduce((acc, p) => acc + (p.totalSales || 0), 0);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Total de Parceiros</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">{partners.length}</p>
                            <p className="text-green-500 text-xs mt-1">{activePartners.length} Ativos</p>
                        </div>
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Vendas via Parceiros</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">R$ {totalSales.toLocaleString('pt-BR')}</p>
                            <p className="text-green-500 text-xs mt-1">Estimado</p>
                        </div>
                        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Aprovações Pendentes</h3>
                            <p className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">{pendingPartners.length}</p>
                            {pendingPartners.length > 0 && (
                                <button onClick={() => setActiveTab('approvals')} className="text-[#d4ac6e] text-xs font-bold mt-2 hover:underline">Ver Solicitações</button>
                            )}
                        </div>
                    </div>
                );
            case 'distributors':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Gerenciar Parceiros</h3>
                            <button onClick={() => setShowAddModal(true)} className="bg-[#d4ac6e] text-[#3e3535] px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#c89f5e]">
                                <PlusIcon /> Adicionar Manualmente
                            </button>
                        </div>
                        
                        <div className="bg-white dark:bg-[#3e3535] rounded-lg border border-gray-200 dark:border-[#4a4040] overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#2d2424] text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Nível</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                                    {partners.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#4a4040]/50">
                                            <td className="p-4 font-medium text-[#3e3535] dark:text-[#f5f1e8]">{p.name}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-300">{p.email}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs capitalize">{p.level}</span></td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                    {p.status === 'active' ? 'Ativo' : p.status === 'pending' ? 'Pendente' : 'Suspenso'}
                                                </span>
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                {p.status === 'active' ? (
                                                    <button onClick={() => handleStatusChange(p.id, 'suspended')} className="text-red-500 hover:underline text-xs">Bloquear</button>
                                                ) : (
                                                    <button onClick={() => handleStatusChange(p.id, 'active')} className="text-green-500 hover:underline text-xs">Ativar</button>
                                                )}
                                                <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {partners.length === 0 && <div className="p-8 text-center text-gray-500">Nenhum parceiro cadastrado.</div>}
                        </div>
                    </div>
                );
            case 'approvals':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Solicitações Pendentes</h3>
                        {pendingPartners.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white dark:bg-[#3e3535] rounded-lg border border-gray-200 dark:border-[#4a4040]">
                                Nenhuma solicitação pendente no momento.
                            </div>
                        ) : (
                            pendingPartners.map(p => (
                                <div key={p.id} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{p.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{p.email} • {new Date(p.joinDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApprove(p.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1 text-sm font-bold">
                                            <CheckIcon className="w-4 h-4" /> Aprovar
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1 text-sm font-bold">
                                            <TrashIcon className="w-4 h-4" /> Recusar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
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
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#3e3535] border-r border-gray-200 dark:border-[#4a4040] flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-200 dark:border-[#4a4040]">
                    <h2 className="font-bold text-lg text-[#b99256]">Painel Evaldo</h2>
                    <p className="text-xs text-gray-500">Gestão Central</p>
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
                            {tab.id === 'approvals' && pendingPartners.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingPartners.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-6 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
                {renderContent()}
            </main>

            {/* Add Partner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Adicionar Novo Parceiro</h3>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Nome Completo" 
                                className="w-full p-2 border rounded dark:bg-[#2d2424] dark:border-[#5a4f4f]"
                                value={newPartner.name}
                                onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                            />
                            <input 
                                type="email" 
                                placeholder="E-mail (Login)" 
                                className="w-full p-2 border rounded dark:bg-[#2d2424] dark:border-[#5a4f4f]"
                                value={newPartner.email}
                                onChange={e => setNewPartner({...newPartner, email: e.target.value})}
                            />
                            <input 
                                type="tel" 
                                placeholder="Telefone (Opcional)" 
                                className="w-full p-2 border rounded dark:bg-[#2d2424] dark:border-[#5a4f4f]"
                                value={newPartner.phone}
                                onChange={e => setNewPartner({...newPartner, phone: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                            <button onClick={handleAddPartner} className="px-4 py-2 bg-[#d4ac6e] text-[#3e3535] font-bold rounded hover:bg-[#c89f5e]">Cadastrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
