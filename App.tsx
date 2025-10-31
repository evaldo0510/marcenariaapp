import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Types
import type { AlertState, ImageModalState, ProjectHistoryItem, Finish, Client, PricedBomItem, Comment } from './types';

// Services
import { projectTypePresets, stylePresets } from './services/presetService';
import { generateImage, generateText, editImage, generateCuttingPlan, editFloorPlan, estimateProjectCosts, generateAssemblyDetails, parseBomToList, findSupplierPrice, calculateFinancialSummary, fetchSupplierCatalog, calculateShippingCost, suggestAlternativeStyles, generateFloorPlanFrom3D } from './services/geminiService';
import { getHistory, addProjectToHistory, updateProjectInHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish } from './services/historyService';
import { convertMarkdownToHtml } from './utils/helpers';


// Components
import { Header } from './components/Header';
import { AlertModal, ImageModal, ConfirmationModal, Spinner, WandIcon, BlueprintIcon, CubeIcon, ToolsIcon, DocumentDuplicateIcon, BookIcon, CheckIcon, StarIcon, SparklesIcon, RulerIcon, LogoIcon, CurrencyDollarIcon, WhatsappIcon, StoreIcon, UsersIcon, TagIcon, SearchIcon, MessageIcon, TimerIcon, CatalogIcon, DollarCircleIcon, ARIcon, VideoIcon, CommunityIcon, ShareIcon, CopyIcon, EmailIcon, ProIcon, DocumentTextIcon } from './components/Shared';
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

const Project2DViewer: React.FC<{
  src: string;
  onEditClick: (src: string) => void;
  projectName: string;
}> = ({ src, onEditClick, projectName }) => {
    if (!src) return <p className="text-[#8a7e7e] dark:text-[#a89d8d] text-center p-8">Nenhuma planta baixa disponível para este projeto.</p>;

    return (
        <div className="animate-fadeIn">
            <div className="relative group mb-4">
                <InteractiveImageViewer src={src} alt="Planta baixa 2D" projectName={projectName} />
                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditClick(src)} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <WandIcon /> Editar Layout
                    </button>
                </div>
            </div>
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
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><DollarCircleIcon /> Cotação de Preços com Fornecedores</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 flex-grow overflow-y-auto"><div className="overflow-x-auto"><table className="w-full text-left table-auto"><thead><tr className="border-b-2 border-[#e6ddcd] dark:border-[#4a4040]"><th className="p-2">Item</th><th className="p-2">Qtde</th><th className="p-2">Dimensões</th><th className="p-2">Preço Unit.</th><th className="p-2">Fornecedor</th><th className="p-2">Ação</th></tr></thead><tbody>{isParsing ? (<tr><td colSpan={6} className="text-center p-8"><Spinner /></td></tr>) : (pricedItems.map((item, index) => (<tr key={index} className="border-b border-[#e6ddcd] dark:border-[#4a4040]"><td className="p-2">{item.item}</td><td className="p-2">{item.qty}</td><td className="p-2">{item.dimensions}</td><td className="p-2">{item.price ? `R$ ${item.price.toFixed(2)}` : 'N/A'}</td><td className="p-2">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">{item.supplier}</a> : item.supplier || 'N/A'}</td><td className="p-2"><button onClick={() => handleFindPrice(index)} disabled={item.isSearching} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] text-sm py-1 px-2 rounded disabled:opacity-50 flex items-center gap-1">{item.isSearching ? <Spinner size="sm"/> : <SearchIcon/>} {item.isSearching ? 'Buscando' : 'Buscar'}</button></td></tr>)))}</tbody></table></div></main><footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><div className="text-lg">Custo Total dos Materiais: <span className="font-bold text-[#b99256] dark:text-[#d4ac6e]">R$ {newTotalCost.toFixed(2)}</span></div><div className="flex gap-4"><button onClick={onClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button><button onClick={() => { onUpdateCosts(newTotalCost); onClose(); }} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition">Atualizar Custos</button></div></footer></div></div>);
};

// --- MAIN APP COMPONENT ---

interface AppProps {
  onLogout: () => void;
  userEmail: string;
}

export const App: React.FC<AppProps> = ({ onLogout, userEmail }) => {
  // --- STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Gerando projeto...');
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [favoriteFinishes, setFavoriteFinishes] = useState<Finish[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isAdmin = userEmail === 'evaldo0510@gmail.com'; // Example admin check

  // Input States
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTypePresetId, setProjectTypePresetId] = useState(projectTypePresets[0].id);
  const [stylePreset, setStylePreset] = useState(stylePresets[0]);
  const [uploadedImages, setUploadedImages] = useState<{ data: string; mimeType: string }[] | null>(null);
  const [uploadedFloorPlan, setUploadedFloorPlan] = useState<{ data: string; mimeType: string, full: string } | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string; } | null>(null);
  const [withLedLighting, setWithLedLighting] = useState(false);

  // Modal & Panel States
  const [alertState, setAlertState] = useState<AlertState>({ show: false, title: '', message: '' });
  const [imageModalState, setImageModalState] = useState<ImageModalState>({ show: false, src: '' });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [isResearchAssistantOpen, setIsResearchAssistantOpen] = useState(false);
  const [isDistributorFinderOpen, setIsDistributorFinderOpen] = useState(false);
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
  const [imageEditorState, setImageEditorState] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });
  const [layoutEditorState, setLayoutEditorState] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [newViewGeneratorState, setNewViewGeneratorState] = useState<{ isOpen: boolean; project: ProjectHistoryItem | null }>({ isOpen: false, project: null });
  const [isGenerate3DFrom2DModalOpen, setIsGenerate3DFrom2DModalOpen] = useState(false);
  const [isBomGeneratorOpen, setIsBomGeneratorOpen] = useState(false);
  const [isCuttingPlanGeneratorOpen, setIsCuttingPlanGeneratorOpen] = useState(false);
  const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState(false);
  const [futureFeatureModal, setFutureFeatureModal] = useState<{ isOpen: boolean; title: string; icon: React.ReactNode }>({ isOpen: false, title: '', icon: null });
  const [isSupplierPricingModalOpen, setIsSupplierPricingModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [styleSuggestions, setStyleSuggestions] = useState<{isOpen: boolean, isLoading: boolean, suggestions: string[]}>({ isOpen: false, isLoading: false, suggestions: [] });
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'details'>('3d');

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- DERIVED STATE ---
  const activePreset = useMemo(() => projectTypePresets.find(p => p.id === projectTypePresetId), [projectTypePresetId]);

  // --- EFFECTS ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.backgroundColor = theme === 'dark' ? '#2d2424' : '#f5f1e8';
  }, [theme]);
  
  const showAlert = useCallback((message: string, title: string = 'Erro') => {
    setAlertState({ show: true, title, message });
  }, []);

  const loadAllData = useCallback(async () => {
    const [historyData, clientData, finishesData] = await Promise.all([getHistory(), getClients(), getFavoriteFinishes()]);
    setHistory(historyData);
    setClients(clientData);
    setFavoriteFinishes(finishesData);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  useEffect(() => {
    if (currentProject) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      setActiveTab('3d');
    }
  }, [currentProject?.id]);
  
  const resetForm = useCallback(() => {
    setProjectDescription('');
    setProjectTypePresetId(projectTypePresets[0].id);
    setStylePreset(stylePresets[0]);
    setUploadedImages(null);
    setUploadedFloorPlan(null);
    setSelectedFinish(null);
    setWithLedLighting(false);
    setCurrentProject(null);
  }, []);

  const handleGenerateProject = async () => { /* Logic to generate the project */ };
  const handleViewProject = (project: ProjectHistoryItem) => { /* Logic to view project */ };
  const handleUpdateProject = async (id: string, updates: Partial<ProjectHistoryItem>) => {
    const updatedProject = await updateProjectInHistory(id, updates);
    if (updatedProject) {
        if (currentProject?.id === id) {
            setCurrentProject(updatedProject);
        }
        await loadAllData();
    }
  };
  
  const handleConfirmDelete = (onConfirm: () => void, type: 'projeto' | 'cliente') => {
    setConfirmationModal({
        show: true,
        title: `Confirmar Exclusão`,
        message: `Tem certeza que deseja excluir est${type === 'projeto' ? 'e projeto' : 'a cliente'}? Esta ação não pode ser desfeita.`,
        onConfirm: () => {
          onConfirm();
          setConfirmationModal({ show: false, title: '', message: '', onConfirm: () => {} });
        },
    });
  };
  
  const handleDeleteProject = (id: string) => {
    handleConfirmDelete(async () => {
        if (currentProject?.id === id) resetForm();
        await removeProjectFromHistory(id);
        await loadAllData();
        setIsHistoryOpen(false);
    }, 'projeto');
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'timestamp'> & { id?: string }) => {
    await saveClient(clientData);
    await loadAllData();
  };
  
  const handleDeleteClient = (id: string) => {
    handleConfirmDelete(async () => {
        await removeClient(id);
        await loadAllData();
    }, 'cliente');
  };

  const handleToggleFavoriteFinish = async (finish: Finish) => {
    const isFavorite = favoriteFinishes.some(fav => fav.id === finish.id);
    if (isFavorite) {
      await removeFavoriteFinish(finish.id);
    } else {
      await addFavoriteFinish(finish);
    }
    await loadAllData();
  };
  
  const handleSuggestStyles = async () => {
      if (!currentProject?.description || !currentProject.views3d?.[0]) {
          showAlert("É preciso ter um projeto salvo com descrição e imagem 3D para sugerir estilos.", "Atenção");
          return;
      }
      setStyleSuggestions({ isOpen: true, isLoading: true, suggestions: [] });
      try {
          const suggestions = await suggestAlternativeStyles(currentProject.description, currentProject.style, currentProject.views3d[0]);
          setStyleSuggestions({ isOpen: true, isLoading: false, suggestions });
      } catch (error) {
          showAlert(error instanceof Error ? error.message : "Erro ao sugerir estilos.");
          setStyleSuggestions({ isOpen: false, isLoading: false, suggestions: [] });
      }
  };

  const handleGenerateFloorPlan = async () => {
    if (!currentProject || !currentProject.views3d || currentProject.views3d.length === 0) {
        showAlert("É necessário ter um projeto 3D para gerar a planta baixa.", "Ação Inválida");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Gerando planta baixa 2D...');
    try {
        const floorPlanBase64 = await generateFloorPlanFrom3D(currentProject);
        await handleUpdateProject(currentProject.id, { image2d: `data:image/png;base64,${floorPlanBase64}` });
        setActiveTab('2d'); // Switch to the new tab after generation
    } catch (error) {
        showAlert(error instanceof Error ? error.message : 'Erro ao gerar planta baixa.');
    } finally {
        setIsLoading(false);
    }
  };


  const renderResults = () => {
    if (!currentProject) {
       return (
         <div className="grid grid-cols-1 gap-8">
             <WhatsappIntegrationPanel />
             <AutoPurchasePanel />
             <EmployeeManagementPanel />
         </div>
       );
    }

    const tabBaseClasses = "px-3 py-2 font-semibold text-sm rounded-t-lg flex items-center gap-2";
    const tabActiveClasses = "bg-[#fffefb] dark:bg-[#3e3535] text-[#b99256] dark:text-[#d4ac6e]";
    const tabInactiveClasses = "bg-transparent text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50";
    
    return (
        <div className="bg-[#fffefb] dark:bg-[#3e3535] rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeInUp">
            {/* Project Header */}
            <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex flex-wrap justify-between items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8]">{currentProject.name}</h2>
                    <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d]">{currentProject.style}</p>
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setIsProposalModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        <DocumentTextIcon /> Gerar Proposta
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('3d')} className={`${tabBaseClasses} ${activeTab === '3d' ? tabActiveClasses : tabInactiveClasses}`}>
                        <CubeIcon /> Visualização 3D
                    </button>
                    <button onClick={() => setActiveTab('2d')} className={`${tabBaseClasses} ${activeTab === '2d' ? tabActiveClasses : tabInactiveClasses}`} disabled={!currentProject.image2d}>
                        <BlueprintIcon /> Planta Baixa 2D
                    </button>
                    <button onClick={() => setActiveTab('details')} className={`${tabBaseClasses} ${activeTab === 'details' ? tabActiveClasses : tabInactiveClasses}`}>
                        <ToolsIcon /> Detalhes
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
                {activeTab === '3d' && (
                    <Project3DViewer 
                        views={currentProject.views3d}
                        projectName={currentProject.name}
                        onEditClick={(src) => setImageEditorState({ isOpen: true, src })}
                        onARClick={() => setFutureFeatureModal({isOpen: true, title: 'Visualização em Realidade Aumentada', icon: <ARIcon />})}
                    />
                )}
                {activeTab === '2d' && currentProject.image2d && (
                     <Project2DViewer 
                        src={currentProject.image2d}
                        projectName={currentProject.name}
                        onEditClick={(src) => setLayoutEditorState({ isOpen: true, src })}
                    />
                )}
                {activeTab === 'details' && (
                   <p>Detalhes técnicos como BOM, Plano de Corte e Custos aparecerão aqui.</p>
                )}
            </div>
            
            {!currentProject.image2d && (
                <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] text-center">
                    <button 
                        onClick={handleGenerateFloorPlan} 
                        disabled={isLoading}
                        className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                    >
                        {isLoading && loadingMessage.includes('planta') ? <Spinner size="sm" /> : <BlueprintIcon />}
                        {isLoading && loadingMessage.includes('planta') ? loadingMessage : 'Gerar Planta Baixa 2D'}
                    </button>
                </div>
            )}
        </div>
    );
  }


  return (
    <div className={`min-h-screen ${theme}`}>
      <Header 
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenLive={() => setIsLiveAssistantOpen(true)}
        onOpenResearch={() => setIsResearchAssistantOpen(true)}
        onOpenDistributors={() => setIsDistributorFinderOpen(true)}
        onOpenClients={() => setIsClientPanelOpen(true)}
        onOpenBomGenerator={() => setIsBomGeneratorOpen(true)}
        onOpenCuttingPlanGenerator={() => setIsCuttingPlanGeneratorOpen(true)}
        onOpenCostEstimator={() => setIsCostEstimatorOpen(true)}
        onOpenWhatsapp={() => setFutureFeatureModal({ isOpen: true, title: 'Integração com WhatsApp', icon: <WhatsappIcon /> })}
        onOpenAutoPurchase={() => setFutureFeatureModal({ isOpen: true, title: 'Compra Automática de Materiais', icon: <StoreIcon /> })}
        onOpenEmployeeManagement={() => setFutureFeatureModal({ isOpen: true, title: 'Gestão de Funcionários', icon: <UsersIcon /> })}
        onOpenLearningHub={() => setFutureFeatureModal({ isOpen: true, title: 'Hub de Aprendizagem', icon: <CommunityIcon /> })}
        onOpenEncontraPro={() => setFutureFeatureModal({ isOpen: true, title: 'EncontraPro Marketplace', icon: <ProIcon /> })}
      />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Panel */}
          <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] space-y-6 self-start">
            <button onClick={resetForm} className="w-full bg-[#e6ddcd] dark:bg-[#4a4040] text-center py-2 px-4 rounded-lg font-semibold hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition flex items-center justify-center gap-2">
              <DocumentDuplicateIcon /> Novo Projeto
            </button>
            
            {/* Step 1: Description */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Passo 1: Descreva a sua Ideia</h2>
              <div className="flex gap-2 items-start">
                <textarea
                  ref={descriptionTextAreaRef}
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  rows={6}
                  placeholder={`Ex: ${activePreset?.suggestions?.[0] || 'Um armário de cozinha moderno...'}`}
                  className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                />
                <VoiceInputButton 
                    onTranscript={text => setProjectDescription(prev => prev ? `${prev.trim()} ${text}` : text)} 
                    showAlert={showAlert} 
                />
              </div>
              <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImageUrls={currentProject?.uploadedReferenceImageUrls} />
              <StyleAssistant presetId={projectTypePresetId} onSelect={setProjectDescription} />
            </div>

            {/* Step 2: Finishes */}
            <FinishesSelector onFinishSelect={setSelectedFinish} value={selectedFinish} showAlert={showAlert} favoriteFinishes={favoriteFinishes} onToggleFavorite={handleToggleFavoriteFinish} />

            {/* Step 3: Details */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Passo 3: Detalhes e Geração</h2>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label htmlFor="style" className="font-medium text-[#6a5f5f] dark:text-[#c7bca9]">Estilo do Projeto</label>
                     <div className="flex items-center gap-2">
                         <select id="style" value={stylePreset} onChange={e => setStylePreset(e.target.value)} className="bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-2 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e]">
                            {stylePresets.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <button onClick={handleSuggestStyles} disabled={!currentProject} title={!currentProject ? "Salve um projeto para ver sugestões" : "Sugerir estilos alternativos"} className="p-2 rounded-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] text-[#d4ac6e] disabled:opacity-50 disabled:cursor-not-allowed">
                             <SparklesIcon />
                         </button>
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <label htmlFor="led" className="font-medium text-[#6a5f5f] dark:text-[#c7bca9]">Iluminação com LED?</label>
                     <label htmlFor="led" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="led" checked={withLedLighting} onChange={e => setWithLedLighting(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#e6ddcd] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#d4ac6e]/50 dark:peer-focus:ring-[#d4ac6e]/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#d4ac6e]"></div>
                     </label>
                  </div>
              </div>
            </div>
            
            <button
              onClick={handleGenerateProject}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 text-lg"
            >
              {isLoading ? <><Spinner size="sm" /> Gerando...</> : <><WandIcon /> Gerar Projeto com Iara</>}
            </button>
          </div>
          {/* Right Column: Results Panel */}
          <div ref={resultsRef} className="space-y-6">
            {isLoading && !currentProject ? (
              <div className="bg-[#fffefb] dark:bg-[#3e3535] p-6 rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col items-center justify-center h-96 animate-fadeIn">
                <Spinner />
                <p className="mt-4 text-[#6a5f5f] dark:text-[#c7bca9]">{loadingMessage}</p>
              </div>
            ) : renderResults()}
          </div>
        </div>
      </main>
      
      {/* Modals and Panels */}
      <AlertModal state={alertState} onClose={() => setAlertState({ ...alertState, show: false })} />
      <ImageModal state={imageModalState} onClose={() => setImageModalState({ ...imageModalState, show: false })} />
      <ConfirmationModal 
        show={confirmationModal.show} 
        title={confirmationModal.title} 
        message={confirmationModal.message} 
        onConfirm={confirmationModal.onConfirm} 
        onCancel={() => setConfirmationModal({ ...confirmationModal, show: false })}
      />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onViewProject={handleViewProject} onDeleteProject={handleDeleteProject} onAddNewView={(id) => setNewViewGeneratorState({isOpen: true, project: history.find(p=>p.id===id) || null})} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <LiveAssistant isOpen={isLiveAssistantOpen} onClose={() => setIsLiveAssistantOpen(false)} showAlert={showAlert} />
      <ResearchAssistant isOpen={isResearchAssistantOpen} onClose={() => setIsResearchAssistantOpen(false)} showAlert={showAlert} />
      <DistributorFinder isOpen={isDistributorFinderOpen} onClose={() => setIsDistributorFinderOpen(false)} showAlert={showAlert} />
      <ClientPanel isOpen={isClientPanelOpen} onClose={() => setIsClientPanelOpen(false)} clients={clients} projects={history} onSaveClient={handleSaveClient} onDeleteClient={handleDeleteClient} onViewProject={handleViewProject} />
      {imageEditorState.isOpen && <ImageEditor isOpen={imageEditorState.isOpen} imageSrc={imageEditorState.src} onClose={() => setImageEditorState({ isOpen: false, src: '' })} onSave={(newImg) => handleUpdateProject(currentProject!.id, { views3d: [...currentProject!.views3d, `data:image/png;base64,${newImg}`]})} showAlert={showAlert} />}
      {layoutEditorState.isOpen && currentProject && <LayoutEditor isOpen={layoutEditorState.isOpen} floorPlanSrc={layoutEditorState.src} projectDescription={currentProject.description} onClose={() => setLayoutEditorState({ isOpen: false, src: '' })} onSave={(newImg) => handleUpdateProject(currentProject!.id, { image2d: `data:image/png;base64,${newImg}` })} showAlert={showAlert} />}
      {isProposalModalOpen && currentProject && <ProposalModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} project={currentProject} client={clients.find(c => c.id === currentProject!.clientId)} showAlert={showAlert} />}
      {newViewGeneratorState.isOpen && newViewGeneratorState.project && <NewViewGenerator isOpen={newViewGeneratorState.isOpen} project={newViewGeneratorState.project} onClose={() => setNewViewGeneratorState({ isOpen: false, project: null })} onSaveComplete={loadAllData} showAlert={showAlert} />}
      <BomGeneratorModal isOpen={isBomGeneratorOpen} onClose={() => setIsBomGeneratorOpen(false)} showAlert={showAlert} />
      <CuttingPlanGeneratorModal isOpen={isCuttingPlanGeneratorOpen} onClose={() => setIsCuttingPlanGeneratorOpen(false)} showAlert={showAlert} />
      <CostEstimatorModal isOpen={isCostEstimatorOpen} onClose={() => setIsCostEstimatorOpen(false)} showAlert={showAlert} />
      <FutureFeatureModal isOpen={futureFeatureModal.isOpen} onClose={() => setFutureFeatureModal({...futureFeatureModal, isOpen: false})} title={futureFeatureModal.title} icon={futureFeatureModal.icon} />
    </div>
  );
};