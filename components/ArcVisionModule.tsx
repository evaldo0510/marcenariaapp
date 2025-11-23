
import React, { useState, useRef } from 'react';
import { 
    UploadIcon, CameraIcon, BoxIcon, MaximizeIcon, RefreshIcon, WandIcon, 
    DownloadIcon, Image as ImageIcon, RulerIcon, MapPinIcon, 
    AlertIcon, LayersIcon, GridIcon, PaletteIcon, SearchIcon, 
    ZoomInIcon, HammerIcon, ClipboardListIcon, MicIcon, 
    CheckSquareIcon, StarIcon, SparklesIcon, GlobeIcon, Spinner 
} from './Shared';
import { detectEnvironments, generateArcVisionProject, generateImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';

// Coleções de Materiais
const MATERIAL_COLLECTIONS: Record<string, any> = {
  'padrao': { 
    label: 'Básico / Branco', 
    desc: 'Móveis brancos ou madeira clara padrão.',
    colors: ['Branco Tx', 'Carvalho', 'Concreto']
  },
  'duratex': { 
    label: 'Duratex (MDF)', 
    desc: 'Linha Design e Madeiras.',
    colors: ['Carvalho Hanover', 'Itapuã', 'Grafite']
  },
  'guararapes': { 
    label: 'Guararapes (MDF)', 
    desc: 'Linha Natural.',
    colors: ['Savana', 'Freijó', 'Areia']
  },
  'arauco': { 
    label: 'Arauco (MDF)', 
    desc: 'Linha Habitat.',
    colors: ['Nogueira', 'Carvalho Americano', 'Cinza']
  }
};

// Níveis de Projeto
const PROJECT_LEVELS: Record<string, any> = {
  'pratico': {
    label: 'Minimalismo Moderno',
    icon: <HammerIcon className="w-5 h-5 text-blue-500" />,
    desc: 'Estética limpa, linhas retas e montagem eficiente. Simples, mas elegante (Estilo Escandinavo/Industrial).',
    searchTerm: 'marcenaria minimalista moderna cozinha quarto planejados clean'
  },
  'arquiteto': {
    label: 'Design Alto Padrão',
    icon: <StarIcon className="w-5 h-5 text-yellow-500" />,
    desc: 'Painéis ripados, LEDs, vidros, nichos iluminados e materiais nobres. Efeito "Uau".',
    searchTerm: 'marcenaria alto padrão luxo arquitetura interiores tendências'
  }
};

interface GalleryViewerProps {
    active: boolean;
    environments: any[];
    galleryImages: Record<string, string>;
    onGenerate: (viewId: string, prompt: string) => void;
    loadingState: Record<string, boolean>;
}

// Componente Visualizador de Galeria
const GalleryViewer: React.FC<GalleryViewerProps> = ({ active, environments, galleryImages, onGenerate, loadingState }) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!active) return null;

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!environments || environments.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#8a7e7e] dark:text-[#a89d8d] bg-[#f0e9dc] dark:bg-[#2d2424] rounded-xl border-2 border-dashed border-[#e6ddcd] dark:border-[#4a4040] p-8">
        <ImageIcon className="w-20 h-20 mb-4 opacity-50" />
        <p className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8]">Aguardando Projeto...</p>
        <p className="text-sm mt-2 text-center max-w-xs">
          Tire a foto e selecione os ambientes para ver as imagens aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#f5f1e8] dark:bg-[#2d2424] rounded-xl overflow-y-auto custom-scrollbar p-4 space-y-8 relative">
      {/* Modal Fullscreen */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 animate-fadeIn">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg z-10 hover:bg-red-700 transition"
          >
            &times;
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {environments.map((env, envIdx) => (
        <div key={envIdx} className="bg-[#fffefb] dark:bg-[#3e3535] shadow-lg rounded-xl overflow-hidden border border-[#e6ddcd] dark:border-[#4a4040]">
          <div className="p-4 bg-[#f0e9dc] dark:bg-[#4a4040]/50 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-[#d4ac6e]" />
              {env.nome}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {env.vistas.map((vista: any, viewIdx: number) => {
              const viewId = `${envIdx}-${viewIdx}`;
              const image = galleryImages[viewId];
              const isLoading = loadingState[viewId];

              return (
                <div key={viewIdx} className="flex flex-col gap-3">
                  <div className="relative aspect-video bg-[#e6ddcd] dark:bg-[#2d2424] rounded-xl overflow-hidden shadow-inner border border-[#e6ddcd] dark:border-[#4a4040]">
                    {image ? (
                      <>
                        <img 
                          src={image} 
                          alt={vista.titulo} 
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullscreenImage(image)}
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                           <button
                            onClick={() => setFullscreenImage(image)}
                            className="bg-white/90 text-[#3e3535] p-2 rounded-full shadow-lg hover:bg-white font-bold backdrop-blur-sm"
                            title="Ver Grande"
                          >
                            <MaximizeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(image, `Projeto-${env.nome}.png`)}
                            className="bg-[#d4ac6e] text-[#3e3535] p-2 rounded-full shadow-lg hover:bg-[#c89f5e] font-bold"
                            title="Baixar Foto"
                          >
                            <DownloadIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                            onClick={() => onGenerate(viewId, vista.prompt_tecnico)}
                            className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
                            title="Tentar outra opção"
                          >
                            <RefreshIcon className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        {isLoading ? (
                          <div className="flex flex-col items-center">
                            <Spinner size="lg" />
                            <span className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-2">Criando Imagem...</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onGenerate(viewId, vista.prompt_tecnico)}
                            className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors group"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#fffefb] dark:bg-[#3e3535] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-[#e6ddcd] dark:border-[#4a4040]">
                              <WandIcon className="w-8 h-8 text-[#d4ac6e]" />
                            </div>
                            <span className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] bg-[#fffefb]/80 dark:bg-[#3e3535]/80 px-3 py-1 rounded-full border border-[#e6ddcd] dark:border-[#4a4040]">
                              Toque para Gerar Foto
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-center text-sm font-medium text-[#8a7e7e] dark:text-[#a89d8d] uppercase tracking-wide">{vista.titulo}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

interface ArcVisionModuleProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const ArcVisionModule: React.FC<ArcVisionModuleProps> = ({ isOpen, onClose, showAlert }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<{ data: string, mimeType: string } | null>(null);
  const [description, setDescription] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>('padrao');
  const [customMaterial, setCustomMaterial] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Estados para Fluxo
  const [step, setStep] = useState('input'); 
  const [detectedEnvs, setDetectedEnvs] = useState<string[]>([]);
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [projectLevel, setProjectLevel] = useState('pratico'); 

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [galleryImages, setGalleryImages] = useState<Record<string, string>>({}); 
  const [loadingViews, setLoadingViews] = useState<Record<string, boolean>>({}); 

  const [activeTab, setActiveTab] = useState('woodwork');

  if (!isOpen) return null;

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showAlert("Erro na câmera. Verifique se permitiu o acesso.", "Erro");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          setImage(dataUrl);
          const base64String = dataUrl.split(',')[1];
          setImageBase64({ data: base64String, mimeType: 'image/png' });
          stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const res = await fileToBase64(file);
          setImage(res.full);
          setImageBase64({ data: res.data, mimeType: res.mimeType });
      } catch (error) {
          showAlert("Erro ao processar imagem.", "Erro");
      }
    }
  };

  const openInspirationSearch = (envName: string) => {
    const levelInfo = PROJECT_LEVELS[projectLevel];
    const query = `${envName} planejada ${levelInfo.searchTerm}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    window.open(url, '_blank');
  };

  const openMaterialSearch = () => {
    if (!customMaterial) return;
    const url = `https://www.google.com/search?q=MDF+${encodeURIComponent(customMaterial)}+textura&tbm=isch`;
    window.open(url, '_blank');
  };

  const handleDetectEnvironments = async () => {
    if (!description && !imageBase64) {
      showAlert("Você precisa tirar uma foto (ou enviar uma) e falar o que quer fazer.", "Atenção");
      return;
    }

    setLoading(true);

    try {
      const envs = await detectEnvironments(imageBase64);
      setDetectedEnvs(envs || []);
      setSelectedEnvs(envs || []);
      setStep('selection');
    } catch (err) {
      console.error(err);
      showAlert("Não consegui ler a planta. Tente novamente.", "Erro");
    } finally {
      setLoading(false);
    }
  };

  const toggleEnv = (envName: string) => {
    if (selectedEnvs.includes(envName)) {
      setSelectedEnvs(selectedEnvs.filter(e => e !== envName));
    } else {
      setSelectedEnvs([...selectedEnvs, envName]);
    }
  };

  const handleGenerateProject = async () => {
    if (selectedEnvs.length === 0) {
      showAlert("Selecione pelo menos um ambiente.", "Atenção");
      return;
    }

    setLoading(true);
    setResult(null);
    setGalleryImages({}); 

    try {
      let collectionInfo;
      
      if (customMaterial) {
        collectionInfo = {
            label: customMaterial,
            desc: 'Material personalizado.',
            colors: [customMaterial] 
        };
      } else {
        collectionInfo = MATERIAL_COLLECTIONS[selectedCollection || 'padrao'];
      }

      const levelInfo = PROJECT_LEVELS[projectLevel];
      
      const parsedResult = await generateArcVisionProject(
          description, 
          selectedEnvs, 
          levelInfo, 
          collectionInfo, 
          imageBase64
      );
      
      setResult(parsedResult);
      setStep('results');
      setActiveTab('woodwork'); 

    } catch (err) {
      console.error(err);
      showAlert("Erro ao gerar o projeto final.", "Erro");
    } finally {
        setLoading(false);
    }
  };

  const generateSingleView = async (viewId: string, promptToUse: string) => {
    setLoadingViews(prev => ({ ...prev, [viewId]: true }));
    try {
      // Use generateImage from geminiService which handles 3D rendering
      const base64Image = await generateImage(promptToUse, null, undefined, true, '2K', 'rich'); // Using Pro settings for high quality
      const imageUrl = `data:image/png;base64,${base64Image}`;
      setGalleryImages(prev => ({ ...prev, [viewId]: imageUrl }));
    } catch (imgErr) {
      showAlert("Erro ao criar imagem. Tente de novo.", "Erro");
    } finally {
      setLoadingViews(prev => ({ ...prev, [viewId]: false }));
    }
  };

  const resetProcess = () => {
    setStep('input');
    setResult(null);
    setDetectedEnvs([]);
    setSelectedEnvs([]);
    setImage(null);
    setImageBase64(null);
    setDescription("");
    setCustomMaterial("");
  };

  return (
    <div className="fixed inset-0 bg-[#f5f1e8] dark:bg-[#2d2424] z-50 overflow-y-auto animate-fadeIn flex flex-col">
      {/* Header Simplificado */}
      <header className="bg-[#fffefb] dark:bg-[#3e3535] border-b border-[#e6ddcd] dark:border-[#4a4040] sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#d4ac6e] p-2 rounded-lg text-[#3e3535]">
              <HammerIcon className="w-6 h-6" />
            </div>
            <div onClick={resetProcess} className="cursor-pointer">
              <h1 className="text-xl font-black tracking-tight text-[#3e3535] dark:text-[#f5f1e8]">ArcVision</h1>
              <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] font-medium uppercase">Módulo Avançado IA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-xs text-[#8a7e7e] dark:text-[#a89d8d] bg-[#f0e9dc] dark:bg-[#4a4040] px-3 py-1 rounded-full">
                v2.0 (Gemini Pro)
             </div>
             <button onClick={onClose} className="text-[#8a7e7e] dark:text-[#a89d8d] hover:text-red-500 text-2xl font-bold">&times;</button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        
        {/* COLUNA DA ESQUERDA: INPUT & SELEÇÃO */}
        <div className={`space-y-6 ${step === 'results' ? 'hidden lg:block' : 'block'}`}>
          
          {/* ESTADO 1: INPUT (Upload/Foto) */}
          {step === 'input' && (
            <>
              <div className="bg-[#fffefb] dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] rounded-2xl p-6 shadow-sm animate-fadeIn">
                <h2 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                  <span className="bg-[#d4ac6e] text-[#3e3535] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Foto da Obra ou Planta
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={startCamera}
                    className="bg-[#f0e9dc] dark:bg-[#2d2424] hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] border-2 border-[#dcd6c8] dark:border-[#5a4f4f] hover:border-[#d4ac6e] dark:hover:border-[#d4ac6e] rounded-xl h-32 flex flex-col items-center justify-center transition-all group text-[#3e3535] dark:text-[#f5f1e8]"
                  >
                    <CameraIcon className="w-10 h-10 text-[#d4ac6e] mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">Tirar Foto Agora</span>
                  </button>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative bg-[#f0e9dc] dark:bg-[#2d2424] hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] border-2 border-[#dcd6c8] dark:border-[#5a4f4f] hover:border-[#d4ac6e] dark:hover:border-[#d4ac6e] rounded-xl h-32 flex flex-col items-center justify-center transition-all cursor-pointer text-[#3e3535] dark:text-[#f5f1e8]"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <UploadIcon className="w-8 h-8 text-[#8a7e7e] dark:text-[#a89d8d] mb-2" />
                    <span className="text-sm font-bold">Carregar Arquivo</span>
                  </div>
                </div>

                {image && (
                  <div className="mt-4 relative rounded-xl overflow-hidden border-2 border-green-500 h-48 bg-black">
                    <img src={image} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <BoxIcon className="w-3 h-3" /> Imagem OK
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#fffefb] dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] rounded-2xl p-6 shadow-sm animate-fadeIn">
                <h2 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                  <span className="bg-[#d4ac6e] text-[#3e3535] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  O que vamos fazer?
                </h2>
                <div className="mb-6">
                   <p className="text-xs font-bold text-[#8a7e7e] dark:text-[#a89d8d] uppercase mb-3">Material Preferido</p>
                   
                   {/* Presets Rápidos */}
                   <div className="flex gap-2 overflow-x-auto pb-3 mb-1 custom-scrollbar">
                    {Object.entries(MATERIAL_COLLECTIONS).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedCollection(key); setCustomMaterial(""); }}
                        className={`px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors flex-shrink-0
                          ${selectedCollection === key && !customMaterial
                            ? 'bg-[#d4ac6e] text-[#3e3535] border-[#d4ac6e] font-bold' 
                            : 'bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040]'}`}
                      >
                        {value.label}
                      </button>
                    ))}
                   </div>

                   {/* Input Personalizado */}
                   <div className="flex gap-2 items-center">
                     <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={customMaterial}
                            onChange={(e) => { setCustomMaterial(e.target.value); setSelectedCollection(null); }}
                            placeholder="Ou digite: 'MDF Louro Freijó'..."
                            className={`w-full pl-9 pr-4 py-3 rounded-lg border bg-[#f0e9dc] dark:bg-[#2d2424] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] text-[#3e3535] dark:text-[#f5f1e8]
                                ${customMaterial ? 'border-[#d4ac6e] ring-1 ring-[#d4ac6e]' : 'border-[#dcd6c8] dark:border-[#5a4f4f]'}`}
                        />
                        <SearchIcon className="w-4 h-4 text-[#8a7e7e] dark:text-[#a89d8d] absolute left-3 top-1/2 -translate-y-1/2" />
                     </div>
                     {customMaterial && (
                         <button 
                            onClick={openMaterialSearch}
                            className="bg-[#fffefb] dark:bg-[#2d2424] border border-[#d4ac6e] text-[#d4ac6e] px-3 py-2 rounded-lg hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040] flex items-center gap-2 text-xs font-bold shadow-sm transition-all"
                            title="Verificar textura no Google"
                         >
                            <GlobeIcon className="w-4 h-4" /> Ver Cor
                         </button>
                     )}
                   </div>
                   {customMaterial && <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 flex items-center gap-1"><CheckSquareIcon className="w-3 h-3" /> Usando material personalizado</p>}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Armários para todos os quartos e cozinha..."
                  className="w-full h-24 bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-xl p-4 text-[#3e3535] dark:text-[#f5f1e8] placeholder-[#8a7e7e] dark:placeholder-[#a89d8d] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] text-base resize-none mb-4"
                />
                
                <button
                  onClick={handleDetectEnvironments}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                    ${loading ? 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#8a7e7e] dark:text-[#a89d8d]' : 'bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] hover:scale-[1.02]'}`}
                >
                  {loading ? <Spinner /> : <SearchIcon className="w-6 h-6" />}
                  {loading ? 'Analisando Planta...' : 'IDENTIFICAR AMBIENTES'}
                </button>
              </div>
            </>
          )}

          {/* ESTADO 2: SELEÇÃO DE AMBIENTES & NÍVEL */}
          {step === 'selection' && (
            <div className="bg-[#fffefb] dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] rounded-2xl p-6 shadow-lg animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-[#3e3535] dark:text-[#f5f1e8]">Seleção e Estilo</h2>
                <button onClick={resetProcess} className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] hover:text-red-500 underline">Cancelar</button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-bold text-[#8a7e7e] dark:text-[#a89d8d] uppercase mb-3">1. Ambientes Encontrados</p>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {detectedEnvs.map((env, idx) => {
                    const isSelected = selectedEnvs.includes(env);
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all
                          ${isSelected 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424]'}`}
                      >
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleEnv(env)}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0
                            ${isSelected ? 'bg-green-500 border-green-500' : 'border-[#dcd6c8] dark:border-[#5a4f4f] bg-[#fffefb] dark:bg-[#3e3535]'}`}>
                            {isSelected && <CheckSquareIcon className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`font-bold ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-[#6a5f5f] dark:text-[#c7bca9]'}`}>{env}</span>
                        </div>
                        <button
                          onClick={() => openInspirationSearch(env)}
                          className="text-xs flex items-center gap-1 text-[#d4ac6e] bg-[#fffefb] dark:bg-[#3e3535] px-3 py-1.5 rounded-lg hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#4a4040] transition-colors"
                          title="Ver ideias no Google"
                        >
                          <SparklesIcon className="w-3 h-3" /> Ideias
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6 border-t border-[#e6ddcd] dark:border-[#4a4040] pt-6">
                <p className="text-sm font-bold text-[#8a7e7e] dark:text-[#a89d8d] uppercase mb-3">2. Estilo do Projeto</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(PROJECT_LEVELS).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setProjectLevel(key)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                        ${projectLevel === key
                          ? 'border-[#d4ac6e] bg-[#d4ac6e]/10'
                          : 'border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424] hover:border-[#d4ac6e] dark:hover:border-[#d4ac6e]'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {info.icon}
                        <span className={`font-bold ${projectLevel === key ? 'text-[#d4ac6e]' : 'text-[#3e3535] dark:text-[#f5f1e8]'}`}>{info.label}</span>
                      </div>
                      <p className="text-xs text-[#6a5f5f] dark:text-[#c7bca9] leading-relaxed">{info.desc}</p>
                      {projectLevel === key && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-[#d4ac6e] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateProject}
                  disabled={loading || selectedEnvs.length === 0}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all
                    ${loading || selectedEnvs.length === 0 ? 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#8a7e7e] dark:text-[#a89d8d]' : 'bg-green-600 hover:bg-green-500 text-white hover:scale-[1.02]'}`}
                >
                  {loading ? <Spinner /> : <SparklesIcon className="w-6 h-6" />}
                  {loading ? 'Criando Projeto...' : `PROJETAR AGORA`}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* COLUNA DA DIREITA: RESULTADOS */}
        <div className="flex flex-col h-full min-h-[600px]">
          
          {/* Abas Grandes */}
          {step === 'results' && (
            <div className="flex bg-[#fffefb] dark:bg-[#3e3535] p-1 rounded-xl mb-4 border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
              <button 
                onClick={() => setActiveTab('woodwork')} 
                className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors
                ${activeTab === 'woodwork' ? 'bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] shadow' : 'text-[#8a7e7e] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#2d2424]'}`}
              >
                <ClipboardListIcon className="w-5 h-5" /> Ficha de Corte
              </button>
              <button 
                onClick={() => setActiveTab('3d')} 
                className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors
                ${activeTab === '3d' ? 'bg-[#d4ac6e] text-[#3e3535] shadow' : 'text-[#8a7e7e] dark:text-[#a89d8d] hover:bg-[#f0e9dc] dark:hover:bg-[#2d2424]'}`}
              >
                <ImageIcon className="w-5 h-5" /> Ver Imagens 3D
              </button>
            </div>
          )}

          <div className="flex-1 bg-[#fffefb] dark:bg-[#3e3535] border border-[#e6ddcd] dark:border-[#4a4040] rounded-2xl overflow-hidden shadow-sm relative">
            
            {/* Estado Vazio / Instrução Inicial */}
            {step !== 'results' && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#dcd6c8] dark:text-[#4a4040] opacity-60 p-8 text-center">
                {step === 'input' ? (
                  <>
                    <LayersIcon className="w-24 h-24 mb-4" />
                    <p className="text-xl font-bold">Comece enviando a foto ao lado</p>
                  </>
                ) : (
                  <>
                    <CheckSquareIcon className="w-24 h-24 mb-4 text-green-200" />
                    <p className="text-xl font-bold text-green-300">Selecione e configure ao lado</p>
                  </>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fffefb]/90 dark:bg-[#3e3535]/90 z-20 backdrop-blur-sm">
                <Spinner size="lg" />
                <p className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mt-4">
                   {step === 'input' ? 'Lendo Planta...' : 'Criando Projeto Personalizado...'}
                </p>
              </div>
            )}

            {/* ABA 1: FICHA DE CORTE */}
            {activeTab === 'woodwork' && result && (
              <div className="p-8 h-full overflow-y-auto custom-scrollbar">
                
                {/* Cabeçalho de Impressão */}
                <div className="flex justify-between items-start mb-6 border-b-2 border-[#3e3535] dark:border-[#f5f1e8] pb-4">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h2 className="text-2xl font-black text-[#3e3535] dark:text-[#f5f1e8] uppercase tracking-tighter">Ordem de Serviço</h2>
                       {projectLevel === 'arquiteto' ? (
                         <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded uppercase">Alto Padrão</span>
                       ) : (
                         <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase">Minimalismo Moderno</span>
                       )}
                     </div>
                     <p className="text-[#6a5f5f] dark:text-[#c7bca9]">{result.resumo_simples}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={resetProcess} className="bg-[#f0e9dc] dark:bg-[#4a4040] hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] p-2 rounded-lg text-sm font-bold">
                        Novo Projeto
                      </button>
                   </div>
                </div>

                {result.ambientes?.map((env: any, idx: number) => (
                  <div key={idx} className="mb-8">
                    <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-t-lg border border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                      <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                        <BoxIcon className="w-5 h-5" /> {env.lista_corte?.movel || env.nome}
                      </h3>
                      <span className="bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] px-3 py-1 rounded font-mono text-sm font-bold">
                        {env.lista_corte?.medidas_totais}
                      </span>
                    </div>
                    
                    <div className="border-x border-b border-[#e6ddcd] dark:border-[#4a4040] rounded-b-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#fffefb] dark:bg-[#3e3535]">
                      
                      {/* Coluna Materiais */}
                      <div>
                        <h4 className="text-sm font-black text-[#8a7e7e] dark:text-[#a89d8d] uppercase mb-3 flex items-center gap-1">
                          <PaletteIcon className="w-4 h-4" /> Estrutura (MDF)
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-3 rounded border border-[#e6ddcd] dark:border-[#4a4040]">
                            <p className="text-xs font-bold text-[#8a7e7e] dark:text-[#a89d8d] uppercase">Caixaria / Interno</p>
                            <p className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8]">{env.lista_corte?.material_corpo}</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
                            <p className="text-xs font-bold text-blue-500 dark:text-blue-300 uppercase">Frentes / Externo</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{env.lista_corte?.material_frente}</p>
                          </div>
                        </div>
                      </div>

                      {/* Coluna Ferragens */}
                      <div>
                         <h4 className="text-sm font-black text-[#8a7e7e] dark:text-[#a89d8d] uppercase mb-3 flex items-center gap-1">
                          <HammerIcon className="w-4 h-4" /> Ferragens Necessárias
                        </h4>
                        <ul className="bg-[#f0e9dc] dark:bg-[#2d2424] border border-[#e6ddcd] dark:border-[#4a4040] rounded p-4 space-y-2">
                          {env.lista_corte?.lista_ferragens?.map((item: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-[#3e3535] dark:text-[#f5f1e8] font-medium border-b border-[#e6ddcd] dark:border-[#4a4040] pb-1 last:border-0 last:pb-0">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {item}
                            </li>
                          ))}
                        </ul>
                        
                        {env.lista_corte?.obs_montagem && (
                          <div className="mt-4 flex gap-2 items-start text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-100 dark:border-orange-800">
                             <AlertIcon className="w-5 h-5 shrink-0" />
                             <p className="text-sm font-bold">{env.lista_corte?.obs_montagem}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
                
                <div className="mt-8 text-center text-[#8a7e7e] dark:text-[#a89d8d] text-sm">
                  Gerado por ArcVision - Módulo MarcenApp
                </div>
              </div>
            )}

            {/* ABA 2: GALERIA (Visualização do Cliente) */}
            <div className={activeTab === '3d' ? 'block h-full' : 'hidden'}>
              <GalleryViewer 
                active={activeTab === '3d'} 
                environments={result?.ambientes} 
                galleryImages={galleryImages}
                loadingState={loadingViews}
                onGenerate={generateSingleView}
              />
            </div>
            
          </div>
        </div>
      </main>
      
      {/* Modal da Câmera */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
             <video ref={videoRef} autoPlay playsInline className="absolute w-full h-full object-cover" />
             <div className="absolute inset-0 pointer-events-none border-2 border-white/30 m-6 rounded-lg"></div>
             <p className="absolute bottom-20 bg-black/50 text-white px-4 py-1 rounded-full text-sm">Enquadre o local do móvel</p>
          </div>
          <div className="h-32 bg-neutral-900 flex items-center justify-around px-8 pb-safe">
            <button onClick={stopCamera} className="text-white text-sm font-bold py-2 px-4 rounded hover:bg-white/10">Cancelar</button>
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white border-4 border-neutral-400 shadow-lg active:scale-90 transition-transform"></button>
            <div className="w-16"></div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
