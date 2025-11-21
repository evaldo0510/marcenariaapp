
import React, { useState } from 'react';
import { StoreIcon, TimelineIcon, UserGroupIcon, BriefcaseIcon } from './Shared';
import { ProjectStageTracker } from './ProjectStageTracker';
import { SalesTeamManager } from './SalesTeamManager';
import { FurnitureStoreCRM } from './FurnitureStoreCRM';

interface StoreDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

type StoreTab = 'projects' | 'sales' | 'crm';

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<StoreTab>('projects');

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'projects': return <ProjectStageTracker />;
            case 'sales': return <SalesTeamManager />;
            case 'crm': return <FurnitureStoreCRM />;
            default: return null;
        }
    };

    const NavButton: React.FC<{ tab: StoreTab; icon: any; label: string }> = ({ tab, icon: Icon, label }) => (
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
                    <h2 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                        <StoreIcon className="text-[#d4ac6e]" /> Modo Loja
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Gestão de Móveis Planejados</p>
                </div>
                <nav className="flex-grow p-4 overflow-y-auto">
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operacional</p>
                    <NavButton tab="projects" icon={TimelineIcon} label="Timeline de Projetos" />
                    
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2">Comercial</p>
                    <NavButton tab="crm" icon={BriefcaseIcon} label="CRM de Clientes" />
                    <NavButton tab="sales" icon={UserGroupIcon} label="Equipe de Vendas" />
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-[#4a4040]">
                    <button onClick={onClose} className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                        Voltar para Marcenaria
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-full overflow-hidden">
                <header className="h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-gray-200 dark:border-[#4a4040] flex justify-between items-center px-6">
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white capitalize">
                        {activeTab === 'projects' ? 'Acompanhamento de Projetos' : 
                         activeTab === 'sales' ? 'Gestão Comercial' : 'CRM & Clientes'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Loja: Matriz - São Paulo</span>
                        <div className="w-8 h-8 bg-[#d4ac6e] rounded-full flex items-center justify-center text-[#3e3535] font-bold">L</div>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto p-6 bg-gray-100 dark:bg-[#2d2424]">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
