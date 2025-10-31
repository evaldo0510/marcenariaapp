import React, { useState, useEffect } from 'react';
import { projectTypePresets } from '../services/presetService';

interface StyleAssistantProps {
  onSelect: (tag: string) => void;
  presetId: string;
}

export const StyleAssistant: React.FC<StyleAssistantProps> = ({ onSelect, presetId }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const activePreset = projectTypePresets.find(p => p.id === presetId);

    // Reseta a visibilidade quando o preset é alterado
    useEffect(() => {
        setShowSuggestions(false);
    }, [presetId]);

    if (!activePreset || !activePreset.suggestions) {
        return null;
    }
    
    return (
        <div>
            {!showSuggestions ? (
                <button
                    onClick={() => setShowSuggestions(true)}
                    className="w-full text-left text-[#6a5f5f] dark:text-[#a89d8d] text-sm p-3 rounded-lg hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50 transition-colors flex items-center gap-2"
                >
                    💡 Não sabe como começar? <strong>Clique aqui para ver sugestões.</strong>
                </button>
            ) : (
                <>
                    <label className="block text-sm font-medium text-[#8a7e7e] dark:text-[#a89d8d] mb-2">
                        Selecione um modelo para preencher a descrição:
                    </label>
                    <div className="space-y-2 animate-fadeInUp" style={{ animationDuration: '0.4s' }}>
                        {activePreset.suggestions.map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => onSelect(prompt)}
                                className="w-full text-left bg-[#f0e9dc] dark:bg-[#4a4040]/50 text-[#6a5f5f] dark:text-[#c7bca9] text-sm p-3 rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] hover:text-[#3e3535] dark:hover:text-white transition-colors"
                            >
                               {prompt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};