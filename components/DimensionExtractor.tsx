
import React, { useState, useEffect } from 'react';
import { RulerIcon } from './Shared';

interface DimensionExtractorProps {
    dimensions: { width: number, depth: number, height: number };
    onUpdate: (dims: { width: number, depth: number, height: number }) => void;
}

export const DimensionExtractor: React.FC<DimensionExtractorProps> = ({ dimensions, onUpdate }) => {
    const [localDims, setLocalDims] = useState(dimensions);

    useEffect(() => {
        setLocalDims(dimensions);
    }, [dimensions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDims = { ...localDims, [e.target.name]: parseFloat(e.target.value) };
        setLocalDims(newDims);
        onUpdate(newDims);
    };

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2">
                <RulerIcon /> Dimensões Estimadas (m)
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Largura</label>
                    <input 
                        type="number" 
                        name="width" 
                        step="0.1" 
                        value={localDims.width} 
                        onChange={handleChange}
                        className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Profundidade</label>
                    <input 
                        type="number" 
                        name="depth" 
                        step="0.1" 
                        value={localDims.depth} 
                        onChange={handleChange}
                        className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Altura (Pé direito)</label>
                    <input 
                        type="number" 
                        name="height" 
                        step="0.1" 
                        value={localDims.height} 
                        onChange={handleChange}
                        className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                    />
                </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">⚠ Medidas estimadas via IA. Verifique no local.</p>
        </div>
    );
};
