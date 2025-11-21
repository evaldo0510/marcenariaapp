
import React, { useState, useEffect } from 'react';
import { ArmchairIcon, PlusIcon } from './Shared';

interface FurnitureSuggestionEngineProps {
    roomType: string;
    onSelectionChange: (items: string[]) => void;
}

export const FurnitureSuggestionEngine: React.FC<FurnitureSuggestionEngineProps> = ({ roomType, onSelectionChange }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [customItem, setCustomItem] = useState('');

    useEffect(() => {
        // Mock logic - in real app could be from API
        const defaults: Record<string, string[]> = {
            'Cozinha': ['Armário Aéreo', 'Balcão de Pia', 'Torre Quente', 'Ilha Central'],
            'Quarto': ['Guarda-Roupa', 'Cabeceira', 'Mesa de Cabeceira', 'Penteadeira'],
            'Sala de Estar': ['Painel de TV', 'Rack', 'Aparador', 'Estante'],
            'Escritório': ['Mesa em L', 'Gaveteiro', 'Estante de Livros', 'Armário Alto'],
            'Banheiro': ['Gabinete', 'Espelheira', 'Nicho'],
        };
        const items = defaults[roomType] || ['Armário', 'Prateleira'];
        setSuggestions(items);
        setSelectedItems(items); // Select all by default
        onSelectionChange(items);
    }, [roomType, onSelectionChange]);

    const toggleItem = (item: string) => {
        const newSelection = selectedItems.includes(item)
            ? selectedItems.filter(i => i !== item)
            : [...selectedItems, item];
        setSelectedItems(newSelection);
        onSelectionChange(newSelection);
    };

    const addCustom = () => {
        if (customItem && !selectedItems.includes(customItem)) {
            const newItems = [...selectedItems, customItem];
            setSelectedItems(newItems);
            onSelectionChange(newItems);
            setCustomItem('');
        }
    };

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2">
                <ArmchairIcon /> Móveis Sugeridos
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
                {suggestions.map(item => (
                    <label key={item} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-[#4a4040] transition dark:border-[#5a4f4f]">
                        <input 
                            type="checkbox" 
                            checked={selectedItems.includes(item)}
                            onChange={() => toggleItem(item)}
                            className="rounded text-[#d4ac6e] focus:ring-[#d4ac6e]"
                        />
                        <span className="text-sm text-[#3e3535] dark:text-[#f5f1e8]">{item}</span>
                    </label>
                ))}
                {selectedItems.filter(i => !suggestions.includes(i)).map(item => (
                     <label key={item} className="flex items-center gap-2 p-2 border rounded cursor-pointer bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <input 
                            type="checkbox" 
                            checked={true}
                            onChange={() => toggleItem(item)}
                            className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-[#3e3535] dark:text-[#f5f1e8]">{item}</span>
                    </label>
                ))}
            </div>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customItem}
                    onChange={e => setCustomItem(e.target.value)}
                    placeholder="Adicionar outro móvel..."
                    className="flex-grow p-2 text-sm rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                />
                <button onClick={addCustom} className="p-2 bg-[#d4ac6e] text-[#3e3535] rounded hover:bg-[#c89f5e]">
                    <PlusIcon />
                </button>
            </div>
        </div>
    );
};
