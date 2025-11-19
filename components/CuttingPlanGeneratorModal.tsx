
import React, { useState } from 'react';
import { generateCuttingPlan } from '../services/geminiService';
import { Spinner, SparklesIcon, ToolsIcon, BlueprintIcon, RulerIcon, CheckIcon, CopyIcon } from './Shared';
import { convertMarkdownToHtml } from '../utils/helpers';
import type { ProjectHistoryItem } from '../types';

interface CuttingPlanGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const CuttingPlanGeneratorModal: React.FC<CuttingPlanGeneratorModalProps> = ({ isOpen, onClose, showAlert }) => {
    const [bomInput, setBomInput] = useState('');
    const [sheetWidth, setSheetWidth] = useState(2750); // Default common MDF sheet size
    const [sheetHeight, setSheetHeight] = useState(1830); // Updated to 1830mm standard
    const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
    const [generatedPlanImage, setGeneratedPlanImage] = useState<string | null>(null);
    const [generatedOptimization, setGeneratedOptimization] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleGenerateCuttingPlan = async () => {
        if (!bomInput.trim()) {
            showAlert('Por favor, insira a Lista de Materiais (BOM) para gerar o plano de corte.', 'Atenção');
            return;
        }
        if (!sheetWidth || !sheetHeight || sheetWidth <= 0 || sheetHeight <= 0) {
            showAlert('Por favor, insira dimensões de chapa válidas.', 'Atenção');
            return;
        }

        setIsLoading(true);
        setGeneratedPlan(null);
        setGeneratedPlanImage(null);
        setGeneratedOptimization(null);
        setCopyFeedback(null);

        try {
            // Create a dummy project object for the service call, only BOM is relevant here
            const dummyProject: ProjectHistoryItem = {
                id: 'temp',
                timestamp: Date.now(),
                name: 'Plano de Corte Manual',
                description: 'Gerado a partir de input manual',
                style: '',
                views3d: [],
                image2d: null,
                bom: bomInput,
            };

            const { text, image, optimization } = await generateCuttingPlan(dummyProject, sheetWidth, sheetHeight);
            
            setGeneratedPlan(text);
            setGeneratedPlanImage(`data:image/png;base64,${image}`);
            setGeneratedOptimization(optimization);
        } catch (error) {
            console.error('Error generating cutting plan:', error);
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao gerar o plano de corte.', 'Erro na Geração do Plano de Corte');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyText = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        setCopyFeedback('Copiado!');
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const handleClose = () => {
        setBomInput('');
        setSheetWidth(2750);
        setSheetHeight(1830);
        setGeneratedPlan(null);
        setGeneratedPlanImage(null);
        setGeneratedOptimization(null);
        setIsLoading(false);
        setCopyFeedback(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={handleClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <ToolsIcon /> Gerar Plano de Corte
                    </h2>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-4 flex-grow overflow-y-auto">
                    <div className="mb-4">
                        <label htmlFor="bom-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">
                            Cole a Lista de Materiais (BOM) aqui (formato Markdown recomendado):
                        </label>
                        <textarea
                            id="bom-input"
                            rows={8}
                            value={bomInput}
                            onChange={(e) => setBomInput(e.target.value)}
                            placeholder="Ex: ## Chapas de MDF&#10;- 2x - 700x500x18mm - Lateral&#10;- 1x - 600x500x18mm - Base"
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                    </div>
                    <div className="mb-6 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sheet-width" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Largura da Chapa (mm):</label>
                            <input
                                id="sheet-width"
                                type="number"
                                value={sheetWidth}
                                onChange={(e) => setSheetWidth(Number(e.target.value))}
                                className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="sheet-height" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Altura da Chapa (mm):</label>
                            <input
                                id="sheet-height"
                                type="number"
                                value={sheetHeight}
                                onChange={(e) => setSheetHeight(Number(e.target.value))}
                                className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateCuttingPlan}
                        disabled={isLoading || !bomInput.trim() || !sheetWidth || !sheetHeight}
                        className="w-full bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
                    >
                        {isLoading ? <Spinner size="sm" /> : <SparklesIcon />}
                        <span>{isLoading ? 'Gerando Plano...' : 'Gerar Plano de Corte com IA'}</span>
                    </button>

                    {generatedPlan && (
                        <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] relative animate-fadeIn space-y-4">
                            <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-3 flex items-center gap-2">
                                <BlueprintIcon /> Plano de Corte Gerado
                                <button 
                                    onClick={() => handleCopyText(generatedPlan)} 
                                    className="ml-auto bg-[#e6ddcd] dark:bg-[#5a4f4f] p-2 rounded-md text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040] transition flex items-center gap-1 text-sm"
                                    title="Copiar Plano de Corte"
                                >
                                    {copyFeedback ? <><CheckIcon className="w-4 h-4 text-green-500" /> {copyFeedback}</> : <><CopyIcon /> Copiar</>}
                                </button>
                            </h3>
                            {generatedPlanImage && (
                                <img src={generatedPlanImage} alt="Diagrama do Plano de Corte" className="rounded-lg w-full h-auto mb-2 border border-[#e6ddcd] dark:border-[#5a4f4f]" />
                            )}
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(generatedPlan) }} />
                            
                            {generatedOptimization && (
                                <div className="mt-4 p-3 bg-[#fffefb] dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] relative">
                                    <h4 className="font-semibold text-[#b99256] dark:text-[#d4ac6e] mb-2 flex items-center gap-1">
                                        <RulerIcon/> Dicas de Otimização
                                        <button 
                                            onClick={() => handleCopyText(generatedOptimization)} 
                                            className="ml-auto bg-[#e6ddcd] dark:bg-[#5a4f4f] p-2 rounded-md text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040] transition flex items-center gap-1 text-sm"
                                            title="Copiar Otimização"
                                        >
                                            {copyFeedback ? <><CheckIcon className="w-4 h-4 text-green-500" /> {copyFeedback}</> : <><CopyIcon /> Copiar</>}
                                        </button>
                                    </h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(generatedOptimization) }} />
                                </div>
                            )}
                        </div>
                    )}
                     {isLoading && (
                        <div className="text-center p-8">
                            <Spinner />
                            <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">A Iara está otimizando seu plano de corte e gerando o diagrama de nesting...</p>
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-end flex-shrink-0">
                    <button onClick={handleClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};
