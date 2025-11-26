
import React from 'react';
import { SparklesIcon } from './Shared';

interface StyleAssistantProps {
  onSelect: (text: string) => void;
  presetId?: string;
}

const SUGGESTIONS = [
    { label: 'Cozinha Planejada', text: 'Cozinha completa em L com armários aéreos, torre quente e ilha central. Acabamento moderno.' },
    { label: 'Guarda-Roupa Casal', text: 'Guarda-roupa de casal grande, portas de correr com espelho, maleiro e gaveteiros internos.' },
    { label: 'Painel de TV', text: 'Painel de TV ripado para sala de estar, com rack suspenso, fita de LED e prateleira superior.' },
    { label: 'Home Office', text: 'Escritório com mesa em L, gaveteiro, nichos para livros e armário alto para documentos.' },
    { label: 'Banheiro', text: 'Gabinete de banheiro suspenso com cuba de sobrepor e espelheira com iluminação.' },
    { label: 'Área Gourmet', text: 'Móveis para área de churrasqueira, com espaço para frigobar e armários resistentes.' },
    { label: 'Closet Aberto', text: 'Closet sem portas, estilo industrial, com cabideiros metálicos e prateleiras de madeira.' },
    { label: 'Cama Infantil', text: 'Cama infantil com gavetões embaixo e nichos para brinquedos na cabeceira.' }
];

export const StyleAssistant: React.FC<StyleAssistantProps> = ({ onSelect }) => {
    return (
        <div className="space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-[#d4ac6e] uppercase tracking-wide">
                <SparklesIcon className="w-3 h-3" /> Sugestões Rápidas
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {SUGGESTIONS.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(item.text)}
                        className="flex-shrink-0 px-4 py-2 bg-[#fffefb] dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#5a4f4f] rounded-full text-xs font-medium text-[#6a5f5f] dark:text-[#c7bca9] hover:border-[#d4ac6e] hover:text-[#d4ac6e] hover:shadow-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
