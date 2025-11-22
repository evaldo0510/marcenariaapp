import React, { useState, useEffect } from 'react';
import { LayoutIcon, CheckIcon, Spinner, WandIcon } from './Shared';
import { generateLayoutSuggestions } from '../services/geminiService';

interface AutoLayoutGeneratorProps {
    roomType: string;
    dimensions: any;
    userIntent?: string;
    onLayoutSelect: (layoutDescription: string) => void;
}

export const AutoLayoutGenerator: React.FC<AutoLayoutGeneratorProps> = ({ roomType, dimensions, userIntent, onLayoutSelect }) => {
    const [layouts, setLayouts] = useState<{ title: string, description: string, pros: string }[]>([]);
    const [selectedLayoutIndex, setSelectedLayoutIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchLayouts = async () => {
        setLoading(true);
        try {
            const results = await generateLayoutSuggestions(roomType, dimensions, userIntent);
            setLayouts(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roomType && dimensions.width) {
            fetchLayouts();
        }
    }, [roomType, dimensions]);

    const handleSelect = (index: number) => {
        setSelectedLayoutIndex(index);
        onLayoutSelect(layouts[index].description);
    };

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                    <LayoutIcon /> Sugestões de Layout
                </h3>
                {userIntent && !loading && (
                    <button 
                        onClick={fetchLayouts}
                        className="text-xs flex items-center gap-1 bg-[#d4ac6e]/10 text-[#d4ac6e] px-2 py-1 rounded hover:bg-[#d4ac6e]/20 transition"
                    >
                        <WandIcon className="w-3 h-3" /> Atualizar com descrição
                    </button>
                )}
            </div>
            
            {loading ? (
                <div className="text-center py-8"><Spinner /> <p className="text-xs mt-2">Pensando em layouts...</p></div>
            ) : (
                <div className="space-y-3">
                    {layouts.map((layout, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleSelect(index)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedLayoutIndex === index ? 'bg-[#f0e9dc] dark:bg-[#2d2424] border-[#d4ac6e] ring-1 ring-[#d4ac6e]' : 'border-gray-200 dark:border-[#5a4f4f] hover:bg-gray-50 dark:hover:bg-[#4a4040]/50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">{layout.title}</h4>
                                {selectedLayoutIndex === index && <CheckIcon className="w-4 h-4 text-[#d4ac6e]" />}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{layout.description}</p>
                            <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 font-medium">Vantagem: {layout.pros}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};