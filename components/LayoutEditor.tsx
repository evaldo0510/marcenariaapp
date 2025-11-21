
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#2d2424] rounded-lg w-full max-w-6xl h-[90vh] shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col overflow-hidden">
                {/* CAD Header */}
                <header className="bg-[#e6ddcd] dark:bg-[#3e3535] p-3 border-b border-gray-300 dark:border-[#5a4f4f] flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-[#b99256] dark:text-[#d4ac6e] text-sm">AutoCAD View v2.0</span>
                        <span className="text-gray-600 dark:text-gray-400">| Mode: 2D Wireframe</span>
                        <span className="text-gray-600 dark:text-gray-400">| Scale: 1:50</span>
                    </div>
                    <button onClick={onClose} className="text-red-500 font-bold hover:text-red-700 text-lg px-2">&times;</button>
                </header>

                <main className="flex-grow flex overflow-hidden">
                    {/* Main Canvas Area */}
                    <div className="flex-grow relative bg-[#f0f0f0] dark:bg-[#1a1a1a] overflow-hidden flex flex-col">
                        
                        {/* Top Ruler */}
                        <div className="h-6 bg-white dark:bg-[#2d2424] border-b border-gray-300 dark:border-[#4a4040] w-full flex items-end px-8 font-mono text-[10px] text-gray-400 select-none">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="flex-1 border-r border-gray-300 dark:border-gray-600 h-2 relative">
                                    <span className="absolute -top-3 right-0">{i * 50}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Ruler */}
                            <div className="w-6 bg-white dark:bg-[#2d2424] border-r border-gray-300 dark:border-[#4a4040] h-full flex flex-col py-8 font-mono text-[10px] text-gray-400 select-none">
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-b border-gray-300 dark:border-gray-600 w-2 self-end relative">
                                        <span className="absolute right-3 -bottom-1.5 rotate-[-90deg]">{i * 50}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Viewport with Grid */}
                            <div className="flex-1 relative flex items-center justify-center p-10 overflow-auto"
                                 style={{
                                     backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                                     backgroundSize: '20px 20px',
                                     backgroundPosition: 'center'
                                 }}>
                                
                                {/* Image Container with Technical Dimensions Overlay */}
                                <div className="relative inline-block shadow-2xl">
                                    {/* Top Dimension Line */}
                                    <div className="absolute -top-8 left-0 w-full h-6 flex items-end justify-center">
                                        <div className="w-full border-b-2 border-black dark:border-white relative flex justify-center">
                                            <div className="absolute bottom-0 left-0 w-px h-3 bg-black dark:bg-white"></div>
                                            <div className="absolute bottom-0 right-0 w-px h-3 bg-black dark:bg-white"></div>
                                            <span className="bg-[#f0f0f0] dark:bg-[#1a1a1a] px-2 mb-[-8px] text-xs font-bold font-mono text-black dark:text-white z-10">
                                                LARGURA TOTAL
                                            </span>
                                        </div>
                                    </div>

                                    {/* Left Dimension Line */}
                                    <div className="absolute -left-8 top-0 h-full w-6 flex items-center justify-end">
                                        <div className="h-full border-r-2 border-black dark:border-white relative flex items-center">
                                            <div className="absolute top-0 right-0 h-px w-3 bg-black dark:bg-white"></div>
                                            <div className="absolute bottom-0 right-0 h-px w-3 bg-black dark:bg-white"></div>
                                            <span className="bg-[#f0f0f0] dark:bg-[#1a1a1a] py-2 mr-[-8px] text-xs font-bold font-mono text-black dark:text-white rotate-[-90deg] z-10 whitespace-nowrap">
                                                PROFUNDIDADE
                                            </span>
                                        </div>
                                    </div>

                                    {/* The Floor Plan Image */}
                                    <img 
                                        src={editedImageSrc || floorPlanSrc} 
                                        alt="Planta Baixa" 
                                        className="max-w-full max-h-[60vh] object-contain bg-white" 
                                        style={{ filter: 'contrast(1.1)' }}
                                    />
                                    
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
                                            <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg shadow-lg flex flex-col items-center">
                                                <Spinner size="lg" />
                                                <p className="mt-2 font-bold text-[#d4ac6e]">Processando Alterações CAD...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Controls */}
                    <aside className="w-80 bg-white dark:bg-[#3e3535] border-l border-gray-200 dark:border-[#4a4040] flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-[#4a4040]">
                            <h3 className="font-bold text-[#b99256] dark:text-[#d4ac6e] text-sm uppercase tracking-wider">Comandos de Edição</h3>
                        </div>
                        
                        <div className="p-4 flex-grow overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Prompt de Comando</label>
                                <textarea
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Mover porta 20cm para esquerda, Adicionar ilha central..."
                                    className="w-full bg-[#f0f0f0] dark:bg-[#2d2424] border border-gray-300 dark:border-[#5a4f4f] rounded p-3 text-sm font-mono text-[#3e3535] dark:text-[#f5f1e8] focus:ring-1 focus:ring-[#d4ac6e] outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Atalhos Rápidos</label>
                                <div className="space-y-2">
                                    {editSuggestions.map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setPrompt(suggestion)}
                                            className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-[#2d2424] border border-gray-200 dark:border-[#5a4f4f] rounded hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] text-xs text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-[#4a4040] bg-gray-50 dark:bg-[#2d2424]">
                            <div className="flex gap-2">
                                <button onClick={handleEdit} disabled={isEditing} className="flex-1 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                                    {isEditing ? <Spinner size="sm" /> : <WandIcon className="w-4 h-4" />}
                                    {isEditing ? 'Renderizando...' : 'Aplicar'}
                                </button>
                                <button onClick={handleSave} disabled={!editedImageSrc} className="flex-1 bg-[#3e3535] dark:bg-[#f5f1e8] text-white dark:text-[#3e3535] font-bold py-3 rounded shadow-sm hover:opacity-90 transition disabled:opacity-50 text-sm">
                                    Salvar DWG/PNG
                                </button>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
};
