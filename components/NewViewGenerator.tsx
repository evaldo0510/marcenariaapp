import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { updateProjectInHistory } from '../services/historyService';
import { Spinner, WandIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface NewViewGeneratorProps {
    isOpen: boolean;
    project: ProjectHistoryItem;
    onClose: () => void;
    onSaveComplete: () => Promise<void>;
    showAlert: (message: string, title?: string) => void;
}

export const NewViewGenerator: React.FC<NewViewGeneratorProps> = ({ isOpen, project, onSaveComplete, onClose, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);

    const originalImageSrc = project.views3d[0];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showAlert('Por favor, descreva a nova vista que você deseja.');
            return;
        }
        setIsGenerating(true);
        setGeneratedImageSrc(null);
        try {
            const base64Data = originalImageSrc.split(',')[1];
            const mimeType = originalImageSrc.match(/data:(.*);/)?.[1] || 'image/png';
            
            const fullPrompt = `Com base na imagem 3D fornecida, que representa um móvel no estilo '${project.style}', gere uma nova vista 3D fotorrealista. A instrução do usuário para a nova perspectiva é: "${prompt}". Mantenha ABSOLUTA consistência com a imagem original em termos de estilo, acabamento, cores, iluminação e qualidade de renderização. O objetivo é criar uma imagem complementar para um catálogo.`;

            const newImageBase64 = await editImage(base64Data, mimeType, fullPrompt);
            setGeneratedImageSrc(`data:image/png;base64,${newImageBase64}`);
        } catch (error) {
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.', 'Erro na Geração');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = async () => {
        if(generatedImageSrc) {
            const newViewUrl = generatedImageSrc;
            const updatedViews = [...project.views3d, newViewUrl];
            await updateProjectInHistory(project.id, { views3d: updatedViews });
            await onSaveComplete();
            handleClose();
        }
    }

    const handleClose = () => {
        setPrompt('');
        setGeneratedImageSrc(null);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e]">Gerar Nova Vista 3D</h2>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                <main className="p-4 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9]">Vista de Referência</h3>
                        <img src={originalImageSrc} alt="Imagem original" className="w-full h-auto object-contain rounded-md" />
                    </div>
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9]">Nova Vista Gerada</h3>
                        <div className="w-full aspect-square bg-[#f0e9dc] dark:bg-[#2d2424] rounded-md flex items-center justify-center">
                            {isGenerating ? (
                                <div className="text-center">
                                    <Spinner />
                                    <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">Gerando nova perspectiva...</p>
                                </div>
                            ) : generatedImageSrc ? (
                                <img src={generatedImageSrc} alt="Nova vista gerada" className="w-full h-auto object-contain rounded-md" />
                            ) : (
                                <div className="text-center text-[#8a7e7e]">
                                    <WandIcon />
                                    <p>A nova vista aparecerá aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                         <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: close-up no puxador, vista de cima"
                            className="flex-grow bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                        <button onClick={handleGenerate} disabled={isGenerating} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isGenerating ? <Spinner size="sm" /> : <WandIcon />}
                            <span>{isGenerating ? 'Gerando...' : 'Gerar Vista'}</span>
                        </button>
                    </div>
                     <div className="flex justify-end gap-4">
                        <button onClick={handleClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button>
                        <button onClick={handleSave} disabled={!generatedImageSrc} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50">Salvar Nova Vista</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};