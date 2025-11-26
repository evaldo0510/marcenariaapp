
import React from 'react';
import { 
    MagicIcon, 
    ToolsIcon, 
    BookIcon, 
    CurrencyDollarIcon, 
    HistoryIcon, 
    ArrowRightIcon 
} from './Shared'; 

interface ToolsHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (toolId: string) => void;
}

export const ToolsHubModal: React.FC<ToolsHubModalProps> = ({ isOpen, onClose, onSelectTool }) => {
    if (!isOpen) return null;

    const tools = [
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
            title: 'Plano de Corte',
            description: 'Otimize o uso de chapas e evite desperdícios.',
            icon: <ToolsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
            color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            hover: 'hover:border-blue-500'
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
        },
        {
            id: 'history',
            title: 'Meus Projetos',
            description: 'Acesse seu histórico de criações salvas.',
            icon: <HistoryIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />,
            color: 'bg-gray-50 dark:bg-[#2d2424] border-gray-200 dark:border-gray-700',
            hover: 'hover:border-gray-400'
        }
    ];

    return (
        <div className="fixed inset-0 z-40 flex justify-center items-start pt-24 bg-[#f5f1e8] dark:bg-[#2d2424] animate-fadeIn overflow-y-auto">
            <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
                <header className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">O que você quer fazer hoje?</h2>
                    <p className="text-lg text-[#6a5f5f] dark:text-[#a89d8d]">Selecione uma ferramenta para começar</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => onSelectTool(tool.id)}
                            className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 group flex flex-col h-full ${tool.color} ${tool.hover} hover:shadow-xl hover:-translate-y-1`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-4 bg-white dark:bg-[#3e3535] rounded-xl shadow-sm border border-transparent group-hover:border-current transition-colors">
                                    {tool.icon}
                                </div>
                                <div className="p-2 rounded-full bg-white/50 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">{tool.title}</h3>
                            <p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9]">{tool.description}</p>
                        </button>
                    ))}
                </div>
                
                <footer className="mt-12 text-center">
                    <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d]">
                        MarcenApp Inteligência Artificial v2.0
                    </p>
                </footer>
            </div>
        </div>
    );
};
