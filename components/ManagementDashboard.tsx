
import React, { useState } from 'react';
import { FinanceModule } from './FinanceModule';
import { InventoryModule } from './InventoryModule';
import { KanbanBoard } from './KanbanBoard';
import { PricingCalculator } from './PricingCalculator';
import { SupplierManagement } from './SupplierManagement';
import { SystemSettings } from './SystemSettings';
import { QuotationSystem } from './QuotationSystem';
import { MaterialsCatalog } from './MaterialsCatalog';
import { 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    ClipboardListIcon, 
    ViewBoardsIcon, 
    CalculatorIcon, 
    TruckIcon, 
    CogIcon,
    CatalogIcon,
    ReceiptIcon
} from './Shared';

interface ManagementDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModuleTab = 'dashboard' | 'finance' | 'inventory' | 'kanban' | 'pricing' | 'suppliers' | 'settings' | 'quotations' | 'catalog';

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<ModuleTab>('dashboard');

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'finance': return <FinanceModule />;
            case 'inventory': return <InventoryModule />;
            case 'kanban': return <KanbanBoard />;
            case 'pricing': return <PricingCalculator />;
            case 'suppliers': return <SupplierManagement />;
            case 'settings': return <SystemSettings />;
            case 'quotations': return <QuotationSystem />;
            case 'catalog': return <MaterialsCatalog />;
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                        <button onClick={() => setActiveTab('kanban')} className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 hover:shadow-lg transition text-left">
                            <ViewBoardsIcon className="w-10 h-10 text-blue-600 mb-3" />
                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">Projetos (Kanban)</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">Acompanhe o progresso de cada pedido.</p>
                        </button>
                        <button onClick={() => setActiveTab('quotations')} className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:shadow-lg transition text-left">
                            <ReceiptIcon className="w-10 h-10 text-indigo-600 mb-3" />
                            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">Cotações</h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-2">Gerencie orçamentos enviados aos clientes.</p>
                        </button>
                        <button onClick={() => setActiveTab('finance')} className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 hover:shadow-lg transition text-left">
                            <CurrencyDollarIcon className="w-10 h-10 text-green-600 mb-3" />
                            <h3 className="text-xl font-bold text-green-900 dark:text-green-300">Financeiro</h3>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-2">Fluxo de caixa, contas a pagar e receber.</p>
                        </button>
                        <button onClick={() => setActiveTab('inventory')} className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800 hover:shadow-lg transition text-left">
                            <ClipboardListIcon className="w-10 h-10 text-yellow-600 mb-3" />
                            <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-300">Estoque</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2">Materiais, alertas de reposição e inventário.</p>
                        </button>
                        <button onClick={() => setActiveTab('catalog')} className="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800 hover:shadow-lg transition text-left">
                            <CatalogIcon className="w-10 h-10 text-teal-600 mb-3" />
                            <h3 className="text-xl font-bold text-teal-900 dark:text-teal-300">Catálogo</h3>
                            <p className="text-sm text-teal-700 dark:text-teal-400 mt-2">Banco de preços e materiais de referência.</p>
                        </button>
                        <button onClick={() => setActiveTab('pricing')} className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 hover:shadow-lg transition text-left">
                            <CalculatorIcon className="w-10 h-10 text-purple-600 mb-3" />
                            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300">Calculadora</h3>
                            <p className="text-sm text-purple-700 dark:text-purple-400 mt-2">Defina preços com margem de lucro correta.</p>
                        </button>
                        <button onClick={() => setActiveTab('suppliers')} className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 hover:shadow-lg transition text-left">
                            <TruckIcon className="w-10 h-10 text-orange-600 mb-3" />
                            <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300">Fornecedores</h3>
                            <p className="text-sm text-orange-700 dark:text-orange-400 mt-2">Gestão de contatos e avaliações.</p>
                        </button>
                        <button onClick={() => setActiveTab('settings')} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition text-left">
                            <CogIcon className="w-10 h-10 text-gray-600 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300">Configurações</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-400 mt-2">Ajustes gerais do sistema.</p>
                        </button>
                    </div>
                );
        }
    };

    const NavButton: React.FC<{ tab: ModuleTab; icon: any; label: string }> = ({ tab, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activeTab === tab ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-[#2d2424] z-50 flex animate-fadeIn">
            {/* Sidebar */}
            <aside className="w-64 bg-[#fffefb] dark:bg-[#3e3535] border-r border-gray-200 dark:border-[#4a4040] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-[#4a4040]">
                    <h2 className="text-xl font-bold text-[#b99256] flex items-center gap-2">
                        <ChartBarIcon /> Gestão PRO
                    </h2>
                </div>
                <nav className="flex-grow p-4 overflow-y-auto">
                    <NavButton tab="dashboard" icon={ChartBarIcon} label="Visão Geral" />
                    <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Produção</p>
                    <NavButton tab="kanban" icon={ViewBoardsIcon} label="Projetos (Kanban)" />
                    <NavButton tab="quotations" icon={ReceiptIcon} label="Cotações" />
                    <NavButton tab="pricing" icon={CalculatorIcon} label="Precificação" />
                    
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Recursos</p>
                    <NavButton tab="inventory" icon={ClipboardListIcon} label="Estoque" />
                    <NavButton tab="catalog" icon={CatalogIcon} label="Catálogo" />
                    <NavButton tab="suppliers" icon={TruckIcon} label="Fornecedores" />
                    
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Admin</p>
                    <NavButton tab="finance" icon={CurrencyDollarIcon} label="Financeiro" />
                    <NavButton tab="settings" icon={CogIcon} label="Configurações" />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-full overflow-hidden">
                <header className="h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-gray-200 dark:border-[#4a4040] flex justify-between items-center px-6">
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                        {activeTab === 'dashboard' ? 'Visão Geral' : activeTab}
                    </h1>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Voltar ao App
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
