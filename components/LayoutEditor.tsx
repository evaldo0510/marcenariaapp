
import React, { useState, useEffect } from 'react';
import { editFloorPlan } from '../services/geminiService';
import { Spinner, WandIcon, RulerIcon, SaveIcon } from './Shared';

interface LayoutEditorProps {
    isOpen: boolean;
    floorPlanSrc: string;
    projectDescription: string;
    onClose: () => void;
    onSave: (newImageBase64: string) => void;
    showAlert: (message: string, title?: string) => void;
}

const editSuggestions = [
    "Adicionar janela na parede superior",
    "Mover porta para a direita",
    "Criar ilha central na cozinha",
    "Remover parede divisória",
    "Aumentar largura da sala",
    "Adicionar porta de correr",
    "Incluir bancada em L"
];

export const LayoutEditor: React.FC<LayoutEditorProps> = ({ isOpen, floorPlanSrc, projectDescription, onClose, onSave, showAlert }) => {
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEditedImageSrc(null);
            setPrompt('');
        }
    }, [isOpen, floorPlanSrc]);

    const handleEdit = async () => {
        if (!prompt.trim()) {
            showAlert('Por favor, descreva a alteração que deseja fazer.');
            return;
        }
        setIsEditing(true);
        setEditedImageSrc(null);
        try {
            const base64Data = floorPlanSrc.split(',')[1];
            const mimeType = floorPlanSrc.match(/data:(.*);/)?.[1] || 'image/png';
            
            // Enhanced prompt to maintain technical style
            const fullPrompt = `Contexto: "${projectDescription}".\nTarefa: ${prompt}\nIMPORTANTE: Mantenha o estilo de desenho técnico AutoCAD (linhas pretas, fundo branco, vista superior).`;

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
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#2d2424] rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl border border-gray-200 dark:border-[#4a4040] flex flex-col md:flex-row overflow-hidden">
                
                {/* Left: Canvas Area - Technical CAD Style */}
                <div className="flex-grow relative bg-[#2a2a2a] overflow-hidden flex items-center justify-center p-12">
                    {/* CAD Grid Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{
                             backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                             backgroundSize: '20px 20px'
                         }}>
                    </div>

                    {/* Paper/Drawing Area with Dimensions */}
                    <div className="relative bg-white p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-full max-h-full flex items-center justify-center">
                        
                        {/* Top Dimension Line */}
                        <div className="absolute -top-6 left-8 right-8 h-4 flex items-end justify-center">
                            <div className="w-full border-b border-[#00ffff] relative flex items-center justify-center">
                                <div className="absolute left-0 bottom-[-2px] w-px h-2 bg-[#00ffff]"></div>
                                <div className="absolute right-0 bottom-[-2px] w-px h-2 bg-[#00ffff]"></div>
                                <span className="mb-2 bg-[#2a2a2a] text-[#00ffff] px-1 text-[10px] font-mono rounded">LARGURA</span>
                            </div>
                        </div>

                        {/* Left Dimension Line */}
                        <div className="absolute -left-6 top-8 bottom-8 w-4 flex items-center justify-end">
                            <div className="h-full border-r border-[#00ffff] relative flex items-center justify-center">
                                <div className="absolute top-0 right-[-2px] h-px w-2 bg-[#00ffff]"></div>
                                <div className="absolute bottom-0 right-[-2px] h-px w-2 bg-[#00ffff]"></div>
                                <span className="-rotate-90 mr-2 bg-[#2a2a2a] text-[#00ffff] px-1 text-[10px] font-mono whitespace-nowrap rounded">PROFUNDIDADE</span>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="border border-black relative">
                            <img 
                                src={editedImageSrc || floorPlanSrc} 
                                alt="Planta Baixa" 
                                className="max-w-full max-h-[70vh] object-contain bg-white block" 
                            />
                            
                            {isEditing && (
                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                    <Spinner size="lg" />
                                    <p className="mt-4 font-bold text-[#d4ac6e] animate-pulse font-mono">RECALCULANDO GEOMETRIA...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Header Overlay */}
                    <div className="absolute top-4 left-4 bg-[#3e3535] text-white px-4 py-2 rounded-md shadow-lg border border-[#5a4f4f] flex items-center gap-2 z-20">
                        <RulerIcon className="w-4 h-4 text-[#00ffff]" />
                        <span className="text-sm font-bold font-mono">VIEWPORT: TOP [WIRE]</span>
                    </div>
                </div>

                {/* Right: Controls Sidebar */}
                <aside className="w-full md:w-96 bg-white dark:bg-[#3e3535] border-l border-gray-100 dark:border-[#4a4040] flex flex-col shadow-xl z-10">
                    <div className="p-6 border-b border-gray-100 dark:border-[#4a4040] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Modificações</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                O que você deseja alterar?
                            </label>
                            <div className="relative">
                                <textarea
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Descreva a alteração... Ex: 'Mover a porta da sala 50cm para a esquerda' ou 'Adicionar uma ilha na cozinha'."
                                    className="w-full bg-gray-50 dark:bg-[#2d2424] border border-gray-200 dark:border-[#5a4f4f] rounded-xl p-4 text-sm text-[#3e3535] dark:text-[#f5f1e8] focus:ring-2 focus:ring-[#d4ac6e] focus:border-transparent outline-none resize-none shadow-inner transition-all"
                                />
                                <div className="absolute bottom-3 right-3 text-gray-400">
                                    <WandIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Comandos Rápidos</span>
                            <div className="flex flex-wrap gap-2">
                                {editSuggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPrompt(suggestion)}
                                        className="px-3 py-2 bg-gray-100 dark:bg-[#4a4040] hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] border border-transparent hover:border-[#d4ac6e] rounded-lg text-xs text-gray-600 dark:text-gray-300 transition-all text-left"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-[#2d2424]/50 border-t border-gray-100 dark:border-[#4a4040] space-y-3">
                        <button 
                            onClick={handleEdit} 
                            disabled={isEditing || !prompt.trim()} 
                            className="w-full bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEditing ? <Spinner size="sm" /> : <WandIcon className="w-5 h-5" />}
                            {isEditing ? 'Processando...' : 'Gerar Alteração'}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={onClose} 
                                className="w-full py-3 bg-white dark:bg-[#4a4040] border border-gray-200 dark:border-[#5a4f4f] text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-[#5a4f4f] transition"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={!editedImageSrc} 
                                className="w-full py-3 bg-[#3e3535] dark:bg-[#f5f1e8] text-white dark:text-[#3e3535] font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <SaveIcon /> Salvar
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
