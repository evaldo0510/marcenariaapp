import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Types
import type { AlertState, ImageModalState, ProjectHistoryItem, Finish, Client, PricedBomItem, Comment } from './types';

// Services
import { projectTypePresets, stylePresets } from './services/presetService';
import { generateImage, generateText, editImage, generateCuttingPlan, editFloorPlan, estimateProjectCosts, generateAssemblyDetails, parseBomToList, findSupplierPrice, calculateFinancialSummary, fetchSupplierCatalog, calculateShippingCost } from './services/geminiService';
import { getHistory, addProjectToHistory, updateProjectInHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish } from './services/historyService';
import { convertMarkdownToHtml } from './utils/helpers';


// Components
import { Header } from './components/Header';
import { AlertModal, ImageModal, ConfirmationModal, Spinner, WandIcon, BlueprintIcon, CubeIcon, ToolsIcon, DocumentDuplicateIcon, BookIcon, CheckIcon, StarIcon, SparklesIcon, RulerIcon, LogoIcon, CurrencyDollarIcon, WhatsappIcon, StoreIcon, UsersIcon, TagIcon, SearchIcon, MessageIcon, TimerIcon, CatalogIcon, DollarCircleIcon, ARIcon, VideoIcon, CommunityIcon, ShareIcon, CopyIcon, EmailIcon, ProIcon } from './components/Shared';
import { StyleAssistant } from './components/StyleAssistant';
import { FinishesSelector } from './components/FinishesSelector';
import { ImageUploader } from './components/ImageUploader';
import { VoiceInputButton } from './components/VoiceInputButton';
import { HistoryPanel } from './components/HistoryPanel';
import { AboutModal } from './components/AboutModal';
import { LiveAssistant } from './components/LiveAssistant';
import { ResearchAssistant } from './components/ResearchAssistant';
import { DistributorFinder } from './components/DistributorFinder';
import { ClientPanel } from './components/ClientPanel';
import { ImageEditor } from './components/ImageEditor';
import { InteractiveImageViewer } from './components/InteractiveImageViewer';
import { LayoutEditor } from './components/LayoutEditor';
import { ProposalModal } from './components/ProposalModal';
import { NewViewGenerator } from './components/NewViewGenerator';
import { BomGeneratorModal } from './components/BomGeneratorModal';
import { CuttingPlanGeneratorModal } from './components/CuttingPlanGeneratorModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';

// --- SUB-COMPONENTS ---
const Project3DViewer: React.FC<{
  views: string[];
  onEditClick: (src: string) => void;
  onARClick: () => void;
  projectName: string;
}> = ({ views, onEditClick, onARClick, projectName }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => { setActiveIndex(0); }, [views]);
    
    if (!views || views.length === 0) return <p className="text-[#8a7e7e] dark:text-[#a89d8d]">Nenhuma visualização 3D disponível.</p>;
    const activeView = views[activeIndex];

    return (
        <div>
            <div className="relative group mb-4">
                <InteractiveImageViewer src={activeView} alt={`Vista 3D ${activeIndex + 1}`} projectName={projectName} />
                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={onARClick} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <ARIcon /> Ver em RA
                    </button>
                    <button onClick={() => onEditClick(activeView)} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <WandIcon /> Editar com Iara
                    </button>
                </div>
            </div>
            {views.length > 1 && (
                 <div className="flex gap-2 overflow-x-auto pb-2">
                    {views.map((view, index) => (
                        <button key={index} onClick={() => setActiveIndex(index)} className={`flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-md overflow-hidden border-2 transition-all ${activeIndex === index ? 'border-[#d4ac6e] scale-105' : 'border-transparent hover:border-[#c7bca9]'}`}>
                            <img src={view} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ... Future Feature Teaser Panels ...
const WhatsappIntegrationPanel: React.FC = () => (<div className="bg-[#f0e9dc] dark:bg-[#2d2424]/50 border-2 border-dashed border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-8 text-center animate-fadeIn h-full flex flex-col justify-center"><div className="flex justify-center items-center mb-4"><WhatsappIcon className="w-8 h-8 text-green-500" /></div><h2 className="text-2xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-2">Integração com WhatsApp</h2><p className="text-[#6a5f5f] dark:text-[#c7bca9] mb-4">Envie orçamentos, notificações e receba atualizações dos clientes diretamente pelo WhatsApp.</p><span className="inline-block bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wide">Em breve - beta Q1/2026</span></div>);
const AutoPurchasePanel: React.FC = () => (<div className="bg-[#f0e9dc] dark:bg-[#2d2424]/50 border-2 border-dashed border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-8 text-center animate-fadeIn h-full flex flex-col justify-center"><div className="flex justify-center items-center mb-4"><StoreIcon className="w-8 h-8 text-blue-500" /></div><h2 className="text-2xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-2">Compra Automática de Materiais</h2><p className="text-[#6a5f5f] dark:text-[#c7bca9] mb-4">Conecte o sistema com distribuidoras: faça pedidos de MDF e insumos por voz ou clique.</p><span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wide">Disponível futuramente</span></div>);
const EmployeeManagementPanel: React.FC = () => (<div className="bg-[#f0e9dc] dark:bg-[#2d2424]/50 border-2 border-dashed border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-8 text-center animate-fadeIn h-full flex flex-col justify-center"><div className="flex justify-center items-center mb-4"><UsersIcon className="w-8 h-8 text-yellow-500" /></div><h2 className="text-2xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-2">Gestão de Funcionários</h2><p className="text-[#6a5f5f] dark:text-[#c7bca9] mb-4">Controle de equipe, folha de pagamento, produtividade e permissões por usuário.</p><span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wide">Em breve - Q3 2026</span></div>);

// ... Modals ...
const Generate3DFrom2DModal: React.FC<{isOpen: boolean; onClose: () => void; onGenerate: (style: string, finish: string, additionalPrompt: string) => void; project: ProjectHistoryItem; isGenerating: boolean;}> = ({ isOpen, onClose, onGenerate, project, isGenerating }) => {
    const [style, setStyle] = useState(project.style); const [finish, setFinish] = useState(''); const [additionalPrompt, setAdditionalPrompt] = useState('');
    useEffect(() => { if (isOpen) { setStyle(project.style); setFinish(project.selectedFinish ? `${project.selectedFinish.finish.name} da ${project.selectedFinish.manufacturer}` : 'madeira clara'); setAdditionalPrompt(''); } }, [isOpen, project]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><CubeIcon /> Gerar 3D a partir da Planta Baixa</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 flex-grow overflow-y-auto space-y-6"><div><h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Planta Baixa de Referência</h3><img src={project.image2d!} alt="Planta baixa" className="w-full max-w-sm mx-auto h-auto object-contain rounded-md bg-white p-1" /></div><div><label htmlFor="style-select" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Estilo de Design</label><select id="style-select" value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition">{stylePresets.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label htmlFor="finish-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Acabamento Principal</label><input id="finish-input" type="text" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Ex: Madeira clara, MDF branco fosco" className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition" /></div><div><label htmlFor="additional-prompt-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Instruções Adicionais (Opcional)</label><textarea id="additional-prompt-input" rows={3} value={additionalPrompt} onChange={(e) => setAdditionalPrompt(e.target.value)} placeholder="Ex: Adicionar iluminação de LED, com fundo de estúdio neutro" className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition" /></div></main><footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-end gap-4"><button onClick={onClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button><button onClick={() => onGenerate(style, finish, additionalPrompt)} disabled={isGenerating} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50 flex items-center gap-2">{isGenerating ? <Spinner size="sm" /> : <WandIcon />}{isGenerating ? 'Gerando...' : 'Gerar Visualização 3D'}</button></footer></div></div>);
};
const FutureFeatureModal: React.FC<{isOpen: boolean, onClose: () => void, title: string, icon: React.ReactNode}> = ({isOpen, onClose, title, icon}) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">{icon} {title}</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 text-center"><p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Esta funcionalidade está em desenvolvimento e foi liberada para você em acesso antecipado.</p><p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mt-2">Em breve, mais novidades por aqui!</p></main></div></div>);
};
const SupplierPricingModal: React.FC<{isOpen: boolean; onClose: () => void; project: ProjectHistoryItem; onUpdateCosts: (newMaterialCost: number) => void; showAlert: (message: string, title?: string) => void;}> = ({ isOpen, onClose, project, onUpdateCosts, showAlert }) => {
    const [pricedItems, setPricedItems] = useState<PricedBomItem[]>([]); const [isParsing, setIsParsing] = useState(true);
    useEffect(() => { const parseBom = async () => { if (isOpen && project.bom) { setIsParsing(true); try { const parsed = await parseBomToList(project.bom); setPricedItems(parsed.map(item => ({ ...item, isSearching: false }))); } catch (error) { showAlert(error instanceof Error ? error.message : "Erro ao analisar BOM.", "Erro"); onClose(); } finally { setIsParsing(false); } } }; parseBom(); }, [isOpen, project.bom, showAlert, onClose]);
    const handleFindPrice = async (index: number) => { const items = [...pricedItems]; items[index].isSearching = true; setPricedItems(items); try { const item = items[index]; const description = `${item.qty} ${item.item} (${item.dimensions})`; const result = await findSupplierPrice(description); items[index] = { ...items[index], ...result, price: result.price }; } catch (error) { showAlert(error instanceof Error ? error.message : "Erro ao buscar preço.", "Erro"); } finally { items[index].isSearching = false; setPricedItems(items); } };
    const newTotalCost = useMemo(() => pricedItems.reduce((total, item) => total + ((parseInt(item.qty.match(/(\d+)/)?.[0] || '1', 10)) * (item.price || 0)), 0), [pricedItems]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><TagIcon /> Cotação com Fornecedores (Simulação)</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-4 flex-grow overflow-y-auto">{isParsing ? <div className="flex justify-center items-center h-full"><Spinner /></div> : <ul className="space-y-2">{pricedItems.map((item, index) => (<li key={index} className="bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><div className="flex-grow"><p className="font-semibold text-[#3e3535] dark:text-[#f5f1e8]">{item.qty} {item.item}</p><p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9]">{item.dimensions}</p>{item.supplier && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-700 dark:text-amber-500 hover:underline">Fonte: {item.supplier}</a>}</div><div className="flex items-center gap-3 w-full sm:w-auto"><div className="flex-grow sm:flex-grow-0 text-lg font-semibold text-right w-32">{item.price ? item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</div><button onClick={() => handleFindPrice(index)} disabled={item.isSearching} className="bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] p-2 rounded-lg transition disabled:opacity-50">{item.isSearching ? <Spinner size="sm" /> : <SearchIcon />}</button></div></li>))}</ul>}</main><footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex flex-col sm:flex-row justify-between items-center gap-4"><div className="text-center sm:text-left"><span className="text-sm text-[#6a5f5f] dark:text-[#c7bca9]">Novo Custo de Material:</span><p className="text-2xl font-bold text-[#b99256] dark:text-[#d4ac6e]">{newTotalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div><button onClick={() => onUpdateCosts(newTotalCost)} disabled={newTotalCost === 0} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-6 rounded-lg hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50">Aplicar Novos Custos</button></footer></div></div>);
};
const ARViewerModal: React.FC<{isOpen: boolean; onClose: () => void;}> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><ARIcon /> Visualizador de Realidade Aumentada</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 text-center"><p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Esta funcionalidade permitirá que você visualize o projeto no seu ambiente através da câmera.</p><p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mt-2">Em desenvolvimento.</p></main></div></div>);
};
const LearningHubModal: React.FC<{isOpen: boolean; onClose: () => void;}> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl max-w-2xl w-full shadow-xl" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><CommunityIcon /> Hub de Aprendizagem</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"><a href="#" onClick={(e) => e.preventDefault()} className="block p-4 bg-[#f0e9dc] dark:bg-[#4a4040] rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] transition"><div className="flex items-center gap-3"><VideoIcon className="w-8 h-8 text-red-500" /><div><h3 className="font-semibold">Vídeos Tutoriais</h3><p className="text-sm text-[#8a7e7e]">Aprenda a usar todo o potencial do MarcenApp.</p></div></div></a><a href="#" onClick={(e) => e.preventDefault()} className="block p-4 bg-[#f0e9dc] dark:bg-[#4a4040] rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] transition"><div className="flex items-center gap-3"><UsersIcon className="w-8 h-8 text-blue-500" /><div><h3 className="font-semibold">Comunidade</h3><p className="text-sm text-[#8a7e7e]">Troque experiências com outros marceneiros.</p></div></div></a></main></div></div>);
};

// ... Admin Panels ...
const CollaborationPanel: React.FC<{project: ProjectHistoryItem; onUpdate: (updates: Partial<ProjectHistoryItem>) => void; userEmail: string;}> = ({ project, onUpdate, userEmail }) => {
    const [comment, setComment] = useState('');
    const comments = project.comments || [];
    const handleAddComment = (e: React.FormEvent) => { e.preventDefault(); if (!comment.trim()) return; const newComment: Comment = { id: `comment_${Date.now()}`, user: userEmail.split('@')[0], text: comment, timestamp: Date.now() }; onUpdate({ comments: [...comments, newComment] }); setComment(''); };
    return (<div className="space-y-4"><h3 className="text-xl font-semibold mb-3 text-[#3e3535] dark:text-[#c7bca9]">Colaboração e Comentários</h3><div className="space-y-2">{comments.map(c => <div key={c.id} className="p-2 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-md"><p className="text-sm"><strong className="text-[#b99256]">{c.user}:</strong> {c.text}</p><p className="text-xs text-right text-[#8a7e7e]">{new Date(c.timestamp).toLocaleString()}</p></div>)}</div><form onSubmit={handleAddComment} className="flex gap-2"><input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Adicionar comentário..." className="flex-grow bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border-2 border-[#e6ddcd] dark:border-[#4a4040] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" /><button type="submit" className="bg-[#d4ac6e] text-[#3e3535] px-4 rounded-lg font-semibold">Enviar</button></form></div>);
};
const ProjectTimer: React.FC<{project: ProjectHistoryItem; onUpdate: (updates: Partial<ProjectHistoryItem>) => void;}> = ({ project, onUpdate }) => {
    const [isRunning, setIsRunning] = useState(false); const [elapsed, setElapsed] = useState(project.timeTracked || 0); const intervalRef = useRef<number | null>(null); const startTimeRef = useRef(0);
    useEffect(() => { setElapsed(project.timeTracked || 0); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [project.timeTracked]);
    const start = () => { startTimeRef.current = Date.now(); setIsRunning(true); intervalRef.current = window.setInterval(() => setElapsed(prev => prev + (Date.now() - startTimeRef.current)), 1000); };
    const stop = () => { setIsRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); onUpdate({ timeTracked: elapsed }); };
    const formatTime = (ms: number) => { const totalSeconds = Math.floor(ms / 1000); const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const seconds = totalSeconds % 60; return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; };
    return (<div className="text-center p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg"><h4 className="font-semibold mb-2">Cronômetro de Tarefas</h4><div className="text-4xl font-mono mb-4">{formatTime(elapsed)}</div><div className="flex gap-2 justify-center">{!isRunning ? <button onClick={start} className="bg-green-500 text-white px-4 py-2 rounded-lg">Iniciar</button> : <button onClick={stop} className="bg-red-500 text-white px-4 py-2 rounded-lg">Parar</button>}</div></div>);
};
const SupplierCatalog: React.FC = () => {
    const [items, setItems] = useState<any[]>([]); const [isLoading, setIsLoading] = useState(true);
    useEffect(() => { fetchSupplierCatalog().then(data => { setItems(data); setIsLoading(false); }); }, []);
    return (<div><h3 className="text-xl font-semibold mb-3 text-[#3e3535] dark:text-[#c7bca9]">Catálogo de Fornecedores (Simulação)</h3>{isLoading ? <Spinner/> : <div className="grid grid-cols-2 gap-2">{items.map(item => (<div key={item.id} className="p-2 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-md text-sm"><p className="font-bold">{item.name}</p><p>{item.price}</p></div>))}</div>}</div>);
};
const FinancialPanel: React.FC<{project: ProjectHistoryItem; client: Client | undefined; onUpdate: (updates: Partial<ProjectHistoryItem>) => void;}> = ({ project, client, onUpdate }) => {
    const summary = calculateFinancialSummary(project);
    const [shippingResult, setShippingResult] = useState<{cost: number; eta: string} | null>(null);
    const handleCalcShipping = async () => { if (client?.address) { const res = await calculateShippingCost(client.address); setShippingResult(res); } };
    return (<div className="space-y-4"><h3 className="text-xl font-semibold mb-3 text-[#3e3535] dark:text-[#c7bca9]">Resumo Financeiro</h3><div className="p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg grid grid-cols-3 gap-2 text-center"><div ><p className="text-sm">Receita</p><p className="font-bold text-lg">{summary.revenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div><div><p className="text-sm">Lucro</p><p className="font-bold text-lg">{summary.profit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div><div><p className="text-sm">Margem</p><p className="font-bold text-lg">{summary.margin.toFixed(1)}%</p></div></div><div><label>Valor do Projeto (Venda):</label><input type="number" value={project.projectValue || ''} onChange={e => onUpdate({projectValue: Number(e.target.value)})} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg"/></div><div><h4 className="font-semibold">Frete</h4><button onClick={handleCalcShipping} disabled={!client?.address} className="bg-[#e6ddcd] dark:bg-[#4a4040] p-2 rounded-lg w-full disabled:opacity-50">Calcular para {client?.name || 'cliente'}</button>{shippingResult && <p>Custo: {shippingResult.cost.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}, Entrega: {shippingResult.eta}</p>}</div></div>);
};

// --- MAIN APP COMPONENT ---
interface AppProps { 
  onLogout: () => void; 
  userEmail: string;
}
export const App: React.FC<AppProps> = ({ onLogout, userEmail }) => {
    // --- STATE MANAGEMENT ---
    const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
    const [alert, setAlert] = useState<AlertState>({ show: false, title: '', message: '' });
    const [imageModal, setImageModal] = useState<ImageModalState>({ show: false, src: '' });
    const [confirmation, setConfirmation] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; }>({ show: false, title: '', message: '', onConfirm: () => {} });
    const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [favoriteFinishes, setFavoriteFinishes] = useState<Finish[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isLiveOpen, setIsLiveOpen] = useState(false);
    const [isResearchOpen, setIsResearchOpen] = useState(false);
    const [isDistributorOpen, setIsDistributorOpen] = useState(false);
    const [isClientsOpen, setIsClientsOpen] = useState(false);
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
    const [isProposalOpen, setIsProposalOpen] = useState(false);
    const [isNewViewGeneratorOpen, setIsNewViewGeneratorOpen] = useState(false);
    const [isGenerate3DModalOpen, setIsGenerate3DModalOpen] = useState(false);
    const [isBomGeneratorOpen, setIsBomGeneratorOpen] = useState(false);
    const [isCuttingPlanGeneratorOpen, setIsCuttingPlanGeneratorOpen] = useState(false);
    const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState(false);
    const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);
    const [isAutoPurchaseOpen, setIsAutoPurchaseOpen] = useState(false);
    const [isEmployeeManagementOpen, setIsEmployeeManagementOpen] = useState(false);
    const [isSupplierPricingOpen, setIsSupplierPricingOpen] = useState(false);
    const [isARViewerOpen, setIsARViewerOpen] = useState(false);
    const [isLearningHubOpen, setIsLearningHubOpen] = useState(false);
    const [isEncontraProOpen, setIsEncontraProOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [projectType, setProjectType] = useState(projectTypePresets[0].id);
    const [style, setStyle] = useState(stylePresets[0]);
    const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string } | null>(null);
    const [uploadedImages, setUploadedImages] = useState<{ data: string; mimeType: string }[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);
    const [projectForNewView, setProjectForNewView] = useState<ProjectHistoryItem | null>(null);
    const [projectFor3DGeneration, setProjectFor3DGeneration] = useState<ProjectHistoryItem | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string>('');
    const [active2DView, setActive2DView] = useState<'floorPlan' | 'crossSection'>('floorPlan');
    const [activeProjectTab, setActiveProjectTab] = useState<'overview' | 'collab' | 'production' | 'financial'>('overview');
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [shareCopyFeedback, setShareCopyFeedback] = useState<string | null>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const isAdmin = useMemo(() => userEmail.toLowerCase() === 'evaldo0510@gmail.com', [userEmail]);

    // --- EFFECTS ---
    useEffect(() => { 
        const loadData = async () => { 
            setHistory(await getHistory()); 
            setClients(await getClients()); 
            setFavoriteFinishes(await getFavoriteFinishes()); 
        }; 
        loadData(); 
    }, []);
    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // --- HELPERS & HANDLERS ---
    const showAlert = useCallback((message: string, title = 'Aviso') => setAlert({ show: true, title, message }), []);
    const resetToNewProject = () => { setCurrentProject(null); setDescription(''); setAdditionalDetails(''); setProjectType(projectTypePresets[0].id); setStyle(stylePresets[0]); setSelectedFinish(null); setUploadedImages(null); descriptionInputRef.current?.focus(); };
    const viewProject = (project: ProjectHistoryItem) => { setCurrentProject(project); setDescription(project.description); setAdditionalDetails(project.details || ''); setStyle(project.style); setSelectedFinish(project.selectedFinish || null); const preset = projectTypePresets.find(p => project.name.toLowerCase().includes(p.name.toLowerCase())); setProjectType(preset ? preset.id : projectTypePresets[0].id); setUploadedImages(project.uploadedReferenceImageUrls ? project.uploadedReferenceImageUrls.map(url => { const parts = url.split(','); return { data: parts[1], mimeType: url.match(/:(.*?);/)?.[1] || 'image/png' }; }) : null); setIsHistoryOpen(false); window.scrollTo(0, 0); };
    const openImageEditor = (imageSrc: string) => { setImageToEdit(imageSrc); setIsImageEditorOpen(true); };
    const handleUpdateCurrentProject = async (updates: Partial<ProjectHistoryItem>) => { if (!currentProject) return; const updated = await updateProjectInHistory(currentProject.id, updates); if(updated) { setCurrentProject(updated); setHistory(await getHistory()); } };

    const handleShareByLink = () => {
        if (!currentProject) return;
        const link = `https://marcenapp.ai/project/${currentProject.id}`;
        navigator.clipboard.writeText(link).then(() => {
            setShareCopyFeedback('Link copiado!');
            setTimeout(() => {
                setShareCopyFeedback(null);
                setIsShareMenuOpen(false);
            }, 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            showAlert('Não foi possível copiar o link.');
            setIsShareMenuOpen(false);
        });
    };

    const handleShareByEmail = () => {
        if (!currentProject) return;
        const link = `https://marcenapp.ai/project/${currentProject.id}`;
        const subject = encodeURIComponent(`Projeto: ${currentProject.name}`);
        const body = encodeURIComponent(`Olá,\n\nConfira este projeto que criei no MarcenApp:\n\n${currentProject.name}\n${link}\n\n`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setIsShareMenuOpen(false);
    };


    // --- CORE GENERATION LOGIC ---
    const handleGenerateProject = async () => {
        if (!description.trim()) { showAlert('Por favor, descreva o projeto que você deseja criar.'); return; }
        setIsLoading(true); setCurrentProject(null);
        try {
            const activePreset = projectTypePresets.find(p => p.id === projectType); if (!activePreset) throw new Error("Tipo de projeto inválido.");
            const genderArticle = activePreset.gender === 'f' ? 'uma' : 'um';
            const finishDescription = selectedFinish ? `O acabamento principal é '${selectedFinish.finish.name}' da ${selectedFinish.manufacturer}. ${selectedFinish.handleDetails ? `Detalhe de puxador: '${selectedFinish.handleDetails}'.` : ''}` : 'O acabamento deve ser sugerido pela IA, com base no estilo.';
            const fullDescription = `${description.trim()} ${additionalDetails.trim() ? `\n\n**Detalhes Adicionais:**\n${additionalDetails.trim()}` : ''}`;
            const prompt3D = `**Missão:** Gerar uma imagem 3D fotorrealista com qualidade de marketing para um catálogo de design de interiores de luxo.\n\n**Objeto Principal:** ${genderArticle} ${activePreset.name.toLowerCase()} no estilo ${style}.\n**Descrição Detalhada do Design:** "${fullDescription}".\n**Especificações de Material e Acabamento:** ${finishDescription}\n\n**Diretrizes de Renderização (Inflexíveis):**\n- **Iluminação:** Use uma configuração de iluminação de estúdio profissional com múltiplas fontes de luz para criar sombras suaves e realistas (soft shadows) e realçar o volume e a textura do móvel. Inclua oclusão de ambiente para profundidade.\n- **Realismo:** O resultado final deve ser indistinguishable de uma fotografia. Preste atenção aos detalhes: reflexos sutis nas superfícies, a textura tátil dos materiais (veios da madeira, porosidade da pedra, etc.) e a física da luz.\n- **Câmera e Composição:** Utilize uma perspectiva de câmera que valorize o design. O fundo deve ser neutro e desfocado (bokeh) para focar a atenção no móvel.\n- **Saída:** Renderize a imagem em alta resolução.`;
            const prompt2D = `**Projeto para Detalhamento Técnico:**\n- **Tipo de Móvel:** ${activePreset.name}\n- **Estilo:** ${style}\n- **Descrição Detalhada do Design:** "${fullDescription}"\n- **Acabamento Principal:** ${selectedFinish ? `${selectedFinish.finish.name} da ${selectedFinish.manufacturer}` : 'Não especificado'}\n\n**Instrução Crítica:** Gere uma prancha técnica 2D detalhada deste projeto, pronta para fabricação. A prancha DEVE incluir:\n1.  **Vista Frontal:** Clara e com todas as cotas principais.\n2.  **Vista Lateral:** Mostrando a profundidade e detalhes construtivos.\n3.  **Vista Superior (Planta Baixa):** Com cotas de largura e profundidade.\n4.  **Dimensionamento Completo:** Adicione todas as cotas (medidas) necessárias em milímetros (mm) em todas as vistas para garantir a fabricação precisa.\nSiga estritamente as suas diretrizes de especialista em AutoCAD para um resultado profissional.`;
            const [generated3DBase64, generated2DBase64] = await Promise.all([generateImage(prompt3D, uploadedImages, '3d-render'), generateImage(prompt2D, uploadedImages, '2d-diagram')]);
            const newProjectData: Omit<ProjectHistoryItem, 'id' | 'timestamp'> = { name: `${activePreset.name} ${style}`, description, details: additionalDetails, views3d: [`data:image/png;base64,${generated3DBase64}`], image2d: `data:image/png;base64,${generated2DBase64}`, style, selectedFinish, bom: null, uploadedReferenceImageUrls: uploadedImages?.map(img => `data:${img.mimeType};base64,${img.data}`), crossSectionImage: null };
            const updatedHistory = await addProjectToHistory(newProjectData);
            setHistory(updatedHistory); setCurrentProject(updatedHistory[0]);
        } catch (error) { showAlert(error instanceof Error ? error.message : "Erro na Geração do Projeto", "Erro na Geração do Projeto"); } finally { setIsLoading(false); }
    };

    // --- RENDER ---
    return (
        <div className={`theme-${theme} font-sans min-h-screen bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8]`}>
            {/* Modals */}
            <AlertModal state={alert} onClose={() => setAlert({ ...alert, show: false })} />
            <ImageModal state={imageModal} onClose={() => setImageModal({ ...imageModal, show: false })} />
            <ConfirmationModal show={confirmation.show} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation({ ...confirmation, show: false })} />
            <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
            <LiveAssistant isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} showAlert={showAlert} />
            <ResearchAssistant isOpen={isResearchOpen} onClose={() => setIsResearchOpen(false)} showAlert={showAlert} />
            <DistributorFinder isOpen={isDistributorOpen} onClose={() => setIsDistributorOpen(false)} showAlert={showAlert} />
            <ClientPanel isOpen={isClientsOpen} onClose={() => setIsClientsOpen(false)} clients={clients} projects={history} onSaveClient={async (c) => setClients(await saveClient(c))} onDeleteClient={(id) => setConfirmation({ show: true, title: "Confirmar Exclusão", message: `Deseja excluir o cliente "${clients.find(c=>c.id===id)?.name}"?`, onConfirm: async () => { setClients(await removeClient(id)); setConfirmation(c=>({...c, show: false})); } })} onViewProject={viewProject} />
            {isImageEditorOpen && <ImageEditor isOpen={isImageEditorOpen} imageSrc={imageToEdit} onClose={() => setIsImageEditorOpen(false)} onSave={async (newB64) => { if (!currentProject) return; const updatedViews = [...currentProject.views3d, `data:image/png;base64,${newB64}`]; await handleUpdateCurrentProject({ views3d: updatedViews }); setIsImageEditorOpen(false); }} showAlert={showAlert} />}
            {currentProject && currentProject.image2d && isLayoutEditorOpen && <LayoutEditor isOpen={isLayoutEditorOpen} floorPlanSrc={currentProject.image2d} projectDescription={currentProject.description} onClose={() => setIsLayoutEditorOpen(false)} onSave={async (newB64) => { await handleUpdateCurrentProject({ image2d: `data:image/png;base64,${newB64}` }); setIsLayoutEditorOpen(false); }} showAlert={showAlert} />}
            {currentProject && isProposalOpen && <ProposalModal isOpen={isProposalOpen} onClose={() => setIsProposalOpen(false)} project={currentProject} client={clients.find(c => c.id === currentProject?.clientId)} showAlert={showAlert} />}
            {isNewViewGeneratorOpen && projectForNewView && <NewViewGenerator isOpen={isNewViewGeneratorOpen} project={projectForNewView} onClose={() => { setIsNewViewGeneratorOpen(false); setProjectForNewView(null); }} onSaveComplete={async () => { const updatedHistory = await getHistory(); setHistory(updatedHistory); if (currentProject?.id === projectForNewView?.id) { setCurrentProject(updatedHistory.find(p => p.id === currentProject.id)); } setIsNewViewGeneratorOpen(false); setProjectForNewView(null); }} showAlert={showAlert} />}
            {isGenerate3DModalOpen && projectFor3DGeneration && <Generate3DFrom2DModal isOpen={isGenerate3DModalOpen} onClose={() => { setIsGenerate3DModalOpen(false); setProjectFor3DGeneration(null); }} onGenerate={async (style, finish, additionalPrompt) => { if (!projectFor3DGeneration?.image2d) return; setIsLoading(true); try { const prompt = `Utilizando a imagem da planta baixa 2D fornecida, gere uma visualização 3D fotorrealista. Estilo: ${style}. Acabamento: ${finish}. Descrição Original: ${projectFor3DGeneration.description}. Instruções Adicionais: ${additionalPrompt || 'Nenhuma.'}`; const newViewB64 = await generateImage(prompt, [{ data: projectFor3DGeneration.image2d.split(',')[1], mimeType: projectFor3DGeneration.image2d.match(/:(.*?);/)?.[1] || 'image/png' }], '3d-render'); const updated = await updateProjectInHistory(projectFor3DGeneration.id, { views3d: [...projectFor3DGeneration.views3d, `data:image/png;base64,${newViewB64}`] }); if (updated) { if (currentProject?.id === updated.id) setCurrentProject(updated); setHistory(await getHistory()); } setIsGenerate3DModalOpen(false); setProjectFor3DGeneration(null); } catch(e) { showAlert(e instanceof Error ? e.message : 'Erro', 'Erro'); } finally { setIsLoading(false); } }} project={projectFor3DGeneration} isGenerating={isLoading} />}
            <BomGeneratorModal isOpen={isBomGeneratorOpen} onClose={() => setIsBomGeneratorOpen(false)} showAlert={showAlert} />
            <CuttingPlanGeneratorModal isOpen={isCuttingPlanGeneratorOpen} onClose={() => setIsCuttingPlanGeneratorOpen(false)} showAlert={showAlert} />
            <CostEstimatorModal isOpen={isCostEstimatorOpen} onClose={() => setIsCostEstimatorOpen(false)} showAlert={showAlert} />
            <>
                <FutureFeatureModal isOpen={isWhatsappOpen} onClose={() => setIsWhatsappOpen(false)} title="Integração WhatsApp" icon={<WhatsappIcon className="w-6 h-6 text-green-500" />} />
                <FutureFeatureModal isOpen={isAutoPurchaseOpen} onClose={() => setIsAutoPurchaseOpen(false)} title="Compra Automática" icon={<StoreIcon className="w-6 h-6 text-blue-500" />} />
                <FutureFeatureModal isOpen={isEmployeeManagementOpen} onClose={() => setIsEmployeeManagementOpen(false)} title="Gestão de Funcionários" icon={<UsersIcon className="w-6 h-6 text-yellow-500" />} />
                <FutureFeatureModal isOpen={isEncontraProOpen} onClose={() => setIsEncontraProOpen(false)} title="EncontraPro Marketplace" icon={<ProIcon />} />
                <ARViewerModal isOpen={isARViewerOpen} onClose={() => setIsARViewerOpen(false)} />
                <LearningHubModal isOpen={isLearningHubOpen} onClose={() => setIsLearningHubOpen(false)} />
            </>
            {currentProject && <SupplierPricingModal isOpen={isSupplierPricingOpen} onClose={() => setIsSupplierPricingOpen(false)} project={currentProject} onUpdateCosts={async (newCost) => { await handleUpdateCurrentProject({ materialCost: newCost }); setIsSupplierPricingOpen(false); }} showAlert={showAlert} />}
            
            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onViewProject={viewProject} onAddNewView={(id) => { const p = history.find(p=>p.id===id); if(p) { setProjectForNewView(p); setIsNewViewGeneratorOpen(true); } }} onDeleteProject={(id) => setConfirmation({ show: true, title: "Confirmar Exclusão", message: `Deseja excluir o projeto "${history.find(p=>p.id===id)?.name}"?`, onConfirm: async () => { if (currentProject?.id === id) resetToNewProject(); setHistory(await removeProjectFromHistory(id)); setConfirmation(c=>({...c, show: false})); } })} />
            
            <div className="flex flex-col min-h-screen">
                <Header userEmail={userEmail} isAdmin={isAdmin} onOpenResearch={() => setIsResearchOpen(true)} onOpenLive={() => setIsLiveOpen(true)} onOpenDistributors={() => setIsDistributorOpen(true)} onOpenClients={() => setIsClientsOpen(true)} onOpenHistory={() => setIsHistoryOpen(true)} onOpenAbout={() => setIsAboutOpen(true)} onOpenBomGenerator={() => setIsBomGeneratorOpen(true)} onOpenCuttingPlanGenerator={() => setIsCuttingPlanGeneratorOpen(true)} onOpenCostEstimator={() => setIsCostEstimatorOpen(true)} onOpenWhatsapp={() => setIsWhatsappOpen(true)} onOpenAutoPurchase={() => setIsAutoPurchaseOpen(true)} onOpenEmployeeManagement={() => setIsEmployeeManagementOpen(true)} onOpenLearningHub={() => setIsLearningHubOpen(true)} onOpenEncontraPro={() => setIsEncontraProOpen(true)} onLogout={onLogout} theme={theme} setTheme={setThemeState} />

                <main className="flex-grow p-4 sm:p-6 lg:p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fadeIn"><Spinner size="lg" /><h2 className="text-2xl font-bold font-serif text-[#6a5f5f] dark:text-[#c7bca9] mt-6">Iara está criando seu projeto...</h2><p className="text-[#8a7e7e] dark:text-[#a89d8d] mt-2">Isso pode levar alguns instantes.</p></div>
                    ) : currentProject ? (
                        <div className="max-w-7xl mx-auto animate-fadeInUp">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8]">{currentProject.name}</h2>
                                    <div className="relative" ref={shareMenuRef}>
                                        <button 
                                            onClick={() => {
                                                if (shareCopyFeedback) return;
                                                setIsShareMenuOpen(prev => !prev)
                                            }} 
                                            className="p-2 rounded-full text-[#6a5f5f] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition-colors" 
                                            title="Compartilhar Projeto"
                                        >
                                            <ShareIcon />
                                        </button>
                                        {isShareMenuOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#fffefb] dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#4a4040] rounded-lg shadow-xl p-2 z-10 animate-scaleIn" style={{transformOrigin: 'top left'}}>
                                                 {shareCopyFeedback ? (
                                                    <div className="flex items-center gap-2 px-2 py-1 text-green-600 dark:text-green-400">
                                                        <CheckIcon /> <span>{shareCopyFeedback}</span>
                                                    </div>
                                                 ) : (
                                                    <>
                                                        <button onClick={handleShareByLink} className="w-full flex items-center gap-3 text-left p-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition">
                                                            <CopyIcon /> <span>Copiar Link</span>
                                                        </button>
                                                        <button onClick={handleShareByEmail} className="w-full flex items-center gap-3 text-left p-2 rounded text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#3e3535] transition">
                                                            <EmailIcon /> <span>Enviar por E-mail</span>
                                                        </button>
                                                    </>
                                                 )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={resetToNewProject} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"><WandIcon /><span>Novo Projeto</span></button>
                            </div>
                            {isAdmin && (<div className="mb-4 border-b-2 border-[#e6ddcd] dark:border-[#4a4040] flex items-stretch"><button onClick={() => setActiveProjectTab('overview')} className={`px-4 py-2 font-semibold ${activeProjectTab==='overview' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]':'text-[#8a7e7e]'}`}>Visão Geral</button><button onClick={() => setActiveProjectTab('collab')} className={`px-4 py-2 font-semibold ${activeProjectTab==='collab' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]':'text-[#8a7e7e]'}`}>Colaboração</button><button onClick={() => setActiveProjectTab('production')} className={`px-4 py-2 font-semibold ${activeProjectTab==='production' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]':'text-[#8a7e7e]'}`}>Produção</button><button onClick={() => setActiveProjectTab('financial')} className={`px-4 py-2 font-semibold ${activeProjectTab==='financial' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]':'text-[#8a7e7e]'}`}>Financeiro</button></div>)}
                            
                            {(!isAdmin || activeProjectTab === 'overview') && (
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-3 space-y-8">
                                        <div><h3 className="text-xl font-semibold mb-3 text-[#3e3535] dark:text-[#c7bca9]">Visualizações 3D</h3><Project3DViewer views={currentProject.views3d} onEditClick={openImageEditor} onARClick={() => setIsARViewerOpen(true)} projectName={currentProject.name} /></div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-3 border-b border-[#e6ddcd] dark:border-[#4a4040]"><button onClick={() => setActive2DView('floorPlan')} className={`py-2 font-semibold ${active2DView === 'floorPlan' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]' : 'text-[#8a7e7e]'}`}>Planta Baixa</button>{currentProject.crossSectionImage && <button onClick={() => setActive2DView('crossSection')} className={`py-2 font-semibold ${active2DView === 'crossSection' ? 'border-b-2 border-[#d4ac6e] text-[#d4ac6e]' : 'text-[#8a7e7e]'}`}>Vista em Corte</button>}<button onClick={async () => { if(!currentProject.image2d) return; setIsLoading(true); try { const newB64 = await editFloorPlan(currentProject.image2d.split(',')[1], currentProject.image2d.match(/:(.*?);/)?.[1] || 'image/png', `Sua tarefa é gerar uma vista em corte (seção) detalhada da planta baixa 2D fornecida.`); await handleUpdateCurrentProject({ crossSectionImage: `data:image/png;base64,${newB64}` }); setActive2DView('crossSection'); } catch(e){ showAlert(e instanceof Error ? e.message: 'Erro'); } finally { setIsLoading(false); } }} disabled={!currentProject.image2d || isLoading} className="ml-auto bg-transparent text-[#8a7e7e] hover:text-[#d4ac6e] text-sm font-semibold p-2 rounded-lg disabled:opacity-50">{isLoading ? 'Gerando...' : 'Gerar Corte'}</button></div>
                                            {(active2DView === 'floorPlan' && currentProject.image2d) ? <div className="relative group"><InteractiveImageViewer src={currentProject.image2d} alt="Planta Baixa" projectName={currentProject.name} /><div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"><button onClick={() => setIsLayoutEditorOpen(true)} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><WandIcon /> Editar Layout</button></div></div> : (active2DView === 'crossSection' && currentProject.crossSectionImage) ? <InteractiveImageViewer src={currentProject.crossSectionImage} alt="Vista em Corte" projectName={currentProject.name} /> : <p className="text-[#8a7e7e] dark:text-[#a89d8d]">Nenhuma planta baixa disponível.</p>}
                                            <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={() => {if(currentProject) setProjectFor3DGeneration(currentProject); setIsGenerate3DModalOpen(true);}} disabled={!currentProject.image2d} className="w-full bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1"><CubeIcon /> Gerar 3D</button><button onClick={async () => { if(!currentProject || currentProject.views3d.length === 0) return; setIsLoading(true); try { const newB64 = await generateImage(`A partir da imagem 3D, gere uma planta baixa 2D detalhada.`, [{ data: currentProject.views3d[0].split(',')[1], mimeType: currentProject.views3d[0].match(/:(.*?);/)?.[1] || 'image/png' }], '2d-diagram'); await handleUpdateCurrentProject({ image2d: `data:image/png;base64,${newB64}` }); } catch (e) { showAlert(e instanceof Error ? e.message : 'Erro'); } finally { setIsLoading(false); } }} disabled={currentProject.views3d.length === 0 || isLoading} className="w-full bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1"><BlueprintIcon /> Gerar 2D</button></div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]"><h3 className="text-xl font-semibold mb-3">Descrição</h3><p className="whitespace-pre-wrap">{currentProject.description}</p></div>
                                        <div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]"><div className="flex justify-between items-center mb-3"><h3 className="text-xl font-semibold">Lista de Materiais (BOM)</h3>{currentProject.bom && <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">Gerada</span>}</div>{currentProject.bom ? <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.bom) }} /> : <button onClick={async () => {setIsLoading(true); try { const bom = await generateText(`Crie uma "Bill of Materials" (BOM) para: ${currentProject.description}`, currentProject.views3d.length > 0 ? [{data: currentProject.views3d[0].split(',')[1], mimeType: currentProject.views3d[0].match(/:(.*?);/)?.[1] || 'image/png'}] : null); await handleUpdateCurrentProject({ bom }); } catch(e){ showAlert(e instanceof Error ? e.message : 'Erro'); } finally {setIsLoading(false);}}} disabled={isLoading} className="w-full bg-[#d4ac6e] p-2 rounded-lg">Gerar BOM</button>}</div>
                                        <div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]"><div className="flex justify-between items-center mb-3"><h3 className="text-xl font-semibold">Plano de Corte</h3>{currentProject.cuttingPlan && <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">Gerado</span>}</div>{currentProject.cuttingPlan ? <>{currentProject.cuttingPlanImage && <img src={currentProject.cuttingPlanImage} alt="Diagrama de corte" className="rounded-lg mb-4" />}<div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.cuttingPlan) }} /></> : <button onClick={async () => { setIsLoading(true); try { const { text, image, optimization } = await generateCuttingPlan(currentProject, 2750, 1850); await handleUpdateCurrentProject({ cuttingPlan: text, cuttingPlanImage: `data:image/png;base64,${image}`, cuttingPlanOptimization: optimization }); } catch(e){ showAlert(e instanceof Error ? e.message : 'Erro'); } finally { setIsLoading(false); }}} disabled={!currentProject.bom || isLoading} className="w-full bg-[#d4ac6e] p-2 rounded-lg">Gerar Plano de Corte</button>}</div>
                                        <div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]"><h3 className="text-xl font-semibold mb-3">Proposta Comercial</h3><button onClick={() => setIsProposalOpen(true)} className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded-lg"><DocumentDuplicateIcon /> Gerar PDF da Proposta</button></div>
                                    </div>
                                </div>
                            )}
                            {isAdmin && activeProjectTab === 'collab' && <CollaborationPanel project={currentProject} onUpdate={handleUpdateCurrentProject} userEmail={userEmail} />}
                            {isAdmin && activeProjectTab === 'production' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><ProjectTimer project={currentProject} onUpdate={handleUpdateCurrentProject} /><SupplierCatalog /></div>}
                            {isAdmin && activeProjectTab === 'financial' && <FinancialPanel project={currentProject} client={clients.find(c => c.id === currentProject.clientId)} onUpdate={handleUpdateCurrentProject} />}

                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto animate-fadeInUp">
                            <div className="text-center mb-10"><h2 className="text-4xl sm:text-5xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8]">Dê vida às suas ideias</h2><p className="mt-3 text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Descreva, selecione o acabamento e deixe a Iara, nossa IA, criar seu projeto.</p></div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] space-y-6">
                                    <div><h2 className="text-2xl font-semibold mb-4">Passo 1: Descreva seu projeto</h2><div className="relative"><textarea ref={descriptionInputRef} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Um guarda-roupa de casal com 3 portas de correr..." rows={6} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 pr-12 rounded-lg" /><div className="absolute top-3 right-3"><VoiceInputButton onTranscript={(t) => setDescription(d => d ? d.trim() + ' ' + t : t)} showAlert={showAlert} /></div></div><StyleAssistant presetId={projectType} onSelect={(tag) => setDescription(tag)} /><ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImageUrls={currentProject?.uploadedReferenceImageUrls} /></div>
                                    <div><h2 className="text-2xl font-semibold mb-4">Passo 3: Estilo e Detalhes</h2><div className="space-y-4"><div><label className="block text-sm font-medium mb-2">Tipo de Projeto</label><div className="flex flex-wrap gap-2">{projectTypePresets.map(p => <button key={p.id} onClick={() => setProjectType(p.id)} className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${projectType === p.id ? 'bg-[#d4ac6e]' : 'bg-[#e6ddcd] dark:bg-[#4a4040]'}`}><p.icon />{p.name}</button>)}</div></div><div><label className="block text-sm font-medium mb-2">Estilo de Design</label><div className="flex flex-wrap gap-2">{stylePresets.map(s => <button key={s} onClick={() => setStyle(s)} className={`py-1 px-3 rounded-full text-sm ${style === s ? 'bg-[#d4ac6e]' : 'bg-[#e6ddcd] dark:bg-[#4a4040]'}`}>{s}</button>)}</div></div><div><label className="block text-sm font-medium mb-2">Detalhes Adicionais (opcional)</label><textarea value={additionalDetails} onChange={e => setAdditionalDetails(e.target.value)} placeholder="Ex: Puxadores embutidos..." rows={3} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded-lg" /></div></div></div>
                                </div>
                                <div className="space-y-8"><div className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]"><FinishesSelector onFinishSelect={setSelectedFinish} value={selectedFinish} showAlert={showAlert} favoriteFinishes={favoriteFinishes} onToggleFavorite={async (f) => { setFavoriteFinishes(favoriteFinishes.some(fav => fav.id === f.id) ? await removeFavoriteFinish(f.id) : await addFavoriteFinish(f)); }} /></div></div>
                            </div>
                            <div className="mt-8"><button onClick={handleGenerateProject} className="w-full bg-gradient-to-r from-[#c89f5e] to-[#d4ac6e] text-[#3e3535] font-bold py-4 px-6 rounded-lg text-xl flex items-center justify-center gap-3"><SparklesIcon /><span>Gerar Projeto com Iara</span></button></div>
                           <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"><WhatsappIntegrationPanel /><AutoPurchasePanel /><EmployeeManagementPanel /></div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}