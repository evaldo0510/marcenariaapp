import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { ProjectHistoryItem, Client } from '../types';
import { PDFExport, convertMarkdownToHtmlWithInlineStyles } from '../utils/helpers';
import { LogoIcon, DownloadIcon, SparklesIcon, Spinner, DocumentTextIcon } from './Shared';
import { estimateProjectCosts, generateProposalText } from '../services/geminiService';

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectHistoryItem;
    client?: Client;
    showAlert: (message: string, title?: string) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, project, client, showAlert }) => {
    const [costs, setCosts] = useState({ material: 0, labor: 0 });
    const [aiProposalText, setAiProposalText] = useState<string | null>(null);
    const [notes, setNotes] = useState('Validade da proposta: 15 dias.\nCondições de pagamento: 50% de entrada, 50% na entrega.\nPrazo de entrega: 30 dias úteis após a confirmação do pedido.');
    const [isEstimating, setIsEstimating] = useState(false);
    const [isWritingProposal, setIsWritingProposal] = useState(false);
    const proposalContentRef = useRef<HTMLDivElement>(null);

    const totalCost = useMemo(() => costs.material + costs.labor, [costs]);
    
    useEffect(() => {
        // Reset costs and text when a new project is loaded into the modal
        setCosts({ material: project.materialCost || 0, labor: project.laborCost || 0 });
        setAiProposalText(null);
        setNotes('Validade da proposta: 15 dias.\nCondições de pagamento: 50% de entrada, 50% na entrega.\nPrazo de entrega: 30 dias úteis após a confirmação do pedido.');
    }, [project.id, project.materialCost, project.laborCost]);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCosts(prev => ({ ...prev, [name]: Number(value) || 0 }));
    };
    
    const handleExport = () => {
        if (proposalContentRef.current) {
            PDFExport(proposalContentRef.current, `proposta-${project.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
        }
    };

    const handleSuggestCosts = async () => {
        setIsEstimating(true);
        try {
            const result = await estimateProjectCosts(project);
            setCosts({
                material: result.materialCost,
                labor: result.laborCost,
            });
        } catch (error) {
            showAlert(error instanceof Error ? error.message : 'Falha ao sugerir custos.', 'Erro na Estimativa');
        } finally {
            setIsEstimating(false);
        }
    };

    const handleGenerateProposalText = async () => {
        if (totalCost === 0) {
            showAlert("Defina os custos do projeto antes de gerar o texto da proposta.", "Custos Necessários");
            return;
        }
        setIsWritingProposal(true);
        try {
            const text = await generateProposalText(project, client?.name || '', totalCost);
            setAiProposalText(text);
        } catch (error) {
            showAlert("Erro ao gerar texto da proposta.", "Erro");
        } finally {
            setIsWritingProposal(false);
        }
    };

    if (!isOpen) return null;
    
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] rounded-lg w-full max-w-4xl max-h-[95vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e]">Gerar Proposta Comercial</h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="flex-grow overflow-y-auto">
                    <div ref={proposalContentRef} className="p-8 bg-white text-gray-800">
                        {/* Proposal Header */}
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem'}}>
                           <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <LogoIcon className="text-slate-800" />
                                <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b'}}>Proposta de Projeto</h1>
                           </div>
                           <div style={{textAlign: 'right', fontSize: '0.875rem', color: '#475569'}}>
                                <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}<br/>
                                <strong>Proposta #:</strong> {project.id.substring(5)}
                           </div>
                        </div>

                        {/* Client Info */}
                         <div style={{marginTop: '2rem'}}>
                            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Informações do Cliente</h2>
                            <p><strong>Nome:</strong> {client?.name || 'Não especificado'}</p>
                            <p><strong>Email:</strong> {client?.email || 'Não especificado'}</p>
                            <p><strong>Telefone:</strong> {client?.phone || 'Não especificado'}</p>
                        </div>
                        
                        {/* Project Details */}
                        <div style={{marginTop: '2rem'}}>
                             <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Detalhes do Projeto: {project.name}</h2>
                             <p style={{fontStyle: 'italic', color: '#334155'}}>{project.description}</p>
                        </div>

                        {/* 3D Views */}
                        <div style={{marginTop: '2rem', pageBreakBefore: 'always'}}>
                            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Visualização 3D</h2>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
                                {project.views3d.map((src, index) => (
                                    <img key={index} src={src} alt={`Vista 3D ${index + 1}`} style={{width: '100%', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}/>
                                ))}
                            </div>
                        </div>

                        {/* 2D Plan */}
                        {project.image2d && (
                            <div style={{marginTop: '2rem', pageBreakBefore: 'always'}}>
                                <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Planta Técnica</h2>
                                <img src={project.image2d} alt="Planta Baixa" style={{width: '100%', maxWidth: '80%', margin: 'auto', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}/>
                            </div>
                        )}
                        
                        {/* Bill of Materials */}
                         {project.bom && (
                            <div style={{marginTop: '2rem', pageBreakBefore: 'always'}}>
                                <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Lista de Materiais (BOM)</h2>
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtmlWithInlineStyles(project.bom) }} />
                            </div>
                        )}
                        
                         {/* Commercial Proposal Text / Notes */}
                        <div style={{marginTop: '2rem', pageBreakBefore: 'always', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}>
                             <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem'}}>Proposta Comercial</h2>
                             
                             {/* Financial Summary - Always Visible */}
                             <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem'}}>
                                <tbody>
                                    <tr>
                                        <td style={{padding: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0'}}>Custo de Material:</td>
                                        <td style={{padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0'}}>{formatCurrency(costs.material)}</td>
                                    </tr>
                                     <tr>
                                        <td style={{padding: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0'}}>Custo de Mão de Obra:</td>
                                        <td style={{padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0'}}>{formatCurrency(costs.labor)}</td>
                                    </tr>
                                     <tr style={{backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '1.125rem'}}>
                                        <td style={{padding: '0.75rem'}}>TOTAL:</td>
                                        <td style={{padding: '0.75rem', textAlign: 'right'}}>{formatCurrency(totalCost)}</td>
                                    </tr>
                                </tbody>
                             </table>

                             {/* AI Generated Content or Static Notes */}
                             {aiProposalText ? (
                                 <div style={{marginTop: '1.5rem'}}>
                                     <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtmlWithInlineStyles(aiProposalText) }} />
                                 </div>
                             ) : (
                                 <div style={{marginTop: '1.5rem'}}>
                                    <h3 style={{fontWeight: 'bold', marginBottom: '0.5rem'}}>Observações e Condições:</h3>
                                    <div style={{whiteSpace: 'pre-wrap', padding: '0.75rem', borderRadius: '0.25rem', fontStyle: 'italic', color: '#475569'}}>{notes}</div>
                                 </div>
                             )}
                        </div>

                    </div>
                </main>
                
                 <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                     <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Custo do Material (R$)</label>
                            <input type="number" name="material" value={costs.material} onChange={handleCostChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f]"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Custo da Mão de Obra (R$)</label>
                            <input type="number" name="labor" value={costs.labor} onChange={handleCostChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f]"/>
                        </div>
                         <div className="sm:col-span-2 flex gap-2">
                             <button
                                onClick={handleSuggestCosts}
                                disabled={isEstimating}
                                className="flex-1 bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {isEstimating ? <Spinner size="sm" /> : <SparklesIcon />}
                                {isEstimating ? 'Estimando...' : 'Sugerir Custos'}
                            </button>
                             <button
                                onClick={handleGenerateProposalText}
                                disabled={isWritingProposal}
                                className="flex-1 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {isWritingProposal ? <Spinner size="sm" /> : <DocumentTextIcon />}
                                {isWritingProposal ? 'Escrevendo...' : 'Escrever Proposta com IA'}
                            </button>
                        </div>
                         {!aiProposalText && (
                            <div className="sm:col-span-2">
                                 <label className="block text-sm font-medium mb-1">Notas e Condições (Modo Manual)</label>
                                 <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] text-sm"/>
                             </div>
                         )}
                     </div>
                     <div className="flex flex-col gap-2">
                        <div className="bg-[#f0e9dc] dark:bg-[#3e3535]/50 p-3 rounded-lg text-center">
                            <p className="text-sm">Valor Total da Proposta:</p>
                            <p className="text-2xl font-bold text-[#b99256] dark:text-[#d4ac6e]">{formatCurrency(totalCost)}</p>
                        </div>
                        <button onClick={handleExport} className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] text-white dark:text-[#3e3535] font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                           <DownloadIcon /> Baixar PDF
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};