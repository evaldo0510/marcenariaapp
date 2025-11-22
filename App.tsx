
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
import { DistributorAdmin } from './components/DistributorAdmin'; // Import Admin component
import { NotificationSystem } from './components/NotificationSystem'; 
import { CommissionWallet } from './components/CommissionWallet'; 
import { ImageProjectGenerator } from './components/ImageProjectGenerator';
import { StoreDashboard } from './components/StoreDashboard';
import { InteractiveImageViewer } from './components/InteractiveImageViewer';
import { AlertModal, Spinner, WandIcon, BookIcon, BlueprintIcon, CurrencyDollarIcon, SparklesIcon, RulerIcon, CubeIcon, VideoCameraIcon, HighQualityIcon } from './components/Shared';
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

// ... (StyleSuggestionsModal, FinishSuggestionsModal, ToolButton, framingOptions)
// Keeping these definitions to ensure file integrity, same as previous version.
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
        className={`flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm transition-all ${done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-[#3e3535] border-[#e6ddcd] dark:border-[#4a4040] hover:border-[#d4ac6e] hover:shadow-md'}`}
    >
        <div className={`p-2 rounded-full mb-1 ${done ? 'text-green-600 dark:text-green-400' : 'text-[#6a5f5f] dark:text-[#c7bca9]'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold text-[#3e3535] dark:text-[#f5f1e8]">{label}</span>
    </button>
);

const framingOptions = [
    { label: 'Padrão (Sem Cortes)', value: 'OTIMIZAÇÃO PARA CELULAR/TABLET: Renderize o objeto centralizado com um "Zoom Out" estratégico. Deixe margens de segurança (padding) de pelo menos 15% em todas as laterais para garantir que nada seja cortado em telas verticais ou horizontais. O móvel deve estar flutuando no centro, totalmente visível do topo à base.' },
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
  const effectivePlan = isSuperAdmin ? 'business' : userPlan;
  const isPartner = userPlan === 'partner' || isSuperAdmin;
  const isCarpenter = userPlan !== 'partner' || isSuperAdmin;

  const [description, setDescription] = useState('');
  const [stylePreset, setStylePreset] = useState('Moderno');
  const [framingStrategy, setFramingStrategy] = useState(framingOptions[0].value);
  const [availableStyles, setAvailableStyles] = useState(initialStylePresets);
  const [uploadedImages, setUploadedImages] = useState<{ data: string, mimeType: string }[] | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string } | null>(null);
  const [withLedLighting, setWithLedLighting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [qualityMode, setQualityMode] = useState<'standard' | 'pro'>('standard');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');

  const [mobileTab, setMobileTab] = useState<'create' | 'result'>('create');

  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [favoriteFinishes, setFavoriteFinishes] = useState<Finish[]>([]);

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
      wallet: false,
      notifications: false,
      projectGenerator: false,
      storeMode: false
  });
  
  const [styleSuggestions, setStyleSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as string[] });
  const [finishSuggestions, setFinishSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as Finish[] });
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  
  const descriptionTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);

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
      
      showAlert("Exemplo carregado! A planta baixa foi anexada. Ao clicar em 'GERAR PROJETO 3D', a IA analisará o desenho (medidas, portas, janelas) e criará o ambiente 3D sobre ele.", "Demo com Análise de Visão");
  };

  // Handlers (generate, view, suggestions etc. same as before)
  const handleGenerateProject = async () => {
      if (!description.trim()) return showAlert("Por favor, descreva seu projeto.", "Falta Descrição");
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

          const usePro = qualityMode === 'pro';
          const imageBase64 = await generateImage(fullPrompt, uploadedImages, framingStrategy, usePro, imageResolution);
          
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
          setMobileTab('result');
          
      } catch (e: any) {
          console.error(e);
          const errorMsg = e.message || JSON.stringify(e);
          if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED')) {
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
        isPartner={isPartner}
        isCarpenter={isCarpenter}
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
          <button onClick={() => setMobileTab('create')} className={`flex-1 py-3 font-bold text-sm border-b-2 ${mobileTab === 'create' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e]' : 'border-transparent text-gray-500'}`}>1. Criar Projeto</button>
          <button onClick={() => setMobileTab('result')} className={`flex-1 py-3 font-bold text-sm border-b-2 ${mobileTab === 'result' ? 'border-[#d4ac6e] text-[#b99256] dark:text-[#d4ac6e]' : 'border-transparent text-gray-500'}`}>2. Resultado 3D</button>
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
                        <button onClick={loadDemoProject} className="text-xs font-bold text-[#d4ac6e] hover:text-[#c89f5e] bg-[#f0e9dc] dark:bg-[#4a4040] px-3 py-1 rounded-full transition">Exemplo c/ Planta</button>
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
                        <button onClick={handleGetStyleSuggestions} className="p-2 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] text-[#d4ac6e] transition" title="Sugira estilos de projeto">
                            <WandIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] block mb-1">Estilo Visual</label>
                            <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)} className="w-full p-3 rounded-xl bg-[#f0e9dc] dark:bg-[#2d2424] border-transparent focus:ring-2 focus:ring-[#d4ac6e] font-medium">
                                {availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] flex items-center gap-1 mb-1">
                                <VideoCameraIcon className="w-3 h-3" /> Enquadramento
                            </label>
                            <select value={framingStrategy} onChange={(e) => setFramingStrategy(e.target.value)} className="w-full p-3 rounded-xl bg-[#f0e9dc] dark:bg-[#2d2424] border-transparent focus:ring-2 focus:ring-[#d4ac6e] font-medium text-sm">
                                {framingOptions.map(option => (<option key={option.label} value={option.value}>{option.label}</option>))}
                            </select>
                            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 px-1">✅ O modo padrão centraliza o objeto e aplica margens para evitar cortes.</p>
                        </div>
                    </div>

                    <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImageUrls={currentProject?.uploadedReferenceImageUrls || (uploadedImages && uploadedImages.length > 0 ? [`data:${uploadedImages[0].mimeType};base64,${uploadedImages[0].data}`] : null)} />
                </section>
                
                {/* Qualidade & Acabamentos */}
                <section className="bg-white dark:bg-[#3e3535] p-5 rounded-2xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                            <HighQualityIcon className="w-5 h-5"/> Qualidade & Detalhes
                        </h2>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] block mb-1">Motor de Renderização</label>
                            <div className="flex bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg p-1">
                                <button onClick={() => setQualityMode('standard')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${qualityMode === 'standard' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Rápido (Flash)</button>
                                <button onClick={() => setQualityMode('pro')} className={`flex-1 py-2 text-xs font-bold rounded-md transition flex items-center justify-center gap-1 ${qualityMode === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow' : 'text-gray-500'}`}>Pro (Realista)</button>
                            </div>
                        </div>
                        {qualityMode === 'pro' && (
                            <div className="flex-1 animate-fadeIn">
                                <label className="text-xs text-xs text-[#8a7e7e] dark:text-[#a89d8d] block mb-1">Resolução</label>
                                <select value={imageResolution} onChange={(e) => setImageResolution(e.target.value as '1K' | '2K' | '4K')} className="w-full p-2 rounded-lg bg-[#f0e9dc] dark:bg-[#2d2424] border-transparent focus:ring-2 focus:ring-[#d4ac6e] font-bold text-sm">
                                    <option value="1K">1K (HD)</option>
                                    <option value="2K">2K (Full HD)</option>
                                    <option value="4K">4K (Ultra HD)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <FinishesSelector 
                        value={selectedFinish} 
                        onFinishSelect={setSelectedFinish} 
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
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#4a4040] flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={withLedLighting} onChange={(e) => setWithLedLighting(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4ac6e]"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar LEDs</span>
                        </label>
                    </div>
                </section>
                
                <button 
                    onClick={handleGenerateProject}
                    disabled={isGenerating}
                    className={`w-full py-4 font-extrabold text-lg rounded-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group relative ${qualityMode === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90' : 'bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535]'}`}
                >
                    {isGenerating ? <Spinner /> : <WandIcon className="w-6 h-6" />}
                    {isGenerating ? 'Criando Projeto...' : qualityMode === 'pro' ? `GERAR PROJETO PRO (${imageResolution})` : 'GERAR PROJETO 3D'}
                    
                    {!isGenerating && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl z-10">
                            A ação pode levar alguns segundos
                            <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                        </span>
                    )}
                </button>
                
                {/* Mobile Spacer */}
                <div className="h-20 lg:hidden"></div>
            </div>

            {/* Right Column: Result */}
            <div className={`${mobileTab === 'result' ? 'block' : 'hidden'} lg:block space-y-6 animate-fadeIn`}>
                {currentProject ? (
                    <div className="bg-white dark:bg-[#3e3535] rounded-2xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden sticky top-24">
                        {/* 3D View - Optimised Container */}
                        <div className="relative w-full h-[60vh] lg:h-auto lg:aspect-video bg-neutral-900">
                            <InteractiveImageViewer 
                                src={currentProject.views3d[0]} 
                                alt={currentProject.name} 
                                projectName={currentProject.name}
                                className="w-full h-full bg-neutral-900 relative overflow-hidden touch-none rounded-t-2xl"
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold pointer-events-none z-20">
                                {currentProject.style}
                            </div>
                            <div className="absolute bottom-4 left-4 flex gap-2 z-20">
                                <button onClick={() => toggleModal('ar', true)} className="bg-white/90 text-[#3e3535] p-3 rounded-full shadow-lg hover:bg-white transition" title="Realidade Aumentada"><CubeIcon className="w-6 h-6" /></button>
                                <button onClick={() => toggleModal('newView', true)} className="bg-[#d4ac6e] text-[#3e3535] p-3 rounded-full shadow-lg hover:bg-[#c89f5e] transition" title="Nova Vista"><WandIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                        
                        {/* Project Tools */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] line-clamp-1">{currentProject.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(currentProject.timestamp).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => toggleModal('proposal', true)} className="text-[#d4ac6e] font-bold text-sm underline">
                                    Ver Proposta
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-6 overflow-x-auto pb-2">
                                 <ToolButton icon={<BookIcon />} label="Lista" onClick={() => toggleModal('bom', true)} done={!!currentProject.bom} />
                                 <ToolButton icon={<BlueprintIcon />} label="Corte" onClick={() => toggleModal('cutting', true)} done={!!currentProject.cuttingPlan} />
                                 <ToolButton icon={<CurrencyDollarIcon />} label="Custo" onClick={() => toggleModal('cost', true)} done={!!currentProject.materialCost} />
                                 <ToolButton icon={<RulerIcon />} label="Planta" onClick={handleOpenLayoutEditor} done={!!currentProject.image2d} />
                            </div>
                            
                             <div className="bg-[#f9f5eb] dark:bg-[#2d2424] p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                                <p className="font-bold mb-1 text-[#b99256]">Descrição:</p>
                                {currentProject.description}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#3e3535] h-[500px] rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-[#2d2424] rounded-full flex items-center justify-center mb-4">
                            <CubeIcon className="w-10 h-10 opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Visualize seu projeto aqui</h3>
                        <p className="text-sm max-w-xs">Preencha os detalhes na aba "Criar Projeto" e a mágica acontecerá nesta tela.</p>
                        <button onClick={() => setMobileTab('create')} className="mt-6 lg:hidden text-[#d4ac6e] font-bold underline">Ir para Criação</button>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Modals */}
      <AlertModal state={alert} onClose={closeAlert} />
      <StyleSuggestionsModal isOpen={styleSuggestions.isOpen} isLoading={styleSuggestions.isLoading} suggestions={styleSuggestions.suggestions} onClose={() => setStyleSuggestions({ ...styleSuggestions, isOpen: false })} onSelectStyle={(style) => { setAvailableStyles(prev => prev.includes(style) ? prev : [style, ...prev]); setStylePreset(style); setStyleSuggestions({ ...styleSuggestions, isOpen: false }); showAlert(`Estilo "${style}" aplicado!`, "Estilo Definido"); }} />
      <FinishSuggestionsModal isOpen={finishSuggestions.isOpen} isLoading={finishSuggestions.isLoading} suggestions={finishSuggestions.suggestions} onClose={() => setFinishSuggestions({ ...finishSuggestions, isOpen: false })} onSelectFinish={(finish) => { setSelectedFinish({ manufacturer: finish.manufacturer, finish, handleDetails: finish.type === 'solid' ? 'Puxador Cava' : undefined }); setFinishSuggestions({ ...finishSuggestions, isOpen: false }); showAlert(`Acabamento "${finish.name}" aplicado!`, "Acabamento Definido"); }} />
      <ResearchAssistant isOpen={modals.research} onClose={() => toggleModal('research', false)} showAlert={showAlert} />
      <LiveAssistant isOpen={modals.live} onClose={() => toggleModal('live', false)} showAlert={showAlert} />
      <DistributorFinder isOpen={modals.distributors} onClose={() => toggleModal('distributors', false)} showAlert={showAlert} />
      <HistoryPanel isOpen={modals.history} onClose={() => toggleModal('history', false)} history={history} onViewProject={handleViewProject} onAddNewView={(id) => { const p = history.find(h => h.id === id); if(p) { setCurrentProject(p); toggleModal('newView', true); }}} onDeleteProject={async (id) => { setHistory(await removeProjectFromHistory(id)); }} />
      <ClientPanel isOpen={modals.clients} onClose={() => toggleModal('clients', false)} clients={clients} projects={history} onSaveClient={async (c) => setClients(await saveClient(c))} onDeleteClient={async (id) => setClients(await removeClient(id))} onViewProject={(p) => { setCurrentProject(p); toggleModal('clients', false); toggleModal('proposal', true); }} />
      <AboutModal isOpen={modals.about} onClose={() => toggleModal('about', false)} />
      <BomGeneratorModal isOpen={modals.bom} onClose={() => toggleModal('bom', false)} showAlert={showAlert} />
      <CuttingPlanGeneratorModal isOpen={modals.cutting} onClose={() => toggleModal('cutting', false)} showAlert={showAlert} />
      <CostEstimatorModal isOpen={modals.cost} onClose={() => toggleModal('cost', false)} showAlert={showAlert} />
      <EncontraProModal isOpen={modals.encontraPro} onClose={() => toggleModal('encontraPro', false)} showAlert={showAlert} />
      <ARViewer isOpen={modals.ar} onClose={() => toggleModal('ar', false)} imageSrc={currentProject?.views3d[0] || ''} showAlert={showAlert} />
      <ManagementDashboard isOpen={modals.management} onClose={() => toggleModal('management', false)} />
      <StoreDashboard isOpen={modals.storeMode} onClose={() => toggleModal('storeMode', false)} /> 
      <ImageProjectGenerator isOpen={modals.projectGenerator} onClose={() => toggleModal('projectGenerator', false)} showAlert={showAlert} />
      
      {/* Conditionally render Distributor Portal or Admin based on User Role */}
      {isSuperAdmin ? (
          // Reuse DistributorPortal modal container but render Admin Content inside for Super Admin convenience
          // Or ideally have separate modals. Here we hijack the portal modal for admin if user is super admin
          modals.partnerPortal && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={() => toggleModal('partnerPortal', false)}>
                <div className="w-full h-full bg-[#f5f1e8] dark:bg-[#2d2424] rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 bg-white dark:bg-[#3e3535] border-b border-gray-200 dark:border-[#4a4040]">
                        <h2 className="text-xl font-bold text-[#b99256]">Administração de Parceiros (Super Admin)</h2>
                        <button onClick={() => toggleModal('partnerPortal', false)} className="text-gray-500 text-2xl">&times;</button>
                    </div>
                    <div className="h-[calc(100%-60px)] overflow-hidden">
                        <DistributorAdmin />
                    </div>
                </div>
            </div>
          )
      ) : (
          <DistributorPortal isOpen={modals.partnerPortal} onClose={() => toggleModal('partnerPortal', false)} />
      )}

      {currentProject && <ImageEditor isOpen={modals.imageEditor} imageSrc={currentProject.views3d[0]} projectDescription={currentProject.description} onClose={() => toggleModal('imageEditor', false)} onSave={async (newImage) => { const newViewUrl = `data:image/png;base64,${newImage}`; const updatedViews = [...currentProject.views3d, newViewUrl]; await updateProjectInHistory(currentProject.id, { views3d: updatedViews }); setHistory(await getHistory()); toggleModal('imageEditor', false); showAlert("Edição salva como nova vista!"); }} showAlert={showAlert} />}
      
      {modals.notifications && (<div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={() => toggleModal('notifications', false)}><div onClick={e => e.stopPropagation()}><NotificationSystem /></div></div>)}
      {modals.wallet && (<div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={() => toggleModal('wallet', false)}><div className="w-full max-w-4xl bg-[#f5f1e8] dark:bg-[#2d2424] p-6 rounded-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold dark:text-white">Minha Carteira</h2><button onClick={() => toggleModal('wallet', false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button></div><CommissionWallet /></div></div>)}

      {currentProject && (
        <>
            <ProposalModal isOpen={modals.proposal} onClose={() => toggleModal('proposal', false)} project={currentProject} client={clients.find(c => c.id === currentProject.clientId)} showAlert={showAlert} />
            <NewViewGenerator isOpen={modals.newView} project={currentProject} onClose={() => toggleModal('newView', false)} onSaveComplete={async () => setHistory(await getHistory())} showAlert={showAlert} />
            <LayoutEditor isOpen={modals.layoutEditor} floorPlanSrc={currentProject.image2d || ''} projectDescription={currentProject.description} onClose={() => toggleModal('layoutEditor', false)} onSave={handleSaveLayout} showAlert={showAlert} />
        </>
      )}
    </div>
  );
};
