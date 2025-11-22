
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { FinishesSelector } from './components/FinishesSelector';
import { ImageUploader } from './components/ImageUploader';
import { VoiceInputButton } from './components/VoiceInputButton';
import { HistoryPanel } from './components/HistoryPanel';
import { ClientPanel } from './components/ClientPanel';
import { DistributorFinder } from './components/DistributorFinder';
import { ResearchAssistant } from './components/ResearchAssistant';
import { LiveAssistant } from './components/LiveAssistant';
import { AboutModal } from './components/AboutModal';
import { BomGeneratorModal } from './components/BomGeneratorModal';
import { CuttingPlanGeneratorModal } from './components/CuttingPlanGeneratorModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';
import { EncontraProModal } from './components/EncontraProModal';
import { ARViewer } from './components/ARViewer';
import { ProposalModal } from './components/ProposalModal';
import { ImageEditor } from './components/ImageEditor';
import { LayoutEditor } from './components/LayoutEditor';
import { NewViewGenerator } from './components/NewViewGenerator';
import { ManagementDashboard } from './components/ManagementDashboard';
import { DistributorPortal } from './components/DistributorPortal';
import { NotificationSystem } from './components/NotificationSystem'; 
import { CommissionWallet } from './components/CommissionWallet'; 
import { ImageProjectGenerator } from './components/ImageProjectGenerator';
import { StoreDashboard } from './components/StoreDashboard';
import { InteractiveImageViewer } from './components/InteractiveImageViewer';
import { DecorationListModal } from './components/DecorationListModal';
import { AlertModal, Spinner, WandIcon, BookIcon, BlueprintIcon, CurrencyDollarIcon, SparklesIcon, RulerIcon, CubeIcon, VideoCameraIcon, HighQualityIcon, PlantIcon, ShoppingBagIcon, ShareIcon } from './components/Shared';
import { StyleAssistant } from './components/StyleAssistant';
import { getHistory, addProjectToHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish, updateProjectInHistory } from './services/historyService';
import { suggestAlternativeStyles, generateImage, suggestAlternativeFinishes, generateFloorPlanFrom3D } from './services/geminiService';
import type { ProjectHistoryItem, Client, Finish } from './types';
import { initialStylePresets } from './services/presetService';
import { createDemoFloorPlanBase64 } from './utils/helpers';

interface AppProps {
  onLogout: () => void;
  userEmail: string;
  userPlan: string;
}

// ... (Keep StyleSuggestionsModal, FinishSuggestionsModal, ToolButton, framingOptions as they are)
// Re-including simple Modal components to ensure context integrity if previously defined in App.tsx
interface StyleSuggestionsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    suggestions: string[];
    onClose: () => void;
    onSelectStyle: (style: string) => void;
}

const StyleSuggestionsModal: React.FC<StyleSuggestionsModalProps> = ({ isOpen, isLoading, suggestions, onClose, onSelectStyle }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-md p-6 shadow-xl border border-[#e6ddcd] dark:border-[#4a4040]" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4">Sugestões de Estilo</h3>
                {isLoading ? (
                    <div className="text-center py-8">
                        <Spinner />
                        <p className="mt-2 text-sm text-[#8a7e7e] dark:text-[#a89d8d]">Analisando sua descrição...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map((style, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectStyle(style)}
                                className="w-full text-left p-3 rounded-lg bg-[#f0e9dc] dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] transition"
                            >
                                {style}
                            </button>
                        ))}
                        {suggestions.length === 0 && <p className="text-center text-sm">Nenhuma sugestão encontrada.</p>}
                    </div>
                )}
                <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-[#8a7e7e] hover:text-[#3e3535] dark:text-[#a89d8d] dark:hover:text-white">Cancelar</button>
            </div>
        </div>
    );
};

interface FinishSuggestionsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    suggestions: Finish[];
    onClose: () => void;
    onSelectFinish: (finish: Finish) => void;
}

const FinishSuggestionsModal: React.FC<FinishSuggestionsModalProps> = ({ isOpen, isLoading, suggestions, onClose, onSelectFinish }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl p-6 shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2">
                    <SparklesIcon /> Sugestões de Acabamento
                </h3>
                {isLoading ? (
                    <div className="text-center py-12 flex-grow">
                        <Spinner />
                        <p className="mt-2 text-sm text-[#8a7e7e] dark:text-[#a89d8d]">A Iara está buscando materiais...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-y-auto p-1">
                        {suggestions.map((finish) => (
                            <button
                                key={finish.id}
                                onClick={() => onSelectFinish(finish)}
                                className="bg-[#f0e9dc] dark:bg-[#3e3535] rounded-lg overflow-hidden border border-[#e6ddcd] dark:border-[#4a4040] hover:border-[#d4ac6e] hover:scale-105 transition text-left flex flex-col"
                            >
                                <div className="h-24 w-full" style={{ backgroundColor: finish.hexCode }}></div>
                                <div className="p-3 flex-grow">
                                    <h4 className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">{finish.name}</h4>
                                    <p className="text-xs text-6a5f5f dark:text-[#c7bca9] mt-1">{finish.manufacturer}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-[#8a7e7e] hover:text-[#3e3535] border-t border-[#e6ddcd] dark:border-[#4a4040]">Fechar</button>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; done?: boolean }> = ({ icon, label, onClick, done }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm transition-all min-w-[70px] ${done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-[#3e3535] border-[#e6ddcd] dark:border-[#4a4040] hover:border-[#d4ac6e] hover:shadow-md'}`}
    >
        <div className={`p-2 rounded-full mb-1 ${done ? 'text-green-600 dark:text-green-400' : 'text-[#6a5f5f] dark:text-[#c7bca9]'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold text-[#3e3535] dark:text-[#f5f1e8] whitespace-nowrap">{label}</span>
    </button>
);

const framingOptions = [
    { label: 'Padrão (Sem Cortes)', value: 'ENQUADRAMENTO DE SEGURANÇA (SAFE FRAME): Renderize o projeto 3D centralizado, aplicando um ZOOM OUT agressivo (0.6x). O objeto deve ocupar no máximo 75% da imagem, deixando 12.5% de margem vazia em CADA lado (topo, baixo, esq, dir). Garanta que NENHUMA parte do móvel toque as bordas. Centralize perfeitamente.' },
    { label: 'Grande Angular (Tudo Visível)', value: 'Gere uma imagem 3D do projeto, ajustando o enquadramento para que todo o espaço fique visível, inclusive as paredes, teto e piso.' },
    { label: 'Horizontal (Panorâmico)', value: 'Mostre o móvel ou ambiente completamente, em formato horizontal, detalhando todas as laterais e evitando cortes nos extremos.' },
    { label: 'Social Media (Proporção)', value: 'Crie uma visualização 3D centralizada e com proporção adequada ao quadro, pronta para compartilhamento nas redes sociais.' },
    { label: 'Zoom Aberto (Detalhes)', value: 'Renderize o espaço em ângulo aberto, ajustando o zoom para exibir todo o projeto e os detalhes do acabamento.' },
    { label: 'Quadrado (Instagram)', value: 'Produza uma imagem 3D quadrada do ambiente, ideal para redes sociais, sem corte das bordas nem partes ocultas.' },
    { label: 'Aprovação (Luz/Sombra)', value: 'Gere o projeto com todos os aspectos do ambiente visíveis, inclusive filtra luz e sombra para facilitar aprovação do cliente.' },
    { label: 'Inteligência Avançada (Auto-Adaptação)', value: 'Utilize a ferramenta de interpretação avançada para entender todos os detalhes, preferências e necessidades descritas pelo usuário para o projeto. Analise automaticamente projetos semelhantes já existentes no sistema e adapte o texto da solicitação, garantindo que o 3D gerado corresponda exatamente ao que foi pedido, incluindo características, medidas, acabamentos, funcionalidade e estilo desejado. Aperfeiçoe a descrição para evitar cortes, ausências, ou erros, e entregue uma visualização completa e fiel ao pedido.' }
];

export const App: React.FC<AppProps> = ({ onLogout, userEmail, userPlan }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // SUPER ADMIN LOGIC
  const isSuperAdmin = userEmail.toLowerCase() === 'evaldo0510@gmail.com';
  
  // Determine effective plan and role
  const effectivePlan = isSuperAdmin ? 'business' : userPlan; // 'business' gives max access
  
  // User Role Logic (Partner vs Carpenter)
  const isPartner = userPlan === 'partner' || isSuperAdmin;
  const isCarpenter = userPlan !== 'partner' || isSuperAdmin;
  // Store Owner Role - Currently restricted to Super Admin (Standby Mode)
  const isStoreOwner = isSuperAdmin;

  // Main Input States
  const [description, setDescription] = useState('');
  const [stylePreset, setStylePreset] = useState('Moderno');
  const [framingStrategy, setFramingStrategy] = useState(framingOptions[0].value);
  const [availableStyles, setAvailableStyles] = useState(initialStylePresets);
  const [uploadedImages, setUploadedImages] = useState<{ data: string, mimeType: string }[] | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string } | null>(null);
  const [withLedLighting, setWithLedLighting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [decorationLevel, setDecorationLevel] = useState<'minimal' | 'standard' | 'rich'>('standard');
  
  // Quality & Resolution States
  const [qualityMode, setQualityMode] = useState<'standard' | 'pro'>('standard');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'create' | 'result'>('create');

  // Data State
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [favoriteFinishes, setFavoriteFinishes] = useState<Finish[]>([]);

  // Modal States
  const [modals, setModals] = useState({
      research: false,
      live: false,
      distributors: false,
      clients: false,
      history: false,
      about: false,
      bom: false,
      cutting: false,
      cost: false,
      encontraPro: false,
      ar: false,
      proposal: false,
      imageEditor: false,
      layoutEditor: false,
      newView: false,
      management: false,
      partnerPortal: false,
      admin: false,
      wallet: false,
      notifications: false,
      projectGenerator: false,
      storeMode: false,
      decorationList: false
  });
  
  const [styleSuggestions, setStyleSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as string[] });
  const [finishSuggestions, setFinishSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as Finish[] });
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);

  // Effects
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [h, c, f] = await Promise.all([getHistory(), getClients(), getFavoriteFinishes()]);
            setHistory(h);
            setClients(c);
            setFavoriteFinishes(f);
        } catch (e) {
            console.error("Failed to load initial data", e);
        }
    };
    loadData();
  }, []);

  const showAlert = (message: string, title = 'Aviso') => setAlert({ show: true, title, message });
  const closeAlert = () => setAlert({ ...alert, show: false });
  const toggleModal = (key: keyof typeof modals, value: boolean) => setModals(prev => ({ ...prev, [key]: value }));

  const loadDemoProject = () => {
      // Generate a demo floor plan image
      const demoFloorPlan = createDemoFloorPlanBase64();
      const base64Data = demoFloorPlan.split(',')[1];
      const mimeType = 'image/png';

      setUploadedImages([{ data: base64Data, mimeType }]);
      
      setDescription("Utilize a IA Gemini Vision para analisar esta planta baixa. Identifique as paredes, a porta e a janela. Em seguida, levante as paredes e decore a sala de estar com um sofá confortável, rack para TV na parede oposta à janela, tapete central e plantas. Estilo moderno e aconchegante.");
      setStylePreset("Moderno");
      setWithLedLighting(true);
      setFramingStrategy(framingOptions[0].value);
      setSelectedFinish(null);
      setQualityMode('standard');
      setDecorationLevel('standard');
      
      showAlert("Exemplo carregado! A planta baixa foi anexada. Ao clicar em 'GERAR PROJETO 3D', a IA analisará o desenho (medidas, portas, janelas) e criará o ambiente 3D sobre ele.", "Demo com Análise de Visão");
  };

  // Handlers
  const handleGenerateProject = async () => {
      if (!description.trim()) return showAlert("Por favor, descreva seu projeto.", "Falta Descrição");
      setIsGenerating(true);
      try {
          // Simplify prompt construction - User description is the single source of truth
          let fullPrompt = `PROJETO SOLICITADO: ${description}`;

          fullPrompt += `\n\nDETALHES TÉCNICOS:`;
          fullPrompt += `\n- Estilo Visual: ${stylePreset}`;
          
          if (selectedFinish) {
              fullPrompt += `\n- Acabamento Principal: ${selectedFinish.finish.name} (${selectedFinish.manufacturer})`;
              if (selectedFinish.handleDetails) fullPrompt += `\n- Detalhes/Puxadores: ${selectedFinish.handleDetails}`;
          }
          
          if (withLedLighting) {
              fullPrompt += `\n- Iluminação: Incluir iluminação LED para valorizar o móvel.`;
          }

          // Use Pro Model if selected, passing resolution
          const usePro = qualityMode === 'pro';
          const imageBase64 = await generateImage(fullPrompt, uploadedImages, framingStrategy, usePro, imageResolution, decorationLevel);
          
          const projectData: Omit<ProjectHistoryItem, 'id' | 'timestamp'> = {
              name: `Projeto ${stylePreset} - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
              description: description,
              style: stylePreset,
              selectedFinish: selectedFinish,
              views3d: [`data:image/png;base64,${imageBase64}`],
              image2d: null,
              bom: null, 
              withLedLighting: withLedLighting,
              uploadedReferenceImageUrls: uploadedImages ? uploadedImages.map(i => `data:${i.mimeType};base64,${i.data}`) : null
          };
          
          const updatedHistory = await addProjectToHistory(projectData);
          setHistory(updatedHistory);
          setCurrentProject(updatedHistory[0]); 
          
          // Switch to result tab on mobile
          setMobileTab('result');
          
      } catch (e: any) {
          console.error(e);
          const errorMsg = e.message || JSON.stringify(e);
          if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('The caller does not have permission')) {
               if ((window as any).aistudio?.openSelectKey) {
                   await (window as any).aistudio.openSelectKey();
                   showAlert("Permissão atualizada. Por favor, tente gerar o projeto novamente.", "Acesso");
                   return;
               }
          }
          showAlert("Erro ao gerar projeto: " + (e instanceof Error ? e.message : "Erro desconhecido"));
      } finally {
          setIsGenerating(false);
      }
  };

  const handleQuickRoomSwap = async (newRoomType: string) => {
      if (!currentProject) return;
      setIsGenerating(true);
      try {
          // Use original project description but update the room function
          let fullPrompt = `TRANSFORMAÇÃO DE AMBIENTE: Mantenha a mesma geometria básica da sala (paredes, janelas), mas altere a função do ambiente para: ${newRoomType}.`;
          fullPrompt += `\n\nDETALHES:`;
          fullPrompt += `\n- Proponha móveis planejados ideais para uma ${newRoomType} neste espaço.`;
          fullPrompt += `\n- Estilo: ${currentProject.style}`;

          if (selectedFinish) {
              fullPrompt += `\n- Acabamento Principal: ${selectedFinish.finish.name}`;
          }

          const imageBase64 = await generateImage(fullPrompt, uploadedImages, framingStrategy, qualityMode === 'pro', imageResolution, decorationLevel);
          
          // Update history with new view
          const newViewUrl = `data:image/png;base64,${imageBase64}`;
          const updatedViews = [...currentProject.views3d, newViewUrl];
          const updatedProject = await updateProjectInHistory(currentProject.id, { views3d: updatedViews, name: `${newRoomType} - Variação` });
          
          setHistory(await getHistory());
          setCurrentProject(updatedProject);
          
      } catch (e: any) {
          showAlert("Erro ao trocar ambiente: " + e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleViewProject = (project: ProjectHistoryItem) => {
    setCurrentProject(project);
    setDescription(project.description);
    setStylePreset(project.style);
    setSelectedFinish(project.selectedFinish || null);
    setWithLedLighting(!!project.withLedLighting);
    setMobileTab('result');
    
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

    toggleModal('history', false);
  };

  const handleShareProject = async () => {
      if (!currentProject) return;
      const link = `https://marcenapp.com/p/${currentProject.id}`;
      
      if (navigator.share) {
          try {
              await navigator.share({
                  title: currentProject.name,
                  text: `Confira o projeto ${currentProject.name} criado no MarcenApp!`,
                  url: link
              });
          } catch (err) {
              // User cancelled
          }
      } else {
          navigator.clipboard.writeText(link);
          showAlert("Link do projeto copiado para a área de transferência!", "Link Copiado");
      }
  };

  const handleGetStyleSuggestions = async () => {
      if (!description.trim()) return showAlert("Descreva o projeto primeiro.");
      setStyleSuggestions({ isOpen: true, isLoading: true, suggestions: [] });
      try {
          const suggestions = await suggestAlternativeStyles(description, stylePreset);
          setStyleSuggestions({ isOpen: true, isLoading: false, suggestions });
      } catch (e) {
          setStyleSuggestions({ isOpen: false, isLoading: false, suggestions: [] });
          showAlert("Erro ao obter sugestões.");
      }
  };

  const handleGetFinishSuggestions = async () => {
      if (!description.trim()) return showAlert("Descreva o projeto primeiro.");
      setFinishSuggestions({ isOpen: true, isLoading: true, suggestions: [] });
      try {
          const suggestions = await suggestAlternativeFinishes(description, stylePreset);
          setFinishSuggestions({ isOpen: true, isLoading: false, suggestions });
      } catch (e) {
          setFinishSuggestions({ isOpen: false, isLoading: false, suggestions: [] });
          showAlert("Erro ao obter sugestões.");
      }
  };

  const handleOpenLayoutEditor = async () => {
    if (!currentProject) return;

    if (!currentProject.image2d) {
        if (!confirm("Gerar planta baixa agora?")) return;
        setIsGenerating(true);
        try {
            const floorPlanBase64 = await generateFloorPlanFrom3D(currentProject);
            const newImage2d = `data:image/png;base64,${floorPlanBase64}`;
            const updatedProject = await updateProjectInHistory(currentProject.id, { image2d: newImage2d });
            if (updatedProject) {
                setHistory(await getHistory());
                setCurrentProject(updatedProject);
                toggleModal('layoutEditor', true);
            }
        } catch (e) {
            showAlert("Erro ao gerar planta baixa.");
        } finally {
            setIsGenerating(false);
        }
    } else {
        toggleModal('layoutEditor', true);
    }
  };

  const handleSaveLayout = async (newImageBase64: string) => {
      if (!currentProject) return;
      const newImage2d = `data:image/png;base64,${newImageBase64}`;
      const updatedProject = await updateProjectInHistory(currentProject.id, { image2d: newImage2d });
      if (updatedProject) {
          setHistory(await getHistory());
          setCurrentProject(updatedProject);
          toggleModal('layoutEditor', false);
          showAlert("Planta atualizada!", "Sucesso");
      }
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] transition-colors duration-300 pb-20 lg:pb-0">
      <Header 
        userEmail={userEmail} 
        isAdmin={isSuperAdmin || effectivePlan === 'business'}
        // Permission Logic for Header Buttons
        isPartner={isPartner}
        isCarpenter={isCarpenter}
        isStoreOwner={isStoreOwner}
        
        onOpenResearch={() => toggleModal('research', true)}
        onOpenLive={() => toggleModal('live', true)}
        onOpenDistributors={() => toggleModal('distributors', true)}
        onOpenClients={() => toggleModal('clients', true)}
        onOpenHistory={() => toggleModal('history', true)}
        onOpenAbout={() => toggleModal('about', true)}
        onOpenBomGenerator={() => toggleModal('bom', true)}
        onOpenCuttingPlanGenerator={() => toggleModal('cutting', true)}
        onOpenCostEstimator={() => toggleModal('cost', true)}
        onOpenWhatsapp={() => showAlert("Em breve!")}
        onOpenAutoPurchase={() => showAlert("Em breve!")}
        onOpenEmployeeManagement={() => showAlert("Em breve!")}
        onOpenLearningHub={() => showAlert("Em breve!")}
        onOpenEncontraPro={() => toggleModal('encontraPro', true)}
        onOpenAR={() => toggleModal('ar', true)}
        onOpenManagement={() => toggleModal('management', true)}
        onOpenPartnerPortal={() => toggleModal('partnerPortal', true)}
        onOpenNotifications={() => toggleModal('notifications', true)}
        onOpenWallet={() => toggleModal('wallet', true)}
        onOpenProjectGenerator={() => toggleModal('projectGenerator', true)}
        onOpenStoreMode={() => toggleModal('storeMode', true)}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex sticky top-20 z-20 bg-[#f5f1e8] dark:bg-[#2d2424] border-b border-[#e6ddcd] dark:border-[#4a4040]">
          <button 
            onClick={() => setMobileTab('create')} 
            className={`flex-1 py-3 font-bold text-sm border-b-2 ${mobileTab === 'create' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e]' : 'border-transparent text-gray-500'}`}
          >
            1. Criar Projeto
          </button>
          <button 
            onClick={() => setMobileTab('result')} 
            className={`flex-1 py-3 font-bold text-sm border-b-2 ${mobileTab === 'result' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e]' : 'border-transparent text-gray-500'}`}
          >
            2. Resultado 3D
          </button>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Inputs (Creation) */}
            <div className={`${mobileTab === 'create' ? 'block' : 'hidden'} lg:block space-y-6 animate-fadeIn`}>
                
                {/* Descrição */}
                <section className="bg-white dark:bg-[#3e3535] p-5 rounded-2xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <BookIcon className="w-5 h-5"/> O que vamos criar hoje?
                        </h2>
                        <button 
                            onClick={loadDemoProject}
                            className="text-xs font-bold text-[#d4ac6e] hover:text-[#c89f5e] bg-[#f0e9dc] dark:bg-[#4a4040] px-3 py-1 rounded-full transition"
                        >
                            Exemplo c/ Planta
                        </button>
                    </div>
                    <div className="relative">
                        <textarea
                            ref={descriptionTextAreaRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-28 p-4 bg-[#f0e9dc] dark:bg-[#2d2424] border-0 rounded-xl resize-none focus:ring-2 focus:ring-[#d4ac6e] text-base"
                            placeholder="Descreva o móvel... Ex: Guarda-roupa casal com portas de correr e espelho..."
                        />
                        <div className="absolute bottom-2 right-2">
                            <VoiceInputButton onTranscript={(text) => setDescription(prev => prev + ' ' + text)} showAlert={showAlert} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <StyleAssistant onSelect={(text) => setDescription(text)} presetId="sala" /> 
                    </div>
                </section>

                {/* Estilo & Imagem de Referência */}
                <section className="bg-white dark:bg-[#3e3535] p-5 rounded-2xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5"/> Estilo do Projeto
                        </h2>
