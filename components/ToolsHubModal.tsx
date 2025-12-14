
import React from 'react';
import { 
    MagicIcon, 
    ToolsIcon, 
    BookIcon, 
    CurrencyDollarIcon, 
    HistoryIcon, 
    ArrowRightIcon, 
    DownloadIcon,
    StoreIcon,
    UsersIcon,
    ChartBarIcon,
    ShieldIcon,
    LockIcon,
    PaletteIcon,
    GridIcon
} from './Shared'; 

interface ToolsHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (toolId: string) => void;
    installPrompt?: any;
    onInstallClick?: () => void;
}

export const ToolsHubModal: React.FC<ToolsHubModalProps> = ({ isOpen, onClose, onSelectTool, installPrompt, onInstallClick }) => {
    if (!isOpen) return null;

    const myTools = [
        {
            id: 'project',
            title: 'Projeto 3D com IA',
            description: 'Crie visuais fotorrealistas a partir de fotos ou texto.',
            icon: <MagicIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
            color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
            hover: 'hover:border-purple-500'
        },
        {
            id: 'cutting',
            title: 'Otimizador de Corte',
            description: 'Calcule o aproveitamento de chapas por texto.',
            icon: <ToolsIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
            color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
            hover: 'hover:border-orange-500'
        },
        {
            id: 'bom',
            title: 'Lista de Materiais',
            description: 'Gere a lista de compras técnica (BOM) completa.',
            icon: <BookIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
            color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            hover: 'hover:border-emerald-500'
        },
        {
            id: 'cost',
            title: 'Calculadora de Custos',
            description: 'Precifique mão de obra e materiais para orçamento.',
            icon: <CurrencyDollarIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
            color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            hover: 'hover:border-amber-500'
        }
    ];

    // Add Install App option if handler is available
    if (onInstallClick) {
        myTools.push({
            id: 'install',
            title: 'Instalar App',
            description: 'Acesso rápido e offline na sua tela inicial.',
            icon: <DownloadIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
            color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
            hover: 'hover:border-indigo-500'
        });
    }

    const storeTools = [
        {
            id: 'store_crm',
            title: 'CRM Avançado',
            description: 'Gestão de clientes e funil de vendas.',
            icon: <UsersIcon className="w-6 h-6 text-gray-400" />,
            price: 'Plano Oficina'
        },
        {
            id: 'store_finance',
            title: 'Gestão Financeira',
            description: 'Controle de fluxo de caixa e notas.',
            icon: <ChartBarIcon className="w-6 h-6 text-gray-400" />,
            price: 'Plano Oficina'
        },
        {
            id: 'store_team',
            title: 'Gestão de Equipe',
            description: 'Controle de tarefas e produtividade.',
            icon: <ShieldIcon className="w-6 h-6 text-gray-400" />,
            price: 'Plano Oficina'
        }
    ];

    const handleCardClick = (id: string) => {
        if (id === 'install' && onInstallClick) {
            onInstallClick();
        } else {
            onSelectTool(id);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-center items-start pt-24 bg-[#f5f1e8] dark:bg-[#2d2424] animate-fadeIn overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
                <header className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">Minha Oficina</h2>
                    <p className="text-lg text-[#6a5f5f] dark:text-[#a89d8d]">Ferramentas disponíveis no seu plano</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {myTools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => handleCardClick(tool.id)}
                            className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 group flex flex-col h-full ${tool.color} ${tool.hover} hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-4 bg-white dark:bg-[#3e3535] rounded-xl shadow-sm border border-transparent group-hover:border-current transition-colors">
                                    {tool.icon}
                                </div>
                                <div className="p-2 rounded-full bg-white/50 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2 relative z-10">{tool.title}</h3>
                            <p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9] relative z-10">{tool.description}</p>
                        </button>
                    ))}
                </div>

                <header className="mb-6 text-center border-t border-gray-200 dark:border-gray-700 pt-10">
                    <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2 flex items-center justify-center gap-2">
                        <StoreIcon className="text-[#d4ac6e]" /> Loja de Ferramentas
                    </h2>
                    <p className="text-sm text-[#6a5f5f] dark:text-[#a89d8d]">Faça o upgrade para desbloquear mais poder</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-75">
                    {storeTools.map(tool => (
                        <div key={tool.id} className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-gray-200 dark:border-gray-700 relative grayscale hover:grayscale-0 transition-all">
                            <div className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-600 p-1.5 rounded-full">
                                <LockIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-4">
                                {tool.icon}
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{tool.title}</h3>
                            <p className="text-xs text-gray-500 mb-4">{tool.description}</p>
                            <button className="w-full py-2 text-xs font-bold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-500 rounded hover:bg-[#d4ac6e] hover:text-[#3e3535] transition">
                                Disponível no {tool.price}
                            </button>
                        </div>
                    ))}
                </div>
                
                <footer className="mt-16 text-center">
                    <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d]">
                        MarcenApp Inteligência Artificial v2.5
                    </p>
                </footer>
            </div>
        </div>
    );
};
