import React, { useState, useEffect } from 'react';
import { editImage, suggestAlternativeStyles } from '../services/geminiService';
import { updateProjectInHistory } from '../services/historyService';
import { Spinner, WandIcon, SparklesIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';
import { initialStylePresets } from '../services/presetService';

interface NewViewGeneratorProps {
    isOpen: boolean;
    project: ProjectHistoryItem;
    onClose: () => void;
    onSaveComplete: () => Promise<void>;
    showAlert: (message: string, title?: string) => void;
}

export const NewViewGenerator: React.FC<NewViewGeneratorProps> = ({ isOpen, project, onSaveComplete, onClose, showAlert }) => {
    const [style, setStyle] = useState(project.style);
    const [finish, setFinish] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const originalImageSrc = project.views3d[0];

    useEffect(() => {
        if (isOpen) {
            setStyle(project.style);
            setFinish('');
            setGeneratedImageSrc(null);
            setSuggestions([]);
        }
    }, [isOpen, project]);

    const handleSuggestStyles = async () => {
        setIsSuggesting(true);
        setSuggestions([]);
        try {
            const result = await suggestAlternativeStyles(project.description, project.style, originalImageSrc);
            const filteredSuggestions = result
                .filter(s => s.toLowerCase() !== project.style.toLowerCase())
                .slice(0, 3);
            setSuggestions(filteredSuggestions);
        } catch (error) {
            showAlert(error instanceof Error ? error.message : "Erro ao sugerir estilos.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!style.trim() || !finish.trim()) {
            showAlert('Por favor, selecione um estilo e descreva um acabamento.');
            return;
        }
        setIsGenerating(true);
        setGeneratedImageSrc(null);
        try {
            const base64Data = originalImageSrc.split(',')[1];
            const mimeType = originalImageSrc.match(/data:(.*);/)?.[1] || 'image/png';
            
            const fullPrompt = `Você é um renderizador 3D de IA. A imagem fornecida é uma renderização de um móvel no estilo "${project.style}". Sua tarefa é criar uma nova renderização fotorrealista do MESMO móvel, mas aplicando as seguintes modificações:
**Novo Estilo:** "${style}"
**Novo Acabamento Principal:** "${finish}"
Mantenha a forma, a estrutura e a perspectiva geral do móvel, alterando apenas o estilo e os materiais conforme solicitado. O fundo deve ser um estúdio de fotografia minimalista.`;

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
                                    <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">Gerando nova variação...</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="style-select-new-view" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Novo Estilo de Design</label>
                            <div className="flex items-center gap-2">
                                <select id="style-select-new-view" value={style} onChange={(e) => setStyle(e.target.value)} className="flex-grow bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition">
                                    {!initialStylePresets.includes(style) && <option key={style} value={style}>{style}</option>}
                                    {initialStylePresets.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={handleSuggestStyles} disabled={isSuggesting} title="Sugerir estilos com IA" className="p-3 rounded-lg bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] text-[#d4ac6e] disabled:opacity-50">
                                    {isSuggesting ? <Spinner size="sm"/> : <SparklesIcon />}
                                </button>
                            </div>
                             {isSuggesting ? (
                                <div className="text-center p-4 text-sm text-[#8a7e7e] dark:text-[#a89d8d]">Sugerindo estilos...</div>
                            ) : suggestions.length > 0 && (
                                <div className="mt-3 space-y-2 animate-fadeIn">
                                    <h4 className="text-xs font-semibold text-[#8a7e7e] dark:text-[#a89d8d]">Sugestões da Iara:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map(suggestion => (
                                            <button 
                                                key={suggestion}
                                                onClick={() => {
                                                    setStyle(suggestion);
                                                    setSuggestions([]); // Clear suggestions after selection
                                                }}
                                                className="px-3 py-1 bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9] text-sm font-medium rounded-full hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="finish-input-new-view" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Novo Acabamento Principal</label>
                            <input id="finish-input-new-view" type="text" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Ex: Madeira escura, MDF branco" className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition" />
                        </div>
                    </div>
                     <div className="flex justify-end gap-4 mt-2">
                        <button onClick={handleClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button>
                        <button onClick={handleGenerate} disabled={isGenerating} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isGenerating ? <Spinner size="sm" /> : <WandIcon />}
                            <span>{isGenerating ? 'Gerando...' : 'Gerar Vista'}</span>
                        </button>
                        <button onClick={handleSave} disabled={!generatedImageSrc} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50">Salvar Nova Vista</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};