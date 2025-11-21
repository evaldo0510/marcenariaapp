
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Spinner, WandIcon, MagicIcon } from './Shared';

interface Project3DGeneratorProps {
    inputData: {
        image: string;
        roomType: string;
        furniture: string[];
        layoutDescription: string;
        style: string;
    };
    onGenerate: (imageUrl: string) => void;
}

export const Project3DGenerator: React.FC<Project3DGeneratorProps> = ({ inputData, onGenerate }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setProgress('Interpretando dados...');
        
        try {
            const prompt = `
            Gere um projeto de marcenaria 3D Fotorrealista.
            Ambiente: ${inputData.roomType}.
            Estilo: ${inputData.style}.
            Móveis Planejados: ${inputData.furniture.join(', ')}.
            Layout: ${inputData.layoutDescription}.
            
            IMPORTANTE: Use a imagem fornecida como base geométrica da sala (paredes, janelas, piso), mas insira os novos móveis planejados descritos acima.
            `;

            const imageBase64 = inputData.image.split(',')[1];
            const mimeType = inputData.image.match(/data:(.*);/)?.[1] || 'image/png';

            setProgress('Renderizando com IA...');
            const resultImage = await generateImage(prompt, [{ data: imageBase64, mimeType }]);
            
            onGenerate(`data:image/png;base64,${resultImage}`);
        } catch (e) {
            console.error(e);
            alert('Erro ao gerar imagem.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="text-center py-6">
            {isGenerating ? (
                <div className="animate-pulse">
                    <div className="mx-auto mb-4 w-16 h-16 bg-[#f0e9dc] dark:bg-[#3e3535] rounded-full flex items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                    <h3 className="text-lg font-bold text-[#b99256]">{progress}</h3>
                    <p className="text-sm text-gray-500">Isso pode levar até 30 segundos.</p>
                </div>
            ) : (
                <button 
                    onClick={handleGenerate}
                    className="w-full py-4 bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                    <MagicIcon className="w-8 h-8" />
                    Gerar Projeto 3D Agora
                </button>
            )}
        </div>
    );
};
