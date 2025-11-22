
import React, { useState } from 'react';
import { CogIcon, UsersIcon, ShieldIcon, BellIcon, GlobeIcon, SaveIcon, CreditCardIcon, DatabaseIcon, CloudIcon } from './Shared';

type Tab = 'general' | 'users' | 'permissions' | 'notifications' | 'integrations' | 'backup' | 'appearance' | 'billing' | 'localization' | 'advanced';

export const SystemSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Informações da Empresa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm mb-1">Nome da Marcenaria</label><input type="text" defaultValue="Minha Marcenaria" className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" /></div>
                            <div><label className="block text-sm mb-1">CNPJ</label><input type="text" className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" /></div>
                            <div><label className="block text-sm mb-1">E-mail de Contato</label><input type="email" className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" /></div>
                            <div><label className="block text-sm mb-1">Telefone</label><input type="text" className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" /></div>
                        </div>
                        <div><label className="block text-sm mb-1">Endereço</label><textarea className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" rows={3}></textarea></div>
                        <button className="px-4 py-2 bg-[#d4ac6e] text-[#3e3535] rounded font-bold">Salvar Alterações</button>
                    </div>
                );
            case 'users':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Gerenciar Equipe</h3>
                            <button className="px-3 py-1 bg-[#d4ac6e] text-[#3e3535] rounded text-sm font-bold">+ Adicionar Usuário</button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-[#2d2424]">
                                <tr><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Cargo</th><th className="p-2">Status</th></tr>
                            </thead>
                            <tbody>
                                <tr className="border-b dark:border-[#4a4040]"><td className="p-2">Admin Principal</td><td className="p-2">admin@marcenapp.com</td><td className="p-2">Gerente</td><td className="p-2 text-green-600">Ativo</td></tr>
                                <tr className="border-b dark:border-[#4a4040]"><td className="p-2">Carlos Marceneiro</td><td className="p-2">carlos@marcenapp.com</td><td className="p-2">Operador</td><td className="p-2 text-green-600">Ativo</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'permissions':
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Níveis de Acesso</h3>
                        <div className="space-y-2">
                            {['Gerente', 'Vendedor', 'Marceneiro', 'Auxiliar'].map(role => (
                                <div key={role} className="p-3 border rounded flex justify-between items-center dark:border-[#4a4040]">
                                    <span>{role}</span>
                                    <button className="text-blue-600 text-sm">Editar Permissões</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Preferências de Notificação</h3>
                        {['Novos Pedidos', 'Estoque Baixo', 'Prazos de Entrega', 'Pagamentos Recebidos'].map(item => (
                            <div key={item} className="flex items-center justify-between p-2">
                                <span>{item}</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Email</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> WhatsApp</label>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'integrations':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Integrações Externas</h3>
                        <div className="p-4 border rounded dark:border-[#4a4040] flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">WhatsApp Business API</h4>
                                <p className="text-sm text-gray-500">Conectado como (11) 99999-9999</p>
                            </div>
                            <button className="text-red-500 text-sm">Desconectar</button>
                        </div>
                        <div className="p-4 border rounded dark:border-[#4a4040] flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">Google Calendar</h4>
                                <p className="text-sm text-gray-500">Sincronizar datas de entrega</p>
                            </div>
                            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Conectar</button>
                        </div>
                    </div>
                );
            case 'backup':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Dados e Backup</h3>
                        <div className="p-4 bg-gray-50 dark:bg-[#2d2424] rounded">
                            <h4 className="font-bold">Exportar Dados</h4>
                            <p className="text-sm text-gray-500 mb-2">Baixe uma cópia completa dos seus projetos e clientes.</p>
                            <button className="bg-[#3e3535] text-white px-4 py-2 rounded flex items-center gap-2"><CloudIcon className="w-4 h-4"/> Baixar Backup (JSON)</button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-[#2d2424] rounded">
                            <h4 className="font-bold text-red-600">Zona de Perigo</h4>
                            <p className="text-sm text-gray-500 mb-2">Apagar todos os dados e resetar a conta.</p>
                            <button className="border border-red-500 text-red-500 px-4 py-2 rounded">Resetar Conta</button>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Assinatura e Faturamento</h3>
                        <div className="p-4 border border-[#d4ac6e] rounded bg-[#fffefb] dark:bg-[#3e3535]">
                            <p className="text-sm text-gray-500">Plano Atual</p>
                            <h4 className="text-2xl font-bold text-[#d4ac6e]">Profissional</h4>
                            <p className="text-sm">Renova em: 15/11/2023</p>
                        </div>
                        <h4 className="font-bold mt-6">Histórico de Faturas</h4>
                        <table className="w-full text-sm text-left">
                            <tbody>
                                {[1, 2, 3].map(i => (
                                    <tr key={i} className="border-b dark:border-[#4a4040]">
                                        <td className="p-2">15/10/2023</td>
                                        <td className="p-2">R$ 49,90</td>
                                        <td className="p-2 text-green-600">Pago</td>
                                        <td className="p-2 text-blue-500 cursor-pointer">PDF</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-4">Aparência</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border p-4 rounded cursor-pointer hover:border-[#d4ac6e]">
                                <div className="h-20 bg-gray-100 mb-2"></div>
                                <p className="text-center font-bold">Claro</p>
                            </div>
                            <div className="border p-4 rounded cursor-pointer hover:border-[#d4ac6e]">
                                <div className="h-20 bg-gray-800 mb-2"></div>
                                <p className="text-center font-bold">Escuro</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Cor de Destaque</label>
                            <div className="flex gap-2">
                                {['#d4ac6e', '#3b82f6', '#10b981', '#ef4444'].map(c => (
                                    <div key={c} className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm" style={{backgroundColor: c}}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="p-4 text-center text-gray-500">Configuração em desenvolvimento.</div>;
        }
    };

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'general', label: 'Geral', icon: CogIcon },
        { id: 'users', label: 'Usuários', icon: UsersIcon },
        { id: 'permissions', label: 'Permissões', icon: ShieldIcon },
        { id: 'notifications', label: 'Notificações', icon: BellIcon },
        { id: 'integrations', label: 'Integrações', icon: DatabaseIcon },
        { id: 'backup', label: 'Dados & Backup', icon: CloudIcon },
        { id: 'appearance', label: 'Aparência', icon: CogIcon },
        { id: 'billing', label: 'Faturamento', icon: CreditCardIcon },
        { id: 'localization', label: 'Localização', icon: GlobeIcon },
        { id: 'advanced', label: 'Avançado', icon: CogIcon },
    ];

    return (
        <div className="flex h-[600px] bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden animate-fadeIn">
            <aside className="w-64 bg-gray-50 dark:bg-[#2d2424] border-r border-[#e6ddcd] dark:border-[#4a4040] overflow-y-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeTab === tab.id ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a4040]'}`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                {renderTabContent()}
            </main>
        </div>
    );
};
