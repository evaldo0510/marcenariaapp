
import React from 'react';
import { BlueprintIcon, CheckIcon } from './Shared';

interface FloorPlanAnalyzerProps {
    isFloorPlan: boolean;
    detectedFeatures: string[];
}

export const FloorPlanAnalyzer: React.FC<FloorPlanAnalyzerProps> = ({ isFloorPlan, detectedFeatures }) => {
    if (!isFloorPlan) return null;

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn mt-4">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2">
                <BlueprintIcon /> Análise da Planta Baixa
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Elementos estruturais identificados:</p>
            
            <div className="flex flex-wrap gap-2">
                {detectedFeatures.length > 0 ? detectedFeatures.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" /> {feature}
                    </span>
                )) : <span className="text-xs text-gray-500">Nenhum recurso específico detectado.</span>}
            </div>
        </div>
    );
};
