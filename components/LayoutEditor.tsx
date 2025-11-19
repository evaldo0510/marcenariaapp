import React, { useState, useEffect } from 'react';
import { editFloorPlan } from '../services/geminiService';
import { Spinner, WandIcon } from './Shared';

interface LayoutEditorProps {
    isOpen: boolean;
    floorPlanSrc: string;
    projectDescription: string;
    onClose: () => void;
    onSave: (newImageBase64: string) => void;
    showAlert: (message: string, title?: string) => void;
}

const editSuggestions = [
    "Adicionar uma janela maior na parede do fundo",
    "Mova a porta 50cm para a direita",
    "Adicione uma janela na parede de cima",
    "Aumente a largura total em 100cm",
    "Remova a parede interna",
    "Adicione uma parede dividindo o ambiente ao meio",
    "Transforme a janela em uma porta de correr"
];


export const LayoutEditor: React.FC<LayoutEditorProps> = ({ isOpen, floorPlanSrc, projectDescription, onClose, onSave, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);

    // Reset state when the source image changes (when a new project is selected)
    useEffect(() => {
        if (isOpen) {
            setEditedImageSrc(null);
            setPrompt('');
        }
    }, [isOpen, floorPlanSrc]);

    const handleEdit = async () => {
        if (!prompt.trim()) {
            showAlert('Por favor, descreva a alteração que deseja fazer no layout.');
            return;
        }
        setIsEditing(true);
        setEditedImageSrc(null);
        try {
            const base64Data = floorPlanSrc.split(',')[1];
            const mimeType = floorPlanSrc.match(/data:(.*);/)?.[1] || 'image/png';
            
            const fullPrompt = `Contexto do Projeto: "${projectDescription}".\nInstrução de Edição: "${prompt}"`;

            const newImageBase64 = await editFloorPlan(base64Data, mimeType, fullPrompt);
            setEditedImageSrc(`data:image/png;base64,${newImageBase64}`);
        } catch (error) {
            console.error('Failed to edit floor plan:', error);
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.', 'Erro na Edição');
        } finally {
            setIsEditing(false);
        }
    };
    
    const handleSave = () => {
        if(editedImageSrc) {
            const base64Data = editedImageSrc.split(',')[1];
            onSave(base64Data);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-5xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e]">Editor de Layout 2D</h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                <main className="p-4 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9]">Layout Original</h3>
                        <img src={floorPlanSrc} alt="Planta baixa original" className="w-full h-auto object-contain rounded-md bg-white p-1" />
                    </div>
                     <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9]">Novo Layout</h3>
                        <div className="w-full aspect-auto min-h-[300px] bg-[#f0e9dc] dark:bg-[#2d2424] rounded-md flex items-center justify-center p-1">
                            {isEditing ? (
                                <div className="text-center">
                                    <Spinner />
                                    <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">Ajustando o layout...</p>
                                </div>
                            ) : editedImageSrc ? (
                                <img src={editedImageSrc} alt="Novo layout" className="w-full h-auto object-contain rounded-md bg-white p-1" />
                            ) : (
                                <div className="text-center text-[#8a7e7e]">
                                    <WandIcon />
                                    <p>O novo layout aparecerá aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] space-y-3">
                    <div>
                         <textarea
                            rows={2}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Adicionar uma janela maior na parede do fundo, transformar porta em arco..."
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                            {editSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => setPrompt(prev => prev ? `${prev.trim()}, ${suggestion.toLowerCase()}` : suggestion)}
                                    className="px-3 py-1 bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9] text-xs font-medium rounded-full hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                         <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] text-center sm:text-left">Descreva as alterações e a Iara, nossa IA, redesenhará para você.</p>
                         <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                            <button onClick={onClose} className="flex-1 bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-3 px-5 rounded-lg hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button>
                            <button onClick={handleEdit} disabled={isEditing} className="flex-1 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {isEditing ? <Spinner size="sm" /> : <WandIcon />}
                                <span>{isEditing ? 'Ajustando' : 'Ajustar'}</span>
                            </button>
                            <button onClick={handleSave} disabled={!editedImageSrc} className="flex-1 bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-3 px-5 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50">Salvar</button>
                         </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};