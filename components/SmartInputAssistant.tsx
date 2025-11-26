
import React, { useState, useMemo } from 'react';
import { SparklesIcon, WandIcon, CheckIcon, RefreshIcon } from './Shared';

interface SmartInputAssistantProps {
    currentText: string;
    onUpdateText: (text: string) => void;
    onEnhance: () => void;
    isEnhancing: boolean;
}

// Categorized keywords to suggest based on simple context detection
const KEYWORDS = {
    kitchen: [
        'Torre Quente', 'Ilha Central', 'Bancada em L', 'Porta Basculante', 'Gavetão', 'Porta Condimentos', 'Lixeira Embutida', 'Tamponamento', 'Rodapé Recuado', 'Sanca de LED'
    ],
    bedroom: [
        'Roupeiro', 'Portas de Correr', 'Espelho Bronze', 'Sapateira', 'Maleiro', 'Cabeceira Estofada', 'Mesa de Cabeceira', 'Painel Ripado', 'Iluminação Indireta'
    ],
    living: [
        'Painel de TV', 'Rack Suspenso', 'Nichos Decorativos', 'Lareira Ecológica', 'Cristaleira', 'Adega', 'Fita de LED', 'Portas de Vidro', 'Móvel Bar'
    ],
    bath: [
        'Gabinete Suspenso', 'Cuba de Apoio', 'Espelheira', 'Nicho no Box', 'Tulha de Roupa', 'Pedra Esculpida'
    ],
    general: [
        'MDF Branco TX', 'MDF Amadeirado', 'Laca Fosca', 'Puxador Cava', 'Puxador Perfil', 'Dobradiça Slow Motion', 'Corrediça Telescópica', 'Pés Metálicos'
    ]
};

export const SmartInputAssistant: React.FC<SmartInputAssistantProps> = ({ currentText, onUpdateText, onEnhance, isEnhancing }) => {
    
    // Simple context detection based on keywords in the text
    const detectedContext = useMemo(() => {
        const lowerText = currentText.toLowerCase();
        if (lowerText.includes('cozinha') || lowerText.includes('geladeira') || lowerText.includes('fogão')) return 'kitchen';
        if (lowerText.includes('quarto') || lowerText.includes('cama') || lowerText.includes('guarda')) return 'bedroom';
        if (lowerText.includes('sala') || lowerText.includes('tv') || lowerText.includes('sofá')) return 'living';
        if (lowerText.includes('banheiro') || lowerText.includes('pia') || lowerText.includes('lavabo')) return 'bath';
        return 'general'; // Default
    }, [currentText]);

    // Merge general keywords with context-specific ones
    const suggestions = useMemo(() => {
        const contextKeys = KEYWORDS[detectedContext as keyof typeof KEYWORDS] || [];
        // Combine and remove duplicates if any, taking first 15 relevant ones
        return [...new Set([...contextKeys, ...KEYWORDS.general])].slice(0, 15);
    }, [detectedContext]);

    const handleAddTag = (tag: string) => {
        // Prevent adding if already exists to avoid clutter
        if (!currentText.includes(tag)) {
            const separator = currentText.trim().length > 0 && !currentText.endsWith(' ') ? ', ' : '';
            onUpdateText(currentText + separator + tag);
        }
    };

    return (
        <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#d4ac6e] uppercase tracking-wide">
                    <SparklesIcon className="w-3 h-3" /> Sugestões Inteligentes ({detectedContext === 'general' ? 'Geral' : detectedContext === 'kitchen' ? 'Cozinha' : detectedContext === 'bedroom' ? 'Quarto' : detectedContext === 'living' ? 'Sala' : 'Banheiro'})
                </div>
                
                {currentText.length > 10 && (
                    <button 
                        onClick={onEnhance}
                        disabled={isEnhancing}
                        className="text-xs flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-full hover:shadow-md transition-all disabled:opacity-70"
                        title="Reescrever usando IA para termos técnicos"
                    >
                        {isEnhancing ? <RefreshIcon className="w-3 h-3 animate-spin" /> : <WandIcon className="w-3 h-3" />}
                        {isEnhancing ? 'Melhorando...' : 'Melhorar Texto com IA'}
                    </button>
                )}
            </div>

            {/* Chips Container */}
            <div className="flex flex-wrap gap-2">
                {suggestions.map((tag) => {
                    const isActive = currentText.includes(tag);
                    return (
                        <button
                            key={tag}
                            onClick={() => handleAddTag(tag)}
                            disabled={isActive}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border
                                ${isActive 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default' 
                                    : 'bg-[#fffefb] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9] border-[#e6ddcd] dark:border-[#5a4f4f] hover:border-[#d4ac6e] hover:text-[#d4ac6e] hover:shadow-sm'}`}
                        >
                            {isActive && <CheckIcon className="w-3 h-3" />}
                            {isActive ? tag : `+ ${tag}`}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
