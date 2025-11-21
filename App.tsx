
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
import { AlertModal, Spinner, ImageModal, ConfirmationModal, WandIcon, BookIcon, BlueprintIcon, CurrencyDollarIcon, ToolsIcon, SparklesIcon, ShareIcon, WhatsappIcon, CopyIcon, DocumentTextIcon } from './components/Shared';
import { StyleAssistant } from './components/StyleAssistant';
import { getHistory, addProjectToHistory, removeProjectFromHistory, getClients, saveClient, removeClient, getFavoriteFinishes, addFavoriteFinish, removeFavoriteFinish, updateProjectInHistory } from './services/historyService';
import { generateText, suggestAlternativeStyles, generateImage, suggestAlternativeFinishes } from './services/geminiService';
import type { ProjectHistoryItem, Client, Finish } from './types';
import { initialStylePresets } from './services/presetService';

interface AppProps {
  onLogout: () => void;
  userEmail: string;
  userPlan: string;
}

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
                                    <p className="text-xs text-[#6a5f5f] dark:text-[#c7bca9] mt-1">{finish.manufacturer}</p>
                                    <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] mt-2 italic">{finish.description}</p>
                                </div>
                                <div className="p-2 bg-[#e6ddcd] dark:bg-[#4a4040]/50 text-center text-xs font-bold text-[#b99256] dark:text-[#d4ac6e]">
                                    Aplicar
                                </div>
                            </button>
                        ))}
                        {suggestions.length === 0 && <p className="col-span-3 text-center text-sm p-4">Nenhuma sugestão encontrada.</p>}
                    </div>
                )}
                <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-[#8a7e7e] hover:text-[#3e3535] dark:text-[#a89d8d] dark:hover:text-white border-t border-[#e6ddcd] dark:border-[#4a4040]">Fechar</button>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; done?: boolean }> = ({ icon, label, onClick, done }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${done ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-[#3e3535] border-[#e6ddcd] dark:border-[#4a4040] hover:border-[#d4ac6e]'}`}
    >
        <div className={`p-2 rounded-full mb-1 ${done ? 'text-green-600 dark:text-green-400' : 'text-[#6a5f5f] dark:text-[#c7bca9]'}`}>
            {icon}
        </div>
        <span className="text-xs font-bold text-[#3e3535] dark:text-[#f5f1e8]">{label}</span>
    </button>
);

export const App: React.FC<AppProps> = ({ onLogout, userEmail, userPlan }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [description, setDescription] = useState('');
  const [stylePreset, setStylePreset] = useState('Moderno');
  const [availableStyles, setAvailableStyles] = useState(initialStylePresets);
  const [uploadedImages, setUploadedImages] = useState<{ data: string, mimeType: string }[] | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<{ manufacturer: string; finish: Finish; handleDetails?: string } | null>(null);
  const [withLedLighting, setWithLedLighting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
  });
  
  const [styleSuggestions, setStyleSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as string[] });
  const [finishSuggestions, setFinishSuggestions] = useState({ isOpen: false, isLoading: false, suggestions: [] as Finish[] });
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  
  // Share Menu State
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  
  // Refs & Selected Items
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

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
              setShowShareMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showAlert = (message: string, title = 'Aviso') => setAlert({ show: true, title, message });
  const closeAlert = () => setAlert({ ...alert, show: false });
  const toggleModal = (key: keyof typeof modals, value: boolean) => setModals(prev => ({ ...prev, [key]: value }));

  // Handlers
  const handleGenerateProject = async () => {
      if (!description.trim()) return showAlert("Por favor, descreva seu projeto.");
      setIsGenerating(true);
      try {
          let fullPrompt = "";

          if (uploadedImages && uploadedImages.length > 0) {
              fullPrompt = `Atue como um Renderizador 3D Especialista em Marcenaria.
              Sua tarefa é transformar as imagens de referência fornecidas em uma renderização 3D fotorrealista de alta fidelidade.

              **DIRETRIZ PRINCIPAL (GEOMETRIA):**
              Siga ESTRITAMENTE a geometria, layout, divisões, portas e gavetas visíveis na imagem de referência. NÃO INVENTE elementos estruturais novos. A imagem de referência é a "planta baixa" visual que deve ser respeitada.

              **DIRETRIZ SECUNDÁRIA (ESTILO E ACABAMENTO):**
              Use a seguinte descrição APENAS para definir os materiais, cores e texturas aplicados à geometria da imagem: "${description}".`;
          } else {
              fullPrompt = `Atue como um Designer de Móveis e Renderizador 3D.
              Crie um projeto de marcenaria fotorrealista (render 3D) seguindo EXATAMENTE esta descrição: "${description}".
              O móvel deve ser o foco principal da imagem.`;
          }

          fullPrompt += `\n\n**Estilo de Design:** ${stylePreset}.`;
          
          if (selectedFinish) {
              fullPrompt += `\n**Acabamento Principal:** ${selectedFinish.finish.name} (${selectedFinish.manufacturer}).`;
              if (selectedFinish.handleDetails) fullPrompt += ` Puxadores: ${selectedFinish.handleDetails}.`;
          }
          
          if (withLedLighting) {
              fullPrompt += `\n**Iluminação:** O projeto DEVE incluir iluminação LED integrada (fitas de LED em prateleiras/nichos ou spots), criando um ambiente moderno e aconchegante.`;
          } else {
              fullPrompt += `\n**Iluminação:** O ambiente deve ser bem iluminado (estúdio ou residencial moderno), com luz natural suave, destacando os detalhes do móvel.`;
          }

          const imageBase64 = await generateImage(fullPrompt, uploadedImages);
          
          const projectData: Omit<ProjectHistoryItem, 'id' | 'timestamp'> = {
              name: `Projeto ${stylePreset} - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
              description: description,
              style: stylePreset,
              selectedFinish: selectedFinish,
              views3d: [`data:image/png;base64,${imageBase64}`],
              image2d: null,
              bom: null, 
              withLedLighting: withLedLighting
          };
          
          const updatedHistory = await addProjectToHistory(projectData);
          setHistory(updatedHistory);
          setCurrentProject(updatedHistory[0]); 
          showAlert("Projeto gerado com sucesso! Veja o resultado ao lado.", "Sucesso");
          
      } catch (e) {
          console.error(e);
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
    setWithLedLighting(!!project.withLedLighting || project.description.toLowerCase().includes('led'));
    
    // Populate images if available in history (for drafts)
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
          showAlert("Erro ao obter sugestões de acabamento.");
      }
  };

  const handleShareWhatsapp = () => {
      if (!currentProject) return;
      const text = `Confira meu projeto no MarcenApp:\n*${currentProject.name}*\n${currentProject.description}`;
      window.open(`whatsapp://send?text=${encodeURIComponent(text)}`, '_blank');
      setShowShareMenu(false);
  };

  const handleCopyImage = async () => {
      if (!currentProject?.views3d?.[0]) return;
      try {
          const res = await fetch(currentProject.views3d[0]);
          const blob = await res.blob();
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          setShareFeedback("Imagem copiada!");
          setTimeout(() => setShareFeedback(null), 2000);
          setShowShareMenu(false);
      } catch (e) {
          console.error(e);
          showAlert("Erro ao copiar imagem. Tente baixar via 'Nova Vista'.");
      }
  };
  
  const handleCopyDescription = () => {
      if (!currentProject) return;
      navigator.clipboard.writeText(`${currentProject.name}\n\n${currentProject.description}`);
      setShareFeedback("Texto copiado!");
      setTimeout(() => setShareFeedback(null), 2000);
      setShowShareMenu(false);
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] dark:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8] transition-colors duration-300">
      <Header 
        userEmail={userEmail} 
        isAdmin={userPlan === 'business'}
        onOpenResearch={() => toggleModal('research', true)}
        onOpenLive={() => toggleModal('live', true)}
        onOpenDistributors={() => toggleModal('distributors', true)}
        onOpenClients={() => toggleModal('clients', true)}
        onOpenHistory={() => toggleModal('history', true)}
        onOpenAbout={() => toggleModal('about', true)}
        onOpenBomGenerator={() => toggleModal('bom', true)}
        onOpenCuttingPlanGenerator={() => toggleModal('cutting', true)}
        onOpenCostEstimator={() => toggleModal('cost', true)}
        onOpenWhatsapp={() => showAlert("Integração WhatsApp em breve!")}
        onOpenAutoPurchase={() => showAlert("Compra automática em breve!")}
        onOpenEmployeeManagement={() => showAlert("Gestão de equipe em breve!")}
        onOpenLearningHub={() => showAlert("Hub de aprendizado em breve!")}
        onOpenEncontraPro={() => toggleModal('encontraPro', true)}
        onOpenAR={() => toggleModal('ar', true)}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="space-y-6 animate-fadeInUp">
                <section className="bg-[#fffefb] dark:bg-[#4a4040] p-6 rounded-xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]">
                    <h2 className="text-2xl font-semibold mb-4">Passo 1: Descreva seu Projeto</h2>
                    <div className="relative">
                        <textarea
                            ref={descriptionTextAreaRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 p-4 bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg resize-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition-all outline-none text-[#3e3535] dark:text-[#f5f1e8]"
                            placeholder="Ex: Rack para TV de 65 polegadas, estilo industrial com metal preto e madeira escura..."
                        />
                        <div className="absolute bottom-3 right-3">
                            <VoiceInputButton onTranscript={(text) => setDescription(prev => prev + ' ' + text)} showAlert={showAlert} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <StyleAssistant onSelect={(text) => setDescription(text)} presetId="sala" /> 
                    </div>
                    
                    <div className="mt-4">
                         <label className="block text-sm font-medium mb-2">Estilo de Design</label>
                         <div className="flex gap-2">
                             <select 
                                value={stylePreset} 
                                onChange={(e) => setStylePreset(e.target.value)}
                                className="flex-grow p-2 rounded-lg bg-[#f0e9dc] dark:bg-[#2d2424] border border-[#e6ddcd] dark:border-[#4a4040]"
                            >
                                {availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                             <button onClick={handleGetStyleSuggestions} className="p-2 bg-[#e6ddcd] dark:bg-[#5a4f4f] rounded-lg hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040]" title="Sugerir estilos">
                                <WandIcon />
                             </button>
                         </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="led-toggle"
                            checked={withLedLighting}
                            onChange={(e) => setWithLedLighting(e.target.checked)}
                            className="w-5 h-5 text-[#d4ac6e] rounded border-gray-300 focus:ring-[#d4ac6e] cursor-pointer" 
                        />
                        <label htmlFor="led-toggle" className="text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] cursor-pointer">
                            Incluir iluminação LED
                        </label>
                    </div>
                    
                    <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} initialImageUrls={currentProject?.uploadedReferenceImageUrls} />
                </section>
                
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
                
                <button 
                    onClick={handleGenerateProject}
                    disabled={isGenerating}
                    className="w-full py-4 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold text-lg rounded-xl shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Spinner /> : <WandIcon />}
                    {isGenerating ? 'Criando Projeto 3D...' : 'Gerar Projeto'}
                </button>
            </div>

            {/* Right Column: Result */}
            <div className="hidden lg:block space-y-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
                {currentProject ? (
                    <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden">
                        {/* 3D View */}
                        <div className="relative aspect-video bg-[#e6ddcd] dark:bg-[#3e3535]">
                            <img src={currentProject.views3d[0]} alt={currentProject.name} className="w-full h-full object-cover" />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button onClick={() => toggleModal('ar', true)} className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-md hover:bg-black/70 transition">Ver em RA</button>
                                <button onClick={() => toggleModal('newView', true)} className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-md hover:bg-black/70 transition">Nova Vista</button>
                            </div>
                        </div>
                        
                        {/* Project Details & Tools */}
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{currentProject.name}</h3>
                                    <p className="text-[#6a5f5f] dark:text-[#c7bca9]">{currentProject.style}</p>
                                </div>
                                <div className="flex gap-2 relative" ref={shareMenuRef}>
                                    {shareFeedback && (
                                        <div className="absolute top-full right-0 mt-2 p-2 bg-green-100 text-green-800 text-xs rounded shadow animate-fadeIn whitespace-nowrap z-20">
                                            {shareFeedback}
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setShowShareMenu(!showShareMenu)} 
                                        className="bg-[#e6ddcd] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] p-2 rounded-lg hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition"
                                        title="Compartilhar"
                                    >
                                        <ShareIcon />
                                    </button>
                                    {showShareMenu && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#fffefb] dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] rounded-lg shadow-xl p-2 z-10 flex flex-col gap-1 animate-fadeIn">
                                            <button onClick={handleShareWhatsapp} className="w-full flex items-center gap-2 text-left p-2 rounded hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50 transition text-sm text-[#3e3535] dark:text-[#f5f1e8]">
                                                <WhatsappIcon className="w-4 h-4 text-green-500" /> WhatsApp
                                            </button>
                                            <button onClick={handleCopyImage} className="w-full flex items-center gap-2 text-left p-2 rounded hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50 transition text-sm text-[#3e3535] dark:text-[#f5f1e8]">
                                                <CopyIcon /> Copiar Imagem
                                            </button>
                                            <button onClick={handleCopyDescription} className="w-full flex items-center gap-2 text-left p-2 rounded hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50 transition text-sm text-[#3e3535] dark:text-[#f5f1e8]">
                                                <DocumentTextIcon /> Copiar Texto
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={() => toggleModal('proposal', true)} className="bg-[#d4ac6e] text-[#3e3535] px-4 py-2 rounded-lg font-bold hover:bg-[#c89f5e] transition">
                                        Gerar Proposta
                                    </button>
                                </div>
                            </div>

                            {/* Tools Grid */}
                            <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-3 uppercase text-xs tracking-wider">Ferramentas de Produção</h4>
                            <div className="grid grid-cols-4 gap-2 mb-6">
                                 <ToolButton icon={<BookIcon />} label="BOM" onClick={() => toggleModal('bom', true)} done={!!currentProject.bom} />
                                 <ToolButton icon={<BlueprintIcon />} label="Corte" onClick={() => toggleModal('cutting', true)} done={!!currentProject.cuttingPlan} />
                                 <ToolButton icon={<CurrencyDollarIcon />} label="Custos" onClick={() => toggleModal('cost', true)} done={!!currentProject.materialCost} />
                                 <ToolButton icon={<ToolsIcon />} label="Montagem" onClick={() => {/* Future feature */}} done={false} />
                            </div>
                            
                            {/* Description */}
                             <div className="prose prose-sm dark:prose-invert max-w-none bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-lg">
                                <p>{currentProject.description}</p>
                                {currentProject.withLedLighting && (
                                    <p className="text-xs font-bold text-[#d4ac6e] mt-2">⚡ Iluminação LED inclusa</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#fffefb] dark:bg-[#4a4040] h-full min-h-[600px] rounded-xl shadow-sm border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col items-center justify-center text-[#8a7e7e] dark:text-[#a89d8d] p-8 text-center">
                        <div className="w-32 h-32 bg-[#f0e9dc] dark:bg-[#3e3535] rounded-full flex items-center justify-center mb-6">
                            <WandIcon />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Seu projeto aparecerá aqui</h3>
                        <p>Preencha os detalhes ao lado e clique em gerar para ver a mágica acontecer.</p>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Modals */}
      <AlertModal state={alert} onClose={closeAlert} />
      
      <StyleSuggestionsModal
        isOpen={styleSuggestions.isOpen}
        isLoading={styleSuggestions.isLoading}
        suggestions={styleSuggestions.suggestions}
        onClose={() => setStyleSuggestions({ ...styleSuggestions, isOpen: false })}
        onSelectStyle={(style) => {
            setAvailableStyles(prev => prev.includes(style) ? prev : [style, ...prev]);
            setStylePreset(style);
            setStyleSuggestions({ ...styleSuggestions, isOpen: false });
            showAlert(`Estilo "${style}" aplicado!`, "Estilo Definido");
        }}
      />

      <FinishSuggestionsModal
        isOpen={finishSuggestions.isOpen}
        isLoading={finishSuggestions.isLoading}
        suggestions={finishSuggestions.suggestions}
        onClose={() => setFinishSuggestions({ ...finishSuggestions, isOpen: false })}
        onSelectFinish={(finish) => {
            setSelectedFinish({ manufacturer: finish.manufacturer, finish, handleDetails: finish.type === 'solid' ? 'Puxador Cava' : undefined });
            setFinishSuggestions({ ...finishSuggestions, isOpen: false });
            showAlert(`Acabamento "${finish.name}" aplicado!`, "Acabamento Definido");
        }}
      />

      <ResearchAssistant isOpen={modals.research} onClose={() => toggleModal('research', false)} showAlert={showAlert} />
      <LiveAssistant isOpen={modals.live} onClose={() => toggleModal('live', false)} showAlert={showAlert} />
      <DistributorFinder isOpen={modals.distributors} onClose={() => toggleModal('distributors', false)} showAlert={showAlert} />
      <HistoryPanel 
        isOpen={modals.history} 
        onClose={() => toggleModal('history', false)} 
        history={history}
        onViewProject={handleViewProject}
        onAddNewView={(id) => { 
            const p = history.find(h => h.id === id); 
            if(p) { setCurrentProject(p); toggleModal('newView', true); }
        }}
        onDeleteProject={async (id) => {
            setHistory(await removeProjectFromHistory(id));
        }}
      />
      <ClientPanel 
        isOpen={modals.clients} 
        onClose={() => toggleModal('clients', false)} 
        clients={clients}
        projects={history}
        onSaveClient={async (c) => setClients(await saveClient(c))}
        onDeleteClient={async (id) => setClients(await removeClient(id))}
        onViewProject={(p) => { setCurrentProject(p); toggleModal('clients', false); toggleModal('proposal', true); }}
      />
      <AboutModal isOpen={modals.about} onClose={() => toggleModal('about', false)} />
      <BomGeneratorModal isOpen={modals.bom} onClose={() => toggleModal('bom', false)} showAlert={showAlert} />
      <CuttingPlanGeneratorModal isOpen={modals.cutting} onClose={() => toggleModal('cutting', false)} showAlert={showAlert} />
      <CostEstimatorModal isOpen={modals.cost} onClose={() => toggleModal('cost', false)} showAlert={showAlert} />
      <EncontraProModal isOpen={modals.encontraPro} onClose={() => toggleModal('encontraPro', false)} showAlert={showAlert} />
      <ARViewer isOpen={modals.ar} onClose={() => toggleModal('ar', false)} imageSrc={currentProject?.views3d[0] || ''} showAlert={showAlert} />
      
      {currentProject && (
        <>
            <ProposalModal 
                isOpen={modals.proposal} 
                onClose={() => toggleModal('proposal', false)} 
                project={currentProject} 
                client={clients.find(c => c.id === currentProject.clientId)}
                showAlert={showAlert}
            />
            <NewViewGenerator 
                isOpen={modals.newView} 
                project={currentProject} 
                onClose={() => toggleModal('newView', false)} 
                onSaveComplete={async () => setHistory(await getHistory())} 
                showAlert={showAlert} 
            />
        </>
      )}

    </div>
  );
};
