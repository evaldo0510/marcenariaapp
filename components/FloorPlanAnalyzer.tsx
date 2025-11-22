
import React from 'react';
import { BlueprintIcon, CheckIcon, SearchIcon } from './Shared';
import { InteractiveImageViewer } from './InteractiveImageViewer';

interface FloorPlanAnalyzerProps {
    isFloorPlan: boolean;
    detectedFeatures: string[];
    imageSrc?: string | null;
}

export const FloorPlanAnalyzer: React.FC<FloorPlanAnalyzerProps> = ({ isFloorPlan, detectedFeatures, imageSrc }) => {
    if (!isFloorPlan) return null;

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn mt-4">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2">
                <BlueprintIcon /> Análise da Planta Baixa
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                A IA identificou os seguintes elementos estruturais para guiar o projeto:
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {detectedFeatures.length > 0 ? detectedFeatures.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" /> {feature}
                    </span>
                )) : <span className="text-xs text-gray-500">Nenhum recurso específico detectado automaticamente.</span>}
            </div>

            {imageSrc && (
                <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <SearchIcon className="w-3 h-3" /> Inspeção Visual (Zoom/Pan)
                    </p>
                    <div className="h-64 w-full bg-gray-100 dark:bg-[#2d2424] rounded-lg overflow-hidden border border-gray-200 dark:border-[#5a4f4f] relative">
                        <InteractiveImageViewer 
                            src={imageSrc} 
                            alt="Planta Baixa Analisada" 
                            projectName="Planta Baixa" 
                            className="w-full h-full"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Use dois dedos para zoom ou arraste para mover.</p>
                </div>
            )}
        </div>
    );
};
