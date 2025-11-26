
import React, { useState } from 'react';
import { estimateProjectCosts } from '../services/geminiService';
import { Spinner, SparklesIcon, CurrencyDollarIcon, CheckIcon, CopyIcon, ArrowLeftIcon } from './Shared';
import type { ProjectHistoryItem } from '../types';

interface CostEstimatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
    onBack?: () => void;
}

export const CostEstimatorModal: React.FC<CostEstimatorModalProps> = ({ isOpen, onClose, showAlert, onBack }) => {
    const [bomInput, setBomInput] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [estimatedMaterialCost, setEstimatedMaterialCost] = useState<number | null>(null);
    const [estimatedLaborCost, setEstimatedLaborCost] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const totalEstimatedCost = estimatedMaterialCost !== null && estimatedLaborCost !== null
        ? estimatedMaterialCost + estimatedLaborCost
        : null;

    const handleEstimateCosts = async () => {
        if (!bomInput.trim()) {
            showAlert('Por favor, insira a Lista de Materiais (BOM) para estimar os custos.', 'Atenção');
            return;
        }

        setIsLoading(true);
        setEstimatedMaterialCost(null);
        setEstimatedLaborCost(null);
        setCopyFeedback(null);

        try {
            // Create a dummy project object for the service call, BOM and basic details are relevant
            const dummyProject: ProjectHistoryItem = {
                id: 'temp',
                timestamp: Date.now(),
                name: projectName || 'Projeto Genérico',
                description: projectDescription || 'Descrição não fornecida',
                style: '',
                views3d: [],
                image2d: null,
                bom: bomInput,
            };

            const { materialCost, laborCost } = await estimateProjectCosts(dummyProject);
            
            setEstimatedMaterialCost(materialCost);
            setEstimatedLaborCost(laborCost);
        } catch (error) {
            console.error('Error estimating costs:', error);
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao estimar os custos.', 'Erro na Estimativa de Custos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCosts = () => {
        if (estimatedMaterialCost !== null && estimatedLaborCost !== null) {
            const textToCopy = `Estimativa de Custos para ${projectName || 'o Projeto'}:\n` +
                               `Custo de Material: ${formatCurrency(estimatedMaterialCost)}\n` +
                               `Custo de Mão de Obra: ${formatCurrency(estimatedLaborCost)}\n` +
                               `Total Estimado: ${formatCurrency(totalEstimatedCost || 0)}`;
            navigator.clipboard.writeText(textToCopy);
            setCopyFeedback('Copiado!');
            setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    const handleClose = () => {
        setBomInput('');
        setProjectName('');
        setProjectDescription('');
        setEstimatedMaterialCost(null);
        setEstimatedLaborCost(null);
        setIsLoading(false);
        setCopyFeedback(null);
        onClose();
    };

    if (!isOpen) return null;
    
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={handleClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8]" title="Voltar">
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <CurrencyDollarIcon /> Estimar Custos
                        </h2>
                    </div>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-4 flex-grow overflow-y-auto">
                     <div className="mb-4">
                        <label htmlFor="project-name-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Nome do Projeto (Opcional):</label>
                        <input
                            id="project-name-input"
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Ex: Armário de Cozinha"
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="project-description-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Descrição do Projeto (Opcional):</label>
                        <textarea
                            id="project-description-input"
                            rows={3}
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="Ex: Um armário em MDF, portas de correr, para uma cozinha pequena."
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="bom-input-cost" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">
                            Cole a Lista de Materiais (BOM) aqui (formato Markdown recomendado):
                        </label>
                        <textarea
                            id="bom-input-cost"
                            rows={8}
                            value={bomInput}
                            onChange={(e) => setBomInput(e.target.value)}
                            placeholder="Ex: ## Chapas de MDF&#10;- 2x - 700x500x18mm - Lateral&#10;- 1x - 600x500x18mm - Base"
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                    </div>

                    <button
                        onClick={handleEstimateCosts}
                        disabled={isLoading || !bomInput.trim()}
                        className="w-full bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
                    >
                        {isLoading ? <Spinner size="sm" /> : <SparklesIcon />}
                        <span>{isLoading ? 'Estimando Custos...' : 'Estimar Custos com IA'}</span>
                    </button>

                    {(estimatedMaterialCost !== null || isLoading) && (
                        <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] relative animate-fadeIn">
                            <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-3 flex items-center gap-2">
                                Orçamento Estimado
                                {estimatedMaterialCost !== null && (
                                    <button 
                                        onClick={handleCopyCosts} 
                                        className="ml-auto bg-[#e6ddcd] dark:bg-[#5a4f4f] p-2 rounded-md text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040] transition flex items-center gap-1 text-sm"
                                        title="Copiar Orçamento"
                                    >
                                        {copyFeedback ? <><CheckIcon className="w-4 h-4 text-green-500" /> {copyFeedback}</> : <><CopyIcon /> Copiar</>}
                                    </button>
                                )}
                            </h3>
                            {isLoading ? (
                                <div className="text-center p-8">
                                    <Spinner />
                                    <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">A Iara está calculando os custos...</p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-[#3e3535] dark:text-[#f5f1e8]">
                                    <div className="flex justify-between items-center">
                                        <span>Custo de Material:</span>
                                        <span className="font-semibold">{formatCurrency(estimatedMaterialCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Custo de Mão de Obra:</span>
                                        <span className="font-semibold">{formatCurrency(estimatedLaborCost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-[#e6ddcd] dark:border-[#4a4040]">
                                        <span className="font-bold text-lg text-[#b99256] dark:text-[#d4ac6e]">Total Estimado:</span>
                                        <span className="font-bold text-lg text-[#b99256] dark:text-[#d4ac6e]">{formatCurrency(totalEstimatedCost || 0)}</span>
                                    </div>
                                </div>
                            )}
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
