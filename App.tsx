
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Types
import type { AlertState, ImageModalState, ProjectHistoryItem, Finish, Client, PricedBomItem, Comment } from './types';

// Services
import { projectTypePresets, initialStylePresets } from './services/presetService';
import { generateImage, generateText, editImage, generateCuttingPlan, editFloorPlan, estimateProjectCosts, generateAssemblyDetails, parseBomToList, findSupplierPrice, calculateFinancialSummary, fetchSupplierCatalog, calculateShippingCost, suggestAlternativeStyles, generateFloorPlanFrom3D, generate3Dfrom2D } from './services/geminiService';
import { getHistory, addProjectToHistory, updateProjectInHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish } from './services/historyService';
import { convertMarkdownToHtml } from './utils/helpers';


// Components
import { Header } from './components/Header';
import { AlertModal, ImageModal, ConfirmationModal, Spinner, WandIcon, BlueprintIcon, CubeIcon, ToolsIcon, DocumentDuplicateIcon, BookIcon, CheckIcon, StarIcon, SparklesIcon, RulerIcon, LogoIcon, CurrencyDollarIcon, WhatsappIcon, StoreIcon, UsersIcon, TagIcon, SearchIcon, MessageIcon, TimerIcon, CatalogIcon, DollarCircleIcon, ARIcon, VideoIcon, CommunityIcon, ShareIcon, CopyIcon, EmailIcon, ProIcon, DocumentTextIcon, EarlyAccessModal } from './components/Shared';
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
import { ARViewer } from './components/ARViewer';
import { EncontraProModal } from './components/EncontraProModal';

// --- SUB-COMPONENTS ---
const Project3DViewer: React.FC<{
  views: string[];
  onEditClick: (src: string) => void;
  onARClick: (src: string) => void;
  onNewViewClick: () => void;
  projectName: string;
}> = ({ views, onEditClick, onARClick, onNewViewClick, projectName }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => { setActiveIndex(0); }, [views]);
    
    if (!views || views.length === 0) return <p className="text-[#8a7e7e] dark:text-[#a89d8d]">Nenhuma visualização 3D disponível.</p>;
    const activeView = views[activeIndex];

    return (
        <div>
            <div className="relative group mb-4">
                <InteractiveImageViewer src={activeView} alt={`Vista 3D ${activeIndex + 1}`} projectName={projectName} />
                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onARClick(activeView)} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <ARIcon /> Ver em RA
                    </button>
                    <button onClick={onNewViewClick} className="text-white bg-[#3e3535]/70 hover:bg-[#2d2424]/80 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <WandIcon /> Nova Vista
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


// --- NEW EARLY ACCESS PREVIEW COMPONENTS ---
const EarlyAccessPreviewWrapper: React.FC<{ description: string, children: React.ReactNode }> = ({ description, children }) => (
    <div className="text-left space-y-4">
        <p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">{description}</p>
        <div className="p-4 bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
            {children}
        </div>
    </div>
);

const WhatsappEarlyAccessPreview: React.FC<{ project: ProjectHistoryItem | null }> = ({ project }) => {
    const [step, setStep] = useState<'initial' | 'sending' | 'sent'>('initial');
    useEffect(() => { setStep('initial') }, [project]);

    const handleSend = () => {
        setStep('sending');
        setTimeout(() => setStep('sent'), 1500);
    };

    if (step === 'sent') {
        return (
            <EarlyAccessPreviewWrapper description="Conecte sua conta do WhatsApp para enviar propostas e atualizações diretamente aos clientes.">
                <div className="text-center p-6 flex flex-col items-center justify-center space-y-3">
                    <CheckIcon className="w-16 h-16 text-green-500" />
                    <h3 className="text-xl font-bold">Mensagem Enviada!</h3>
                    <p className="text-[#6a5f5f] dark:text-[#c7bca9]">Uma simulação de notificação foi enviada para o WhatsApp do cliente.</p>
                    <button onClick={() => setStep('initial')} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 mt-4">Enviar Outra</button>
                </div>
            </EarlyAccessPreviewWrapper>
        );
    }

    return (
        <EarlyAccessPreviewWrapper description="Conecte sua conta do WhatsApp para enviar propostas e atualizações diretamente aos clientes.">
            <div className="space-y-2">
                <p className="font-semibold">Cliente: {project?.clientName || 'Cliente Exemplo'}</p>
                <textarea readOnly className="w-full h-24 p-2 rounded bg-white dark:bg-[#3e3535] text-sm" value={`Olá ${project?.clientName || 'Cliente'},\n\nSegue a proposta para o projeto "${project?.name || 'seu novo móvel'}". Por favor, revise e me avise se tiver alguma dúvida.`}></textarea>
                <button onClick={handleSend} disabled={step === 'sending'} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50">
                    {step === 'sending' ? <Spinner size="sm" /> : <WhatsappIcon className="w-5 h-5"/>}
                    {step === 'sending' ? 'Enviando...' : 'Simular Envio via WhatsApp'}
                </button>
            </div>
        </EarlyAccessPreviewWrapper>
    );
};

const AutoPurchaseEarlyAccessPreview: React.FC<{ project: ProjectHistoryItem | null }> = ({ project }) => {
    const [step, setStep] = useState<'initial' | 'searching' | 'results'>('initial');
    useEffect(() => { setStep('initial') }, [project]);

    const handleSearch = () => {
        setStep('searching');
        setTimeout(() => setStep('results'), 2000);
    };

    if (step === 'searching') {
        return (
             <EarlyAccessPreviewWrapper description="Gere um carrinho de compras com os melhores preços para a BOM do seu projeto e envie o pedido para seus fornecedores preferidos.">
                <div className="text-center p-8 flex flex-col items-center justify-center space-y-3">
                    <Spinner />
                    <p className="text-[#6a5f5f] dark:text-[#c7bca9]">Buscando melhores preços em Leo Madeiras, GMAD...</p>
                </div>
            </EarlyAccessPreviewWrapper>
        )
    }

    if (step === 'results') {
        return (
             <EarlyAccessPreviewWrapper description="Gere um carrinho de compras com os melhores preços para a BOM do seu projeto e envie o pedido para seus fornecedores preferidos.">
                <div className="space-y-2 text-sm">
                    <h4 className="font-bold text-lg mb-2">Cotação (Simulação)</h4>
                    <div className="flex justify-between p-2 bg-white dark:bg-[#3e3535] rounded"><span>Chapa MDF Branco 18mm</span><span className="font-semibold">Leo Madeiras: R$ 280,00</span></div>
                    <div className="flex justify-between p-2 bg-white dark:bg-[#3e3535] rounded"><span>Corrediça Telescópica 45cm</span><span className="font-semibold">GMAD: R$ 15,00</span></div>
                    <div className="flex justify-between p-2 bg-white dark:bg-[#3e3535] rounded border-t-2 mt-2 pt-2"><strong>Total:</strong><strong className="text-green-600">R$ 295,00</strong></div>
                    <button className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 mt-4">Confirmar Pedido</button>
                </div>
            </EarlyAccessPreviewWrapper>
        )
    }

    return (
        <EarlyAccessPreviewWrapper description="Gere um carrinho de compras com os melhores preços para a BOM do seu projeto e envie o pedido para seus fornecedores preferidos.">
            <div className="space-y-2">
                <p className="font-semibold">Projeto: {project?.name || 'Projeto Exemplo'}</p>
                <div className="p-2 border rounded max-h-48 overflow-y-auto bg-white dark:bg-[#3e3535]">
                    <pre className="text-xs whitespace-pre-wrap">{project?.bom || 'Gere uma BOM para o projeto primeiro.'}</pre>
                </div>
                <button onClick={handleSearch} disabled={!project?.bom} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50">
                    Buscar Preços e Fazer Pedido
                </button>
            </div>
        </EarlyAccessPreviewWrapper>
    );
};

const EmployeeManagementEarlyAccessPreview: React.FC<{}> = () => (
    <EarlyAccessPreviewWrapper description="Atribua projetos, controle o tempo e gerencie a produtividade da sua equipe.">
        <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white dark:bg-[#3e3535] rounded">
                <span>João Silva (Marceneiro)</span>
                <span className="text-green-600">Ativo</span>
            </div>
             <div className="flex justify-between items-center p-2 bg-white dark:bg-[#3e3535] rounded">
                <span>Maria Costa (Montadora)</span>
                <span className="text-yellow-600">Em projeto</span>
            </div>
            <button className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 mt-2">Adicionar Novo Funcionário</button>
        </div>
    </EarlyAccessPreviewWrapper>
);

const LearningHubEarlyAccessPreview: React.FC<{}> = () => (
     <EarlyAccessPreviewWrapper description="Acesse tutoriais exclusivos, dicas de especialistas e cursos para aprimorar suas habilidades.">
        <div className="space-y-2">
            <div className="block text-left w-full p-3 bg-white dark:bg-[#3e3535] rounded hover:bg-gray-50 dark:hover:bg-[#4a4040]">
                <p className="font-semibold text-purple-600 dark:text-purple-400">[Vídeo] Técnicas Avançadas de Fita de Borda</p>
                <p className="text-xs">Aprenda a obter um acabamento perfeito em qualquer material.</p>
            </div>
            <div className="block text-left w-full p-3 bg-white dark:bg-[#3e3535] rounded hover:bg-gray-50 dark:hover:bg-[#4a4040]">
                <p className="font-semibold text-purple-600 dark:text-purple-400">[Artigo] Como Calcular Orçamentos Lucrativos</p>
                <p className="text-xs">Domine a precificação dos seus projetos.</p>
            </div>
        </div>
    </EarlyAccessPreviewWrapper>
);

const EncontraProEarlyAccessPreview: React.FC<{}> = () => (
     <EarlyAccessPreviewWrapper description="Receba notificações de novos clientes buscando por marceneiros qualificados na sua região.">
        <div className="space-y-2">
            <div className="p-3 border-l-4 border-indigo-500 bg-white dark:bg-[#3e3535] rounded">
                <p className="font-semibold">Novo Lead: Cozinha Planejada em Moema, SP</p>
                <p className="text-xs">Cliente busca orçamento para armários de cozinha em L. Contato: (11) 9XXXX-XXXX</p>
            </div>
            <button className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 mt-2">Ver Painel de Leads</button>
        </div>
    </EarlyAccessPreviewWrapper>
);

const AREarlyAccessPreview: React.FC<{}> = () => (
    <EarlyAccessPreviewWrapper description="Use a câmera do seu celular para visualizar o projeto em tamanho real no ambiente do seu cliente.">
        <div className="text-center">
            <p>Abra o <strong>MarcenApp</strong> no seu celular e aponte a câmera para o local desejado.</p>
            <div className="p-4 my-2 text-3xl">📱</div>
            <button className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600">Iniciar Visualização AR</button>
        </div>
    </EarlyAccessPreviewWrapper>
);



// ... Modals ...
const Generate3DFrom2DModal: React.FC<{isOpen: boolean; onClose: () => void; onGenerate: (style: string, finish: string) => void; project: ProjectHistoryItem; isGenerating: boolean;}> = ({ isOpen, onClose, onGenerate, project, isGenerating }) => {
    const [style, setStyle] = useState(project.style); const [finish, setFinish] = useState('');
    useEffect(() => { if (isOpen) { setStyle(project.style); setFinish(project.selectedFinish ? `${project.selectedFinish.finish.name} da ${project.selectedFinish.manufacturer}` : 'madeira clara'); } }, [isOpen, project]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><CubeIcon /> Gerar 3D a partir da Planta Baixa</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 flex-grow overflow-y-auto space-y-6"><div><h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Planta Baixa de Referência</h3><img src={project.image2d!} alt="Planta baixa" className="w-full max-w-sm mx-auto h-auto object-contain rounded-md bg-white p-1" /></div><div><label htmlFor="style-select" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Estilo de Design</label><select id="style-select" value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition">{initialStylePresets.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label htmlFor="finish-input" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Acabamento Principal</label><input id="finish-input" type="text" value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Ex: Madeira clara, MDF branco fosco" className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition" /></div></main><footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-end gap-4"><button onClick={onClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button><button onClick={() => onGenerate(style, finish)} disabled={isGenerating} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition disabled:opacity-50 flex items-center gap-2">{isGenerating ? <Spinner size="sm" /> : <WandIcon />}{isGenerating ? 'Gerando...' : 'Gerar Visualização 3D'}</button></footer></div></div>);
};
const FutureFeatureModal: React.FC<{isOpen: boolean, onClose: () => void, title: string, icon: React.ReactNode}> = ({isOpen, onClose, title, icon}) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">{icon} {title}</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 text-center"><p className="text-lg text-[#6a5f5f] dark:text-[#c7bca9]">Esta funcionalidade está em desenvolvimento e será liberada em breve.</p><p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mt-2">Fique de olho nas novidades!</p></main></div></div>);
};
const SupplierPricingModal: React.FC<{isOpen: boolean; onClose: () => void; project: ProjectHistoryItem; onUpdateCosts: (newMaterialCost: number) => void; showAlert: (message: string, title?: string) => void;}> = ({ isOpen, onClose, project, onUpdateCosts, showAlert }) => {
    const [pricedItems, setPricedItems] = useState<PricedBomItem[]>([]); const [isParsing, setIsParsing] = useState(true);
    useEffect(() => { const parseBom = async () => { if (isOpen && project.bom) { setIsParsing(true); try { const parsed = await parseBomToList(project.bom); setPricedItems(parsed.map(item => ({ ...item, isSearching: false }))); } catch (error) { showAlert(error instanceof Error ? error.message : "Erro ao analisar BOM.", "Erro"); onClose(); } finally { setIsParsing(false); } } }; parseBom(); }, [isOpen, project.bom, showAlert, onClose]);
    const handleFindPrice = async (index: number) => { const items = [...pricedItems]; items[index].isSearching = true; setPricedItems(items); try { const item = items[index]; const description = `${item.qty} ${item.item} (${item.dimensions})`; const result = await findSupplierPrice(description); items[index] = { ...items[index], ...result, price: result.price }; } catch (error) { showAlert(error instanceof Error ? error.message : "Erro ao buscar preço.", "Erro"); } finally { items[index].isSearching = false; setPricedItems(items); } };
    const newTotalCost = useMemo(() => pricedItems.reduce((total, item) => total + ((parseInt(item.qty.match(/(\d+)/)?.[0] || '1', 10)) * (item.price || 0)), 0), [pricedItems]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}><div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><DollarCircleIcon /> Cotação de Preços com Fornecedores</h2><button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button></header><main className="p-6 flex-grow overflow-y-auto"><div className="overflow-x-auto"><table className="w-full text-left table-auto"><thead><tr className="border-b-2 border-[#e6ddcd] dark:border-[#4a4040]"><th className="p-2">Item</th><th className="p-2">Qtde</th><th className="p-2">Dimensões</th><th className="p-2">Preço Unit.</th><th className="p-2">Fornecedor</th><th className="p-2">Ação</th></tr></thead><tbody>{isParsing ? (<tr><td colSpan={6} className="text-center p-8"><Spinner /></td></tr>) : (pricedItems.map((item, index) => (<tr key={index} className="border-b border-[#e6ddcd] dark:border-[#4a4040]"><td className="p-2">{item.item}</td><td className="p-2">{item.qty}</td><td className="p-2">{item.dimensions}</td><td className="p-2">{item.price ? `R$ ${item.price.toFixed(2)}` : 'N/A'}</td><td className="p-2">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">{item.supplier}</a> : item.supplier || 'N/A'}</td><td className="p-2"><button onClick={() => handleFindPrice(index)} disabled={item.isSearching} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] text-sm py-1 px-2 rounded disabled:opacity-50 flex items-center gap-1">{item.isSearching ? <Spinner size="sm"/> : <SearchIcon/>} {item.isSearching ? 'Buscando' : 'Buscar'}</button></td></tr>)))}</tbody></table></div></main><footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center"><div className="text-lg">Custo Total dos Materiais: <span className="font-bold text-[#b99256] dark:text-[#d4ac6e]">R$ {newTotalCost.toFixed(2)}</span></div><div className="flex gap-4"><button onClick={onClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-4 rounded hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">Cancelar</button><button onClick={() => { onUpdateCosts(newTotalCost); onClose(); }} className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] transition">Atualizar Custos</button></div></footer></div></div>);
};

const StyleSuggestionsModal: React.FC<{
    isOpen: boolean;
    isLoading: boolean;
    suggestions: string[];
    onClose: () => void;
    onSelectStyle: (style: string) => void;
}> = ({ isOpen, isLoading, suggestions, onClose, onSelectStyle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-md shadow-xl border border-[#e6ddcd] dark:border-[#4a4040]"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <SparklesIcon /> Sugestões de Estilo da Iara
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                <main className="p-6 min-h-[200px] flex flex-col items-center justify-center">
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner />
                            <p className="mt-4 text-[#8a7e7e] dark:text-[#a89d8d]">Analisando seu projeto e gerando ideias...</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-3">
                            <p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9] mb-4 text-center">
                                Selecione um estilo abaixo para aplicá-lo ao seu projeto e gerar uma nova versão.
                            </p>
                            {suggestions.map((style, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSelectStyle(style)}
                                    className="w-full text-left bg-[#f0e9dc] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] font-semibold py-3 px-4 rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] transition-transform hover:scale-105 flex justify-between items-center group"
                                >
                                    <span>{style}</span>
                                    <span className="opacity-0 group-hover:opacity-100 text-xs bg-[#d4ac6e] text-[#3e3535] px-2 py-1 rounded font-bold transition-opacity">Aplicar</span>
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

interface AppProps {
  onLogout: () => void;
  userEmail: string;
  userPlan: string;
}

const ADMIN_EMAILS = ['evaldo0510@gmail.com'];

export const App: React.FC<AppProps> = ({ onLogout, userEmail, userPlan }) => {
  // --- STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Gerando projeto...');
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [favoriteFinishes, setFavoriteFinishes] = useState<Finish[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

  // Input States
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTypePresetId, setProjectTypePresetId] = useState(projectTypePresets[0].id);
  const [stylePreset, setStylePreset] = useState(initialStylePresets[0]);
  const [availableStyles, setAvailableStyles] = useState(initialStylePresets);
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
  const [isBomGeneratorOpen, setIsBomGeneratorOpen] = useState(false);
  const [isCuttingPlanGeneratorOpen, setIsCuttingPlanGeneratorOpen] = useState(false);
  const [isCostEstimatorOpen, setIsCostEstimatorOpen] = useState(false);
  const [futureFeatureModal, setFutureFeatureModal] = useState<{ isOpen: boolean; title: string; icon: React.ReactNode }>({ isOpen: false, title: '', icon: null });
  const [earlyAccessModal, setEarlyAccessModal] = useState<{ isOpen: boolean; title: string; component: React.ReactNode }>({ isOpen: false, title: '', component: null });
  const [isSupplierPricingModalOpen, setIsSupplierPricingModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} });
  const [styleSuggestions, setStyleSuggestions] = useState<{isOpen: boolean, isLoading: boolean, suggestions: string[]}>({ isOpen: false, isLoading: false, suggestions: [] });
  const [activeTab, setActiveTab] = useState<'3d' | '2d' | 'details'>('3d');
  const [isGenerate3DFrom2DModalOpen, setIsGenerate3DFrom2DModalOpen] = useState(false);
  const [arViewState, setArViewState] = useState<{ isOpen: boolean; src: string }>({ isOpen: false, src: '' });
  const [isEncontraProOpen, setIsEncontraProOpen] = useState(false);

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- DERIVED STATE ---
  const activePreset = useMemo(() => projectTypePresets.find(p => p.id === projectTypePresetId), [projectTypePresetId]);

  const { isProjectCreationAllowed, monthlyProjectCount, projectLimit } = useMemo(() => {
    if (userPlan !== 'hobby') {
      return { isProjectCreationAllowed: true, monthlyProjectCount: 0, projectLimit: Infinity };
    }

    const limit = 5;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const count = history.filter(p => p.timestamp >= startOfMonth).length;

    return {
      isProjectCreationAllowed: count < limit,
      monthlyProjectCount: count,
      projectLimit: limit,
    };
  }, [history, userPlan]);


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
    setStylePreset(initialStylePresets[0]);
    setUploadedImages(null);
    setUploadedFloorPlan(null);
    setSelectedFinish(null);
    setWithLedLighting(false);
    setCurrentProject(null);
  }, []);

  const handleGenerateProject = async () => {
    if (!isProjectCreationAllowed) {
        showAlert(`Você atingiu o limite de ${projectLimit} projetos/mês do plano Hobby. Atualize para o plano Profissional para criar projetos ilimitados.`, "Limite Atingido");
        return;
    }
    
    if (!projectDescription.trim()) {
      showAlert("Por favor, descreva sua ideia para o projeto no Passo 1.", "Descrição Necessária");
      descriptionTextAreaRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Criando seu projeto com a Iara...');
    setCurrentProject(null); // Clear previous project from view while generating

    try {
      // 1. Construct the prompt
      const preset = activePreset;
      if (!preset) {
          throw new Error("Tipo de projeto inválido selecionado.");
      }
      
      const genderArticle = preset.gender === 'f' ? 'uma' : 'um';
      
      let finishDescription = 'não especificado';
      if (selectedFinish) {
          finishDescription = `${selectedFinish.finish.name} da ${selectedFinish.manufacturer}`;
          if (selectedFinish.handleDetails) {
              finishDescription += ` com puxadores do tipo ${selectedFinish.handleDetails}`;
          }
      }

      const prompt = `
**Persona:** Você é um designer de interiores e renderizador 3D de classe mundial, especialista em marcenaria.

**Tarefa:** Crie uma imagem 3D fotorrealista de ${genderArticle} ${preset.name} com base nos detalhes a seguir. O foco principal é o móvel planejado.

**Descrição Detalhada do Móvel:** "${projectDescription}"

**Estilo de Design:** ${stylePreset}.

**Acabamento Principal:** ${finishDescription}.

**Iluminação:** ${withLedLighting ? 'O projeto deve incluir iluminação de LED embutida para criar um ambiente aconchegante e destacar o design.' : 'Iluminação natural e suave.'}

**Requisitos da Imagem:**
- A imagem deve ser fotorrealista, com alta qualidade de renderização.
- Mostre o móvel em um ambiente de estúdio de fotografia minimalista, ou um ambiente residencial limpo e neutro que valorize o móvel.
- O enquadramento deve ser atraente, mostrando os melhores ângulos do móvel.
- Preste atenção aos detalhes de texturas, sombras e reflexos para um resultado mais realista.
`;

      // 2. Call the image generation service
      const base64Image = await generateImage(prompt, uploadedImages);
      const imageUrl = `data:image/png;base64,${base64Image}`;

      // 3. Create and save the new project
      const newProjectData: Omit<ProjectHistoryItem, 'id' | 'timestamp'> = {
        name: `${preset.name} ${stylePreset}`,
        description: projectDescription,
        views3d: [imageUrl],
        image2d: uploadedFloorPlan ? uploadedFloorPlan.full : null,
        style: stylePreset,
        withLedLighting,
        selectedFinish: selectedFinish || null,
        bom: null,
        cuttingPlan: null,
        cuttingPlanImage: null,
        cuttingPlanOptimization: null,
        assemblyDetails: null,
        // Keep uploaded images for reference
        uploadedReferenceImageUrls: uploadedImages ? uploadedImages.map(img => `data:${img.mimeType};base64,${img.data}`) : null,
        uploadedFloorPlanUrl: uploadedFloorPlan ? uploadedFloorPlan.full : null,
      };

      const newHistory = await addProjectToHistory(newProjectData);
      
      setHistory(newHistory);
      // The new project should be the first in the sorted list from getHistory
      if (newHistory.length > 0) {
        setCurrentProject(newHistory[0]);
      }

    } catch (error) {
      console.error("Failed to generate project:", error);
      showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.', 'Erro na Geração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: ProjectHistoryItem) => {
    setCurrentProject(project);

    // Populate form with project data to allow for variations
    setProjectDescription(project.description);
    
    const preset = projectTypePresets.find(p => project.name.toLowerCase().includes(p.name.toLowerCase()));
    setProjectTypePresetId(preset ? preset.id : projectTypePresets[0].id);
    
    setStylePreset(project.style);

    if (project.uploadedReferenceImageUrls) {
        const images = project.uploadedReferenceImageUrls.map(url => {
            const parts = url.split(',');
            const data = parts[1];
            const mimeType = url.match(/data:(.*);/)?.[1] || 'image/png';
            return { data, mimeType };
        });
        setUploadedImages(images);
    } else {
        setUploadedImages(null);
    }

    if (project.uploadedFloorPlanUrl) {
        const url = project.uploadedFloorPlanUrl;
        const parts = url.split(',');
        const data = parts[1];
        const mimeType = url.match(/data:(.*);/)?.[1] || 'image/png';
        setUploadedFloorPlan({ data, mimeType, full: url });
    } else {
        setUploadedFloorPlan(null);
    }

    setSelectedFinish(project.selectedFinish || null);
    setWithLedLighting(project.withLedLighting || false);
    
    setIsHistoryOpen(false); // Close panel after selecting
  };

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
          // Defensively filter out the current style and ensure only 3 suggestions are shown
          const filteredSuggestions = suggestions
              .filter(s => s.toLowerCase() !== currentProject.style.toLowerCase())
              .slice(0, 3);
          setStyleSuggestions({ isOpen: true, isLoading: false, suggestions: filteredSuggestions });
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

  const handleGenerate3DFrom2D = async (style: string, finish: string) => {
    if (!currentProject || !currentProject.image2d) {
        showAlert("É necessário um projeto com planta baixa para gerar uma vista 3D.", "Ação Inválida");
        return;
    }
    
    setIsGenerate3DFrom2DModalOpen(false);
    setIsLoading(true);
    setLoadingMessage('Gerando visualização 3D...');

    try {
        const newImageBase64 = await generate3Dfrom2D(currentProject, style, finish);
        const newViewUrl = `data:image/png;base64,${newImageBase64}`;
        
        const updatedViews = [...currentProject.views3d, newViewUrl];

        // This is a non-destructive action. The new view is added as a variation,
        // but the project's main style is not changed. This allows the user to
        // explore different aesthetics without overriding the original project definition.
        await handleUpdateProject(currentProject.id, { 
            views3d: updatedViews,
        });
        
        setActiveTab('3d');
    } catch (error) {
        showAlert(error instanceof Error ? error.message : 'Ocorreu um erro ao gerar a visualização 3D.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateCuttingPlan = async () => {
    if (!currentProject || !currentProject.bom) {
        showAlert("É necessário ter uma Lista de Materiais (BOM) gerada para este projeto.", "Ação Inválida");
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Otimizando plano de corte...');
    try {
        const { text, image, optimization } = await generateCuttingPlan(currentProject, 2750, 1830);
        await handleUpdateProject(currentProject.id, { 
            cuttingPlan: text,
            cuttingPlanImage: `data:image/png;base64,${image}`,
            cuttingPlanOptimization: optimization,
        });
    } catch (error) {
        showAlert(error instanceof Error ? error.message : 'Erro ao gerar o plano de corte.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateAssemblyDetails = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    setLoadingMessage('Gerando guia de montagem...');
    try {
        const details = await generateAssemblyDetails(currentProject);
        await handleUpdateProject(currentProject.id, { assemblyDetails: details });
    } catch (error) {
        showAlert(error instanceof Error ? error.message : 'Erro ao gerar o guia de montagem.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEstimateCurrentProjectCosts = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    setLoadingMessage('Estimando custos do projeto...');
    try {
        const { materialCost, laborCost } = await estimateProjectCosts(currentProject);
        await handleUpdateProject(currentProject.id, {
            materialCost,
            laborCost,
        });
    } catch (error) {
        showAlert(error instanceof Error ? error.message : 'Erro ao estimar custos.');
    } finally {
        setIsLoading(false);
    }
  };

  const openFutureFeature = (title: string, component: React.ReactNode, icon: React.ReactNode) => {
    if (isAdmin) {
      setEarlyAccessModal({ isOpen: true, title, component });
    } else {
      setFutureFeatureModal({ isOpen: true, title, icon });
    }
  };


  const renderResults = () => {
    if (!currentProject) {
       return (
         <div className="text-center p-12 bg-[#fffefb] dark:bg-[#3e3535] rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]">
           <LogoIcon className="mx-auto w-16 h-16 text-[#b99256] dark:text-[#d4ac6e]" />
           <h2 className="mt-4 text-3xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8]">Bem-vindo ao MarcenApp</h2>
           <p className="mt-2 text-lg text-[#6a5f5f] dark:text-[#c7bca9]">
             Comece a transformar suas ideias em realidade. Use o painel à esquerda para criar seu primeiro projeto.
           </p>
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
                    {currentProject.image2d ? (
                        <button
                            onClick={() => setIsGenerate3DFrom2DModalOpen(true)}
                            disabled={isLoading}
                            className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <CubeIcon /> Gerar 3D da Planta
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerateFloorPlan}
                            disabled={isLoading || !currentProject.views3d?.length}
                            className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                            title={!currentProject.views3d?.length ? "Gere uma vista 3D primeiro" : "Gerar Planta Baixa Técnica"}
                        >
                            <BlueprintIcon /> Gerar Planta Baixa 2D
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto">
                    <button onClick={() => setActiveTab('3d')} className={`${tabBaseClasses} ${activeTab === '3d' ? tabActiveClasses : tabInactiveClasses}`}>
                        <CubeIcon /> Visualização 3D
                    </button>
                    <button onClick={() => setActiveTab('2d')} className={`${tabBaseClasses} ${activeTab === '2d' ? tabActiveClasses : tabInactiveClasses}`}>
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
                        onARClick={(src) => setArViewState({ isOpen: true, src })}
                        onNewViewClick={() => setNewViewGeneratorState({ isOpen: true, project: currentProject })}
                    />
                )}
                {activeTab === '2d' && (
                     currentProject.image2d ? (
                        <Project2DViewer 
                            src={currentProject.image2d}
                            projectName={currentProject.name}
                            onEditClick={(src) => setLayoutEditorState({ isOpen: true, src })}
                        />
                    ) : (
                        <div className="text-center p-8">
                            <p className="text-[#8a7e7e] dark:text-[#a89d8d] mb-4">Nenhuma planta baixa gerada para este projeto ainda.</p>
                            <p className="text-sm text-[#a89d8d] dark:text-[#8a7e7e]">Use o botão "Gerar Planta Baixa 2D" no cabeçalho para criar uma.</p>
                        </div>
                    )
                )}
                {activeTab === 'details' && (
                   <div className="space-y-8 animate-fadeIn">
                        {/* BOM Section */}
                        <section>
                            <h3 className="text-xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2"><BookIcon /> Lista de Materiais (BOM)</h3>
                            {currentProject.bom ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]"
                                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.bom) }} />
                            ) : (
                                <div className="text-center p-6 bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-lg">
                                    <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mb-4">A lista de materiais ainda não foi gerada.</p>
                                    <button onClick={() => setIsBomGeneratorOpen(true)} className="bg-[#3e3535] hover:bg-[#2d2424] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">Gerar BOM</button>
                                </div>
                            )}
                        </section>
                        {/* Cutting Plan Section */}
                        <section>
                            <h3 className="text-xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2"><ToolsIcon /> Plano de Corte</h3>
                            {currentProject.cuttingPlan ? (
                                <div className="space-y-4">
                                    {currentProject.cuttingPlanImage && (
                                        <img src={currentProject.cuttingPlanImage} alt="Diagrama do Plano de Corte" className="rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] w-full" />
                                    )}
                                    <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]"
                                        dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.cuttingPlan) }} />
                                    {currentProject.cuttingPlanOptimization && (
                                        <div>
                                            <h4 className="font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Dicas de Otimização</h4>
                                            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-[#fffbeb] dark:bg-amber-900/20 rounded-lg border border-[#fde68a] dark:border-amber-700/50"
                                                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.cuttingPlanOptimization) }} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-lg">
                                    <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mb-4">O plano de corte ainda não foi gerado.</p>
                                    <button
                                    onClick={handleGenerateCuttingPlan}
                                    disabled={!currentProject.bom || isLoading}
                                    className="bg-[#3e3535] hover:bg-[#2d2424] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                                    title={!currentProject.bom ? "Gere a BOM primeiro" : ""}
                                    >
                                    {isLoading ? <Spinner size="sm" /> : <WandIcon />}
                                    Gerar Plano de Corte (2750x1830mm)
                                    </button>
                                </div>
                            )}
                        </section>
                        {/* Assembly Guide Section */}
                        <section>
                            <h3 className="text-xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2"><RulerIcon /> Guia de Montagem</h3>
                            {currentProject.assemblyDetails ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]"
                                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(currentProject.assemblyDetails) }} />
                            ) : (
                                <div className="text-center p-6 bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-lg">
                                    <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mb-4">O guia de montagem ainda não foi gerado.</p>
                                    <button onClick={handleGenerateAssemblyDetails} disabled={isLoading} className="bg-[#3e3535] hover:bg-[#2d2424] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                                        {isLoading ? <Spinner size="sm" /> : <WandIcon />}
                                        Gerar Guia de Montagem
                                    </button>
                                </div>
                            )}
                        </section>
                        {/* Costs Section */}
                        <section>
                            <h3 className="text-xl font-bold font-serif text-[#3e3535] dark:text-[#f5f1e8] mb-3 flex items-center gap-2"><CurrencyDollarIcon /> Custos e Orçamento</h3>
                            <div className="p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                <div className="flex justify-between items-center mb-4">
                                    <p><span className="font-semibold">Custo de Material:</span> {currentProject.materialCost ? `R$ ${currentProject.materialCost.toFixed(2)}` : 'Não calculado'}</p>
                                    <p><span className="font-semibold">Custo de Mão de Obra:</span> {currentProject.laborCost ? `R$ ${currentProject.laborCost.toFixed(2)}` : 'Não calculado'}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <button
                                        onClick={handleEstimateCurrentProjectCosts}
                                        disabled={isLoading || !currentProject.bom}
                                        className="bg-[#3e3535] hover:bg-[#2d2424] text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                        title={!currentProject.bom ? "Gere a BOM primeiro" : "Estimar custos com IA"}
                                    >
                                        {isLoading && loadingMessage.includes('custos') ? <Spinner size="sm" /> : <SparklesIcon />}
                                        {isLoading && loadingMessage.includes('custos') ? 'Estimando...' : 'Estimar Custos com IA'}
                                    </button>
                                    <button onClick={() => setIsSupplierPricingModalOpen(true)} disabled={!currentProject.bom} className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg transition text-sm disabled:opacity-50">
                                        Cotação com Fornecedores
                                    </button>
                                    <button onClick={() => setIsProposalModalOpen(true)} className="sm:col-span-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                                        Gerar Proposta Completa
                                    </button>
                                </div>
                            </div>
                        </section>
                   </div>
                )}
            </div>
            
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
        onOpenWhatsapp={() => openFutureFeature('Integração com WhatsApp', <WhatsappEarlyAccessPreview project={currentProject} />, <WhatsappIcon />)}
        onOpenAutoPurchase={() => openFutureFeature('Compra Automática de Materiais', <AutoPurchaseEarlyAccessPreview project={currentProject} />, <StoreIcon />)}
        onOpenEmployeeManagement={() => openFutureFeature('Gestão de Funcionários', <EmployeeManagementEarlyAccessPreview />, <UsersIcon />)}
        onOpenLearningHub={() => openFutureFeature('Hub de Aprendizagem', <LearningHubEarlyAccessPreview />, <CommunityIcon />)}
        onOpenEncontraPro={() => setIsEncontraProOpen(true)}
        onOpenAR={() => openFutureFeature('Realidade Aumentada', <AREarlyAccessPreview />, <ARIcon />)}
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
                            {availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
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
              disabled={isLoading || !isProjectCreationAllowed}
              title={!isProjectCreationAllowed ? `Você atingiu o limite de ${projectLimit} projetos/mês do plano Hobby.` : ''}
              className="w-full bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {isLoading ? <><Spinner size="sm" /> Gerando...</> : <><WandIcon /> Gerar Projeto com Iara</>}
            </button>
            {userPlan === 'hobby' && (
                <div className="mt-2 text-center text-sm text-[#8a7e7e] dark:text-[#a89d8d]">
                    <p>Projetos criados este mês: {monthlyProjectCount} / {projectLimit}</p>
                    {!isProjectCreationAllowed && (
                        <p className="font-semibold text-amber-600 dark:text-amber-400 mt-1">
                            Atualize para o plano Profissional para criar projetos ilimitados.
                        </p>
                    )}
                </div>
            )}
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
      {imageEditorState.isOpen && currentProject && <ImageEditor isOpen={imageEditorState.isOpen} imageSrc={imageEditorState.src} projectDescription={currentProject.description} onClose={() => setImageEditorState({ isOpen: false, src: '' })} onSave={(newImg) => handleUpdateProject(currentProject!.id, { views3d: [...currentProject!.views3d, `data:image/png;base64,${newImg}`]})} showAlert={showAlert} />}
      {layoutEditorState.isOpen && currentProject && <LayoutEditor isOpen={layoutEditorState.isOpen} floorPlanSrc={layoutEditorState.src} projectDescription={currentProject.description} onClose={() => setLayoutEditorState({ isOpen: false, src: '' })} onSave={(newImg) => handleUpdateProject(currentProject!.id, { image2d: `data:image/png;base64,${newImg}` })} showAlert={showAlert} />}
      {isProposalModalOpen && currentProject && <ProposalModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} project={currentProject} client={clients.find(c => c.id === currentProject!.clientId)} showAlert={showAlert} />}
      {newViewGeneratorState.isOpen && newViewGeneratorState.project && <NewViewGenerator isOpen={newViewGeneratorState.isOpen} project={newViewGeneratorState.project} onClose={() => setNewViewGeneratorState({ isOpen: false, project: null })} onSaveComplete={loadAllData} showAlert={showAlert} />}
      {currentProject && <Generate3DFrom2DModal isOpen={isGenerate3DFrom2DModalOpen} onClose={() => setIsGenerate3DFrom2DModalOpen(false)} onGenerate={handleGenerate3DFrom2D} project={currentProject} isGenerating={isLoading} />}
      <BomGeneratorModal isOpen={isBomGeneratorOpen} onClose={() => setIsBomGeneratorOpen(false)} showAlert={showAlert} />
      <CuttingPlanGeneratorModal isOpen={isCuttingPlanGeneratorOpen} onClose={() => setIsCuttingPlanGeneratorOpen(false)} showAlert={showAlert} />
      <CostEstimatorModal isOpen={isCostEstimatorOpen} onClose={() => setIsCostEstimatorOpen(false)} showAlert={showAlert} />
      <FutureFeatureModal isOpen={futureFeatureModal.isOpen} onClose={() => setFutureFeatureModal({...futureFeatureModal, isOpen: false})} title={futureFeatureModal.title} icon={futureFeatureModal.icon} />
      <EarlyAccessModal isOpen={earlyAccessModal.isOpen} onClose={() => setEarlyAccessModal({...earlyAccessModal, isOpen: false})} title={earlyAccessModal.title}> {earlyAccessModal.component} </EarlyAccessModal>
      {currentProject && <SupplierPricingModal isOpen={isSupplierPricingModalOpen} onClose={() => setIsSupplierPricingModalOpen(false)} project={currentProject} onUpdateCosts={(newCost) => handleUpdateProject(currentProject.id, { materialCost: newCost })} showAlert={showAlert} />}
      <StyleSuggestionsModal 
            isOpen={styleSuggestions.isOpen}
            isLoading={styleSuggestions.isLoading}
            suggestions={styleSuggestions.suggestions}
            onClose={() => setStyleSuggestions({ isOpen: false, isLoading: false, suggestions: [] })}
            onSelectStyle={(style) => {
                if (!availableStyles.includes(style)) {
                    setAvailableStyles(prev => [style, ...prev]);
                }
                setStylePreset(style);
                setStyleSuggestions({ isOpen: false, isLoading: false, suggestions: [] });
            }}
        />
       <ARViewer isOpen={arViewState.isOpen} imageSrc={arViewState.src} onClose={() => setArViewState({ isOpen: false, src: '' })} showAlert={showAlert} />
       <EncontraProModal isOpen={isEncontraProOpen} onClose={() => setIsEncontraProOpen(false)} showAlert={showAlert} />
    </div>
  );
};
