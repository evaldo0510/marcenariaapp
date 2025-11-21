
import React from 'react';
import { ScanIcon, CheckIcon } from './Shared';

interface RoomTypeDetectorProps {
    detectedType: string;
    confidence: string;
    onConfirm: (type: string) => void;
}

export const RoomTypeDetector: React.FC<RoomTypeDetectorProps> = ({ detectedType, confidence, onConfirm }) => {
    const roomTypes = ['Cozinha', 'Quarto', 'Sala de Estar', 'Banheiro', 'Escritório', 'Varanda', 'Lavanderia', 'Closet'];

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2">
                <ScanIcon /> Ambiente Detectado
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-bold">{detectedType}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Confiança: {confidence}</p>
                </div>
                <CheckIcon className="text-blue-500 w-6 h-6" />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Se estiver incorreto, selecione abaixo:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roomTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => onConfirm(type)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${detectedType === type ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-gray-100 dark:bg-[#2d2424] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#5a4f4f]'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );
};
