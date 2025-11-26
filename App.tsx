
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
import { ArcVisionModule } from './components/ArcVisionModule';
import { StoreDashboard } from './components/StoreDashboard';
import { SmartWorkshopModal } from './components/SmartWorkshopModal'; 
import { InteractiveImageViewer } from './components/InteractiveImageViewer';
import { DecorationListModal } from './components/DecorationListModal';
import { DistributorAdmin } from './components/DistributorAdmin';
import { ToolsHubModal } from './components/ToolsHubModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InstallPwaModal } from './components/InstallPwaModal'; 
import { UserProfileModal } from './components/UserProfileModal';
import { DistributorOnboarding } from './components/DistributorOnboarding'; // IMPORTED
import { AlertNotification, Spinner, WandIcon, BookIcon, BlueprintIcon, CurrencyDollarIcon, SparklesIcon, ShoppingBagIcon, ShareIcon, CubeIcon, ArrowLeftIcon } from './components/Shared';
import { SmartInputAssistant } from './components/SmartInputAssistant'; 
import { RefinementPanel } from './components/RefinementPanel';
import { getHistory, addProjectToHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish, updateProjectInHistory } from './services/historyService';
import { generateImage, suggestAlternativeFinishes, generateFloorPlanFrom3D, describeImageFor3D, enhancePrompt } from './services/geminiService'; 
import type { ProjectHistoryItem, Client, Finish, AlertState } from './types';
import { initialStylePresets } from './services/presetService';

interface AppProps {
  onLogout: () => void;
  userEmail: string;
  userPlan: string;
}

// ... existing FinishSuggestionsModal component ...
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

const framingOptions = [
    { label: 'Padrão (Seguro/Sem Cortes)', value: 'ENQUADRAMENTO DE SEGURANÇA (SAFE FRAME): Renderize o projeto 3D centralizado, aplicando um ZOOM OUT agressivo (0.6x). O objeto deve ocupar no máximo 75% da imagem, deixando 12.5% de margem vazia em CADA lado (topo, baixo, esq, dir). Garanta que NENHUMA parte do móvel toque as bordas. Centralize perfeitamente.' },
    { label: 'Grande Angular (Tudo Visível)', value: 'Gere uma imagem 3D do projeto, ajustando o enquadramento para que todo o espaço fique visível, inclusive as paredes, teto e piso.' },
    { label: 'Horizontal (Panorâmico)', value: 'Mostre o móvel ou ambiente completamente, em formato horizontal, detalhando todas as laterais e evitando cortes nos extremos.' },
    { label: 'Zoom Aberto (Detalhes)', value: 'Renderize o espaço em ângulo aberto, ajustando o zoom para exibir todo o projeto e os detalhes do acabamento.' },
    { label: 'Quadrado (Instagram)', value: 'Produza uma imagem 3D quadrada do ambiente, ideal para redes sociais, sem corte das bordas nem partes ocultas.' }
];

export const App: React.FC<AppProps> = ({ onLogout, userEmail, userPlan }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // SUPER ADMIN LOGIC - RESTRICTED MODE
  const isSuperAdmin = (userEmail || '').trim().toLowerCase() === 'evaldo0510@gmail.com';
  
  // FORCE these roles to match super admin status
  const isPartner = isSuperAdmin;
  const isCarpenter = true; 
  const isStoreOwner = isSuperAdmin;

  // PWA State
  // ... existing PWA Logic ...
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isIosDevice && !isStandalone) {
        setIsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ... Input States ...
  const [description, setDescription] = useState('');
  const [stylePreset, setStylePreset] = useState('Moderno');
  const [framingStrategy, setFramingStrategy] = useState(framingOptions[0].value);
  const [uploadedImages, setUploadedImages] = useState<{ data: string, mimeType: string }[] | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string } | null>(null);
  const [withLedLighting, setWithLedLighting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false); 
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
      toolsHub: true, 
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
      decorationList: false,
      smartWorkshop: false,
      apiKey: false,
      finishSelector: false,
      userProfile: false,
      distributorOnboarding: false // ADDED
  });
  
  const [finishSuggestions, setFinishSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as Finish[] });
  const [alert, setAlert] = useState<AlertState>({ show: false, title: '', message: '' });
  
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);

  // ... Effects ...
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
    
    // Check if user profile is complete
    const profile = localStorage.getItem('userProfile');
    if (!profile && !isSuperAdmin) {
        setModals(prev => ({ ...prev, userProfile: true }));
    }
    
    // Check if came from "Sou Parceiro" link
    const isDistributorRef = sessionStorage.getItem('userPlan') === 'partner';
    if (isDistributorRef && !localStorage.getItem('distributorProfile')) {
        setModals(prev => ({ ...prev, distributorOnboarding: true }));
    }

  }, [isSuperAdmin]);

  const showAlert = (message: string, title = 'Aviso', type: AlertState['type'] = 'info') => setAlert({ show: true, title, message, type });
  const closeAlert = () => setAlert({ ...alert, show: false });
  const toggleModal = (key: keyof typeof modals, value: boolean) => setModals(prev => ({ ...prev, [key]: value }));

  const handleInstallApp = () => {
      setShowInstallModal(true);
  };

  // HANDLE TOOLS HUB SELECTION
  const handleToolSelect = (toolId: string) => {
      toggleModal('toolsHub', false);
      switch (toolId) {
          case 'project':
              // Just close hub, user is on main screen
              break;
          case 'cutting':
              toggleModal('cutting', true);
              break;
          case 'bom':
              toggleModal('bom', true);
              break;
          case 'cost':
              toggleModal('cost', true);
              break;
          case 'history':
              toggleModal('history', true);
              break;
          default:
              break;
      }
  };

  // ... loadDemoProject, handleDescribeImage, handleEnhanceDescription ...
  const loadDemoProject = () => {
      setDescription("Móvel com 3 portas verticais em madeira clara, 2 gavetas centrais com puxadores metálicos, acabamento fosco, pés retos e estilo moderno minimalista. Inclua nichos abertos na lateral e prateleiras internas.");
      setStylePreset("Moderno");
      setFramingStrategy(framingOptions[0].value);
      setQualityMode('standard');
      setUploadedImages(null); 
      showAlert("Exemplo carregado! Descrição de armário moderno preenchida.", "Demo de Armário", "success");
  };

  const handleDescribeImage = async () => {
      if (!uploadedImages || uploadedImages.length === 0) return;
      setIsAnalyzingImage(true);
      try {
          const desc = await describeImageFor3D(uploadedImages[0].data, uploadedImages[0].mimeType);
          setDescription(prev => (prev ? prev + "\n\n" : "") + desc);
          showAlert("Descrição sugerida adicionada ao campo de texto!", "Sucesso", "success");
      } catch(e) {
          showAlert("Não foi possível descrever a imagem. Verifique sua conexão.", "Erro", "error");
      } finally {
          setIsAnalyzingImage(false);
      }
  }

  const handleEnhanceDescription = async () => {
      if (!description.trim()) {
          showAlert("Digite algo para a IA melhorar.", "Aviso");
          return;
      }
      setIsEnhancingText(true);
      try {
          const enhanced = await enhancePrompt(description);
          setDescription(enhanced);
          showAlert("Texto melhorado com termos técnicos!", "Sucesso", "success");
      } catch (e) {
          showAlert("Erro ao melhorar texto.", "Erro", "error");
      } finally {
          setIsEnhancingText(false);
      }
  };

  // ... handleGenerateProject (Updated to restrict access) ...
  const handleGenerateProject = async (forcePro = false) => {
      // Only Admin can generate
      if (!isSuperAdmin) {
          showAlert("A geração de projetos 3D é um recurso Premium exclusivo. Entre em contato para liberar.", "Acesso Restrito", "warning");
          return;
      }

      if (!description.trim()) return showAlert("Por favor, descreva seu projeto.", "Falta Descrição", "warning");
      setIsGenerating(true);
      try {
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

          const usePro = forcePro || qualityMode === 'pro';
          const effectiveResolution = usePro ? '2K' : imageResolution;
          const effectiveDecoration = usePro ? 'rich' : decorationLevel;
          const effectiveFramingStrategy = forcePro ? framingOptions[0].value : framingStrategy;

          if (forcePro) {
              showAlert("Gerando versão em Alta Definição (2K) com Enquadramento Seguro...", "Upgrade Pro", "info");
          }

          const imageBase64 = await generateImage(
              fullPrompt, 
              uploadedImages, 
              effectiveFramingStrategy, 
              usePro, 
              effectiveResolution, 
              effectiveDecoration
          );
          
          const projectData: Omit<ProjectHistoryItem, 'id' | 'timestamp'> = {
              name: `Projeto ${stylePreset} ${usePro ? '(Pro)' : ''} - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
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
          
          setMobileTab('result');
          
      } catch (e: any) {
          console.error(e);
          const errorMsg = e.message || JSON.stringify(e);
          
          if (errorMsg.includes('API Key') || errorMsg.includes('API key') || errorMsg.includes('Auth')) {
               if ((window as any).aistudio?.openSelectKey) {
                   await (window as any).aistudio.openSelectKey();
                   showAlert("Chave de API configurada. Por favor, tente gerar o projeto novamente.", "Configuração", "success");
                   return;
               } else {
                   toggleModal('apiKey', true);
                   showAlert("Configure sua chave de API para continuar.", "Configuração");
                   return;
               }
          }

          if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('The caller does not have permission')) {
               if ((window as any).aistudio?.openSelectKey) {
                   await (window as any).aistudio.openSelectKey();
                   showAlert("Permissão atualizada. Por favor, tente gerar o projeto novamente.", "Acesso", "warning");
                   return;
               }
          }
          
          if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
              const retryMatch = errorMsg.match(/retry in ([0-9.]+)(s|ms)/);
              const timeMsg = retryMatch ? ` (${retryMatch[0]})` : '';
              showAlert(`Limite de uso da IA atingido (Quota). Por favor, aguarde alguns instantes${timeMsg} e tente novamente.`, "Muitos Pedidos", "warning");
          } else if (errorMsg.includes('500') || errorMsg.includes('xhr')) {
              showAlert("Erro de conexão com o servidor de IA (500). Tente reduzir o tamanho da imagem ou tente novamente em instantes.", "Erro de Rede", "error");
          } else {
              showAlert("Erro ao gerar projeto: " + (e instanceof Error ? e.message : "Erro desconhecido"), "Erro", "error");
          }
      } finally {
          setIsGenerating(false);
      }
  };

  // ... other handlers (handleGenerateFloorPlan, handleViewProject, etc) ...
  const handleGenerateFloorPlan = async () => {
      if (!isSuperAdmin) {
          showAlert("Recurso Premium exclusivo para administradores.", "Acesso Restrito", "warning");
          return;
      }
      if (!currentProject) return;
      if (!currentProject.views3d || currentProject.views3d.length === 0) return showAlert("Nenhuma imagem 3D disponível para gerar planta.", "Aviso", "warning");

      setIsGenerating(true);
      try {
          const floorPlanBase64 = await generateFloorPlanFrom3D(currentProject);
          const newImage2d = `data:image/png;base64,${floorPlanBase64}`;
          const updatedProject = await updateProjectInHistory(currentProject.id, { image2d: newImage2d });
          if (updatedProject) {
              setHistory(await getHistory());
              setCurrentProject(updatedProject);
              showAlert("Planta Baixa 2D gerada com sucesso!", "Sucesso", "success");
              toggleModal('layoutEditor', true); 
          }
      } catch (e: any) {
          console.error(e);
          showAlert("Erro ao gerar planta baixa.", "Erro", "error");
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
              await navigator.share({ title: currentProject.name, text: `Confira o projeto ${currentProject.name} criado no MarcenApp!`, url: link });
          } catch (err) {}
      } else {
          navigator.clipboard.writeText(link);
          showAlert("Link do projeto copiado para a área de transferência!", "Link Copiado", "success");
      }
  };

  const handleGetFinishSuggestions = async () => {
      if (!description.trim()) return showAlert("Descreva o projeto primeiro.", "Aviso", "warning");
      setFinishSuggestions({ isOpen: true, isLoading: true, suggestions: [] });
      try {
          const suggestions = await suggestAlternativeFinishes(description, stylePreset);
          setFinishSuggestions({ isOpen: true, isLoading: false, suggestions });
      } catch (e) {
          setFinishSuggestions({ isOpen: false, isLoading: false, suggestions: [] });
          showAlert("Erro ao obter sugestões.", "Erro", "error");
      }
  };

  const handleOpenLayoutEditor = async () => {
    if (!currentProject) return;
    if (!currentProject.image2d) {
        if (!confirm("Gerar planta baixa agora?")) return;
        handleGenerateFloorPlan();
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
          showAlert("Planta atualizada!", "Sucesso", "success");
      }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] transition-colors duration-300 pb-safe flex flex-col">
      <div className="sticky top-0 z-50 w-full">
          <Header 
            userEmail={userEmail} 
            isAdmin={isSuperAdmin}
            isPartner={isPartner}
            isCarpenter={isCarpenter}
            isStoreOwner={isStoreOwner}
            currentProject={currentProject}
            
            onOpenToolsHub={() => toggleModal('toolsHub', true)}
            onOpenResearch={() => toggleModal('research', true)}
            onOpenLive={() => toggleModal('live', true)}
            onOpenDistributors={() => toggleModal('distributors', true)}
            onOpenClients={() => toggleModal('clients', true)}
            onOpenHistory={() => toggleModal('history', true)}
            onOpenAbout={() => toggleModal('about', true)}
            onOpenBomGenerator={() => toggleModal('bom', true)}
            onOpenCuttingPlanGenerator={() => toggleModal('cutting', true)}
            onOpenCostEstimator={() => toggleModal('cost', true)}
            onOpenWhatsapp={() => showAlert("Em breve!", "Novidade")}
            onOpenAutoPurchase={() => showAlert("Em breve!", "Novidade")}
            onOpenEmployeeManagement={() => showAlert("Em breve!", "Novidade")}
            onOpenLearningHub={() => showAlert("Em breve!", "Novidade")}
            onOpenEncontraPro={() => toggleModal('encontraPro', true)}
            onOpenAR={() => toggleModal('ar', true)}
            onOpenManagement={() => toggleModal('management', true)}
            onOpenPartnerPortal={() => toggleModal('partnerPortal', true)}
            onOpenNotifications={() => toggleModal('notifications', true)}
            onOpenWallet={() => toggleModal('wallet', true)}
            onOpenProjectGenerator={() => toggleModal('projectGenerator', true)}
            onOpenStoreMode={() => toggleModal('storeMode', true)}
            onOpenSmartWorkshop={() => toggleModal('smartWorkshop', true)} 
            onOpenAdmin={() => toggleModal('admin', true)}
            onConfigureApi={() => toggleModal('apiKey', true)}
            onLogout={onLogout}
            theme={theme}
            setTheme={setTheme}
            installPrompt={installPrompt}
            onInstallClick={handleInstallApp}
          />

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex bg-[#f5f1e8] dark:bg-[#2d2424] border-b border-[#e6ddcd] dark:border-[#4a4040] shadow-sm z-40 relative">
              <button 
                onClick={() => setMobileTab('create')} 
                className={`flex-1 py-3 font-bold text-sm border-b-4 transition-colors duration-200 ${mobileTab === 'create' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e] bg-[#d4ac6e]/5' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-[#3e3535]'}`}
              >
                1. Criar
              </button>
              <button 
                onClick={() => setMobileTab('result')} 
                className={`flex-1 py-3 font-bold text-sm border-b-4 transition-colors duration-200 ${mobileTab === 'result' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e] bg-[#d4ac6e]/5' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-[#3e3535]'}`}
              >
                2. Resultado
              </button>
          </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto p-3 sm:p-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* Left Column: Inputs - SIMPLIFIED */}
            <div className={`${mobileTab === 'create' ? 'block' : 'hidden'} lg:block space-y-6 animate-fadeIn`}>
                
                <section className="bg-white dark:bg-[#3e3535] p-5 rounded-2xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040] relative">
                    {/* BACK TO MENU BUTTON */}
                    <button 
                        onClick={() => toggleModal('toolsHub', true)}
                        className="absolute top-5 right-5 text-xs font-bold text-[#8a7e7e] hover:text-[#d4ac6e] flex items-center gap-1 bg-[#f0e9dc] dark:bg-[#2d2424] px-3 py-1.5 rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="w-3 h-3" /> Voltar ao Menu
                    </button>

                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <BookIcon className="w-5 h-5"/> O que você quer criar?
                        </h2>
                    </div>
                    <div className="relative">
                        <textarea
                            ref={descriptionTextAreaRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 p-4 bg-[#f0e9dc] dark:bg-[#2d2424] border-0 rounded-xl resize-none focus:ring-2 focus:ring-[#d4ac6e] text-base mb-3"
                            placeholder="Descreva seu móvel ou ambiente... (Ex: Cozinha moderna em L com ilha central)"
                        />
                        <div className="absolute bottom-5 right-2">
                            <VoiceInputButton onTranscript={(text) => setDescription(prev => prev + ' ' + text)} showAlert={showAlert} />
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                        <button 
                            onClick={loadDemoProject}
                            className="text-xs font-bold text-[#d4ac6e] hover:text-[#c89f5e] hover:underline transition"
                        >
                            Carregar Exemplo
                        </button>
                    </div>
                    
                    {/* SMART INPUT ASSISTANT */}
                    <div className="mt-4">
                        <SmartInputAssistant 
                            currentText={description}
                            onUpdateText={setDescription}
                            onEnhance={handleEnhanceDescription}
                            isEnhancing={isEnhancingText}
                        />
                    </div>
                </section>

                <section className="bg-white dark:bg-[#3e3535] p-5 rounded-2xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5"/> Referência (Opcional)
                        </h2>
                    </div>
                    <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImageUrls={currentProject?.uploadedReferenceImageUrls || (uploadedImages && uploadedImages.length > 0 ? [`data:${uploadedImages[0].mimeType};base64,${uploadedImages[0].data}`] : null)} />
                    {uploadedImages && uploadedImages.length > 0 && (
                        <button 
                            onClick={handleDescribeImage}
                            className="mt-3 w-full text-sm flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition border border-blue-200 dark:border-blue-800"
                            disabled={isAnalyzingImage}
                        >
                            {isAnalyzingImage ? <Spinner size="sm" /> : <SparklesIcon className="w-4 h-4" />}
                            {isAnalyzingImage ? 'Analisando...' : 'Ler Imagem com IA'}
                        </button>
                    )}
                </section>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleGenerateProject(false)}
                        disabled={isGenerating || !description.trim()}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 
                        ${isGenerating || !description.trim() ? 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#8a7e7e] dark:text-[#a89d8d] cursor-not-allowed' : 'bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535]'}`}
                    >
                        {isGenerating ? <Spinner /> : <CubeIcon className="w-6 h-6"/>}
                        {isGenerating ? 'Criando...' : 'Gerar Projeto 3D'}
                    </button>
                </div>
            </div>

            {/* Right Column: Results & Refinement */}
            <div className={`${mobileTab === 'result' ? 'block' : 'hidden'} lg:block h-full flex flex-col`}>
                {currentProject ? (
                    <div className="bg-white dark:bg-[#3e3535] rounded-2xl shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] h-full flex flex-col overflow-hidden animate-fadeIn">
                        <div className="p-4 bg-[#f5f1e8] dark:bg-[#2d2424] border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{currentProject.name}</h3>
                                <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d]">{new Date(currentProject.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleShareProject} className="p-2 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#d4ac6e] transition"><ShareIcon /></button>
                                <button onClick={() => toggleModal('imageEditor', true)} className="p-2 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#d4ac6e] transition" title="Editar Imagem com IA"><WandIcon /></button>
                                <button onClick={() => toggleModal('newView', true)} className="p-2 bg-[#e6ddcd] dark:bg-[#4a4040] rounded-full text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#d4ac6e] transition" title="Gerar Nova Vista"><CubeIcon /></button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto bg-[#2d2424] custom-scrollbar relative">
                            <div className="grid grid-cols-1 gap-4 p-4">
                                {currentProject.views3d.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <InteractiveImageViewer 
                                            src={src} 
                                            alt={`Vista ${index + 1}`} 
                                            projectName={currentProject.name}
                                            onGenerateNewView={() => toggleModal('newView', true)}
                                        />
                                        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                                            Vista {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* REFINEMENT PANEL */}
                        <RefinementPanel 
                            currentStyle={stylePreset}
                            onStyleChange={setStylePreset}
                            currentFinish={selectedFinish}
                            onFinishClick={() => toggleModal('finishSelector', true)}
                            qualityMode={qualityMode}
                            onQualityChange={setQualityMode}
                            framingStrategy={framingStrategy}
                            onFramingChange={setFramingStrategy}
                            onRegenerate={() => handleGenerateProject(false)}
                            isGenerating={isGenerating}
                            framingOptions={framingOptions}
                        />

                        <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-[#fffefb] dark:bg-[#3e3535]">
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleOpenLayoutEditor} className="flex items-center justify-center gap-2 bg-[#e6ddcd] dark:bg-[#4a4040] py-3 rounded-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition text-sm">
                                    <BlueprintIcon className="w-4 h-4"/> {currentProject.image2d ? 'Ver Planta' : 'Gerar Planta'}
                                </button>
                                <button onClick={() => toggleModal('proposal', true)} className="flex items-center justify-center gap-2 bg-[#d4ac6e] py-3 rounded-lg font-bold text-[#3e3535] hover:bg-[#c89f5e] transition text-sm">
                                    <CurrencyDollarIcon className="w-4 h-4"/> Orçamento
                                </button>
                                <button onClick={() => toggleModal('decorationList', true)} className="flex items-center justify-center gap-2 bg-[#e6ddcd] dark:bg-[#4a4040] py-3 rounded-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition text-sm col-span-2">
                                    <ShoppingBagIcon className="w-4 h-4"/> Lista de Decoração
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#8a7e7e] dark:text-[#a89d8d] bg-[#fffefb] dark:bg-[#3e3535] rounded-2xl border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] p-8">
                        <CubeIcon className="w-24 h-24 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">Nenhum projeto gerado</h3>
                        <p className="text-center max-w-xs mb-6">Preencha os dados ao lado e clique em "Gerar Projeto 3D" para ver a mágica acontecer.</p>
                        <button onClick={loadDemoProject} className="text-[#d4ac6e] font-bold hover:underline text-sm">Carregar Demo</button>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* MODALS */}
      <ToolsHubModal 
        isOpen={modals.toolsHub}
        onClose={() => {
            // Prevent closing if it is initial view
        }}
        onSelectTool={handleToolSelect}
        installPrompt={installPrompt}
        onInstallClick={handleInstallApp}
      />
      <InstallPwaModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} installPrompt={installPrompt} isIOS={isIOS} />
      <UserProfileModal isOpen={modals.userProfile} onClose={() => toggleModal('userProfile', false)} userEmail={userEmail} />
      <DistributorOnboarding 
        isOpen={modals.distributorOnboarding} 
        onClose={() => toggleModal('distributorOnboarding', false)}
        onComplete={(profile) => {
            toggleModal('distributorOnboarding', false);
            toggleModal('partnerPortal', true);
            showAlert("Credenciamento realizado com sucesso! Bem-vindo à rede.", "Sucesso", "success");
        }}
      />
      
      {/* ... Other modals (FinishSelector, Research, Live, etc) ... */}
      <div className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn ${!modals.finishSelector ? 'hidden' : ''}`} onClick={() => toggleModal('finishSelector', false)}>
          <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-3xl p-6 shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4">Selecionar Acabamento</h3>
              <FinishesSelector 
                value={selectedFinish} 
                onFinishSelect={(sel) => {
                    setSelectedFinish(sel);
                    toggleModal('finishSelector', false);
                }} 
                showAlert={showAlert}
                favoriteFinishes={favoriteFinishes}
                onToggleFavorite={async (f) => {
                    if (favoriteFinishes.some(fav => fav.id === f.id)) {
                        setFavoriteFinishes(await removeFavoriteFinish(f.id));
                    } else {
                        setFavoriteFinishes(await addFavoriteFinish(f));
                    }
                }}
                onRequestSuggestions={handleGetFinishSuggestions}
              />
              <button onClick={() => toggleModal('finishSelector', false)} className="mt-4 w-full py-2 bg-[#e6ddcd] dark:bg-[#5a4f4f] text-[#3e3535] dark:text-white rounded">Cancelar</button>
          </div>
      </div>

      <ResearchAssistant isOpen={modals.research} onClose={() => toggleModal('research', false)} showAlert={showAlert} />
      <LiveAssistant isOpen={modals.live} onClose={() => toggleModal('live', false)} showAlert={showAlert} />
      <DistributorFinder isOpen={modals.distributors} onClose={() => toggleModal('distributors', false)} showAlert={showAlert} />
      <ClientPanel 
        isOpen={modals.clients} 
        onClose={() => toggleModal('clients', false)} 
        clients={clients}
        projects={history}
        onSaveClient={async (c) => setClients(await saveClient(c))}
        onDeleteClient={async (id) => setClients(await removeClient(id))}
        onViewProject={handleViewProject}
      />
      <HistoryPanel 
        isOpen={modals.history} 
        onClose={() => toggleModal('history', false)} 
        history={history} 
        onViewProject={handleViewProject}
        onAddNewView={(projectId) => {
            const project = history.find(p => p.id === projectId);
            if(project) {
                setCurrentProject(project);
                toggleModal('newView', true);
            }
        }}
        onDeleteProject={async (id) => {
            const updatedHistory = await removeProjectFromHistory(id);
            setHistory(updatedHistory);
            if (currentProject?.id === id) setCurrentProject(null);
            showAlert("Projeto excluído com sucesso.", "Exclusão", "success");
        }}
      />
      <AboutModal isOpen={modals.about} onClose={() => toggleModal('about', false)} />
      <BomGeneratorModal 
        isOpen={modals.bom} 
        onClose={() => { toggleModal('bom', false); toggleModal('toolsHub', true); }} 
        showAlert={showAlert} 
        onBack={() => { toggleModal('bom', false); toggleModal('toolsHub', true); }} 
      />
      <CuttingPlanGeneratorModal 
        isOpen={modals.cutting} 
        onClose={() => { toggleModal('cutting', false); toggleModal('toolsHub', true); }} 
        showAlert={showAlert} 
        onBack={() => { toggleModal('cutting', false); toggleModal('toolsHub', true); }} 
      />
      <CostEstimatorModal 
        isOpen={modals.cost} 
        onClose={() => { toggleModal('cost', false); toggleModal('toolsHub', true); }} 
        showAlert={showAlert} 
        onBack={() => { toggleModal('cost', false); toggleModal('toolsHub', true); }} 
      />
      <EncontraProModal isOpen={modals.encontraPro} onClose={() => toggleModal('encontraPro', false)} showAlert={showAlert} />
      <ARViewer isOpen={modals.ar} onClose={() => toggleModal('ar', false)} imageSrc={currentProject?.views3d[0] || ''} showAlert={showAlert} />
      <ApiKeyModal isOpen={modals.apiKey} onClose={() => toggleModal('apiKey', false)} showAlert={showAlert} />
      
      {currentProject && (
        <>
            <ProposalModal 
                isOpen={modals.proposal} 
                onClose={() => toggleModal('proposal', false)} 
                project={currentProject} 
                client={clients.find(c => c.id === currentProject.clientId)}
                showAlert={showAlert}
            />
            <ImageEditor 
                isOpen={modals.imageEditor} 
                imageSrc={currentProject.views3d[0]} 
                projectDescription={currentProject.description}
                onClose={() => toggleModal('imageEditor', false)} 
                onSave={async (newImageBase64) => {
                    const newViewUrl = `data:image/png;base64,${newImageBase64}`;
                    const updatedViews = [...currentProject.views3d, newViewUrl];
                    const updatedProject = await updateProjectInHistory(currentProject.id, { views3d: updatedViews });
                    setHistory(await getHistory());
                    setCurrentProject(updatedProject);
                    toggleModal('imageEditor', false);
                    showAlert("Nova versão salva na galeria do projeto!", "Sucesso", "success");
                }}
                showAlert={showAlert}
            />
            <NewViewGenerator 
                isOpen={modals.newView}
                project={currentProject}
                onClose={() => toggleModal('newView', false)}
                onSaveComplete={async () => {
                    setHistory(await getHistory());
                    const updated = (await getHistory()).find(p => p.id === currentProject.id);
                    if(updated) setCurrentProject(updated);
                    showAlert("Nova vista 3D adicionada ao projeto!", "Sucesso", "success");
                }}
                showAlert={showAlert}
            />
            {currentProject.image2d && (
                <LayoutEditor
                    isOpen={modals.layoutEditor}
                    floorPlanSrc={currentProject.image2d}
                    projectDescription={currentProject.description}
                    onClose={() => toggleModal('layoutEditor', false)}
                    onSave={handleSaveLayout}
                    showAlert={showAlert}
                />
            )}
            <DecorationListModal 
                isOpen={modals.decorationList}
                onClose={() => toggleModal('decorationList', false)}
                projectDescription={currentProject.description}
                style={currentProject.style}
                showAlert={showAlert}
            />
        </>
      )}

      <FinishSuggestionsModal 
        isOpen={finishSuggestions.isOpen} 
        isLoading={finishSuggestions.isLoading} 
        suggestions={finishSuggestions.suggestions} 
        onClose={() => setFinishSuggestions({ ...finishSuggestions, isOpen: false })} 
        onSelectFinish={(finish) => {
            setSelectedFinish({ manufacturer: finish.manufacturer, finish });
            setFinishSuggestions({ ...finishSuggestions, isOpen: false });
        }} 
      />

      <AlertNotification show={alert.show} title={alert.title} message={alert.message} type={alert.type} onClose={closeAlert} />
      
      {/* Only render admin/partner modals if user is super admin */}
      {isSuperAdmin && (
        <>
            <ManagementDashboard isOpen={modals.management} onClose={() => toggleModal('management', false)} />
            <DistributorPortal isOpen={modals.partnerPortal} onClose={() => toggleModal('partnerPortal', false)} />
            <DistributorAdmin isOpen={modals.admin} onClose={() => toggleModal('admin', false)} />
            {modals.notifications && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => toggleModal('notifications', false)}><NotificationSystem /></div>}
            {modals.wallet && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => toggleModal('wallet', false)}><div className="bg-white p-4 rounded-lg max-w-4xl w-full" onClick={e => e.stopPropagation()}><CommissionWallet /></div></div>}
            <StoreDashboard isOpen={modals.storeMode} onClose={() => toggleModal('storeMode', false)} />
            <SmartWorkshopModal isOpen={modals.smartWorkshop} onClose={() => toggleModal('smartWorkshop', false)} />
            <ArcVisionModule isOpen={modals.projectGenerator} onClose={() => toggleModal('projectGenerator', false)} showAlert={showAlert} />
        </>
      )}

    </div>
  );
};
