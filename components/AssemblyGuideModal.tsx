
import React, { useState, useEffect, useRef } from 'react';
import { generateAssemblyDetails } from '../services/geminiService';
import { updateProjectInHistory } from '../services/historyService';
import { Spinner, ToolsIcon, CheckIcon, CopyIcon, SparklesIcon, DownloadIcon } from './Shared';
import { convertMarkdownToHtmlWithInlineStyles, PDFExport } from '../utils/helpers';
import type { ProjectHistoryItem } from '../types';

interface AssemblyGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
    onUpdateProject: (updatedProject: ProjectHistoryItem) => void;
    showAlert: (message: string, title?: string) => void;
}

export const AssemblyGuideModal: React.FC<AssemblyGuideModalProps> = ({ isOpen, onClose, project, onUpdateProject, showAlert }) => {
    const [guideContent, setGuideContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Load existing guide if available
            setGuideContent(project.assemblyDetails || null);
        }
    }, [isOpen, project]);

    const handleGenerateGuide = async () => {
        setIsLoading(true);
        setCopyFeedback(null);

        try {
            const guideText = await generateAssemblyDetails(project);
            
            setGuideContent(guideText);
            
            // Save to history immediately
            const updatedProject = { ...project, assemblyDetails: guideText };
            await updateProjectInHistory(project.id, { assemblyDetails: guideText });
            onUpdateProject(updatedProject);

        } catch (error) {
            console.error('Error generating assembly guide:', error);
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro ao gerar o guia.', 'Erro');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (guideContent) {
            navigator.clipboard.writeText(guideContent);
            setCopyFeedback('Copiado!');
            setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    const handleExportPDF = () => {
        if (contentRef.current) {
            PDFExport(contentRef.current, `guia-montagem-${project.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <ToolsIcon /> Guia de Montagem
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto">
                    {!guideContent && !isLoading ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-[#f0e9dc] dark:bg-[#3e3535] rounded-full flex items-center justify-center mx-auto mb-6 text-[#d4ac6e]">
                                <ToolsIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">
                                Gerar Instruções de Montagem
                            </h3>
                            <p className="text-[#6a5f5f] dark:text-[#c7bca9] max-w-md mx-auto mb-8">
                                A Iara analisará seu projeto 3D e criará um guia passo a passo detalhado, listando ferramentas, ferragens e dicas de segurança.
                            </p>
                            <button
                                onClick={handleGenerateGuide}
                                className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-8 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
                            >
                                <SparklesIcon />
                                Gerar Guia Agora
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-12">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-[#8a7e7e] dark:text-[#a89d8d]">Criando o passo a passo da montagem...</p>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] relative animate-fadeIn shadow-inner max-w-none">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                         <button 
                                            onClick={handleCopy} 
                                            className="bg-gray-100 p-2 rounded-md text-gray-600 hover:bg-gray-200 transition flex items-center gap-1 text-sm shadow-sm border border-gray-200"
                                            title="Copiar Texto"
                                        >
                                            {copyFeedback ? <><CheckIcon className="w-4 h-4 text-green-500" /> {copyFeedback}</> : <><CopyIcon /> Copiar</>}
                                        </button>
                                    </div>
                                    
                                    <div ref={contentRef} className="p-4 text-gray-800">
                                        <h1 className="text-2xl font-bold mb-2 text-gray-900">{project.name}</h1>
                                        <h2 className="text-lg text-gray-500 mb-6">Guia de Montagem Técnica</h2>
                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtmlWithInlineStyles(guideContent || '') }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#fffefb] dark:bg-[#4a4040] rounded-b-lg">
                    <div className="flex gap-3">
                         {guideContent && !isLoading && (
                            <>
                                <button 
                                    onClick={handleGenerateGuide} 
                                    className="text-[#d4ac6e] hover:text-[#c89f5e] font-medium text-sm flex items-center gap-2"
                                >
                                    <SparklesIcon /> Regenerar
                                </button>
                                <button 
                                    onClick={handleExportPDF} 
                                    className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition flex items-center gap-2 text-sm"
                                >
                                    <DownloadIcon /> Baixar PDF
                                </button>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};
