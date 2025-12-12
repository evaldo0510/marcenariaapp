
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  MaximizeIcon, 
  TrashIcon, 
  DownloadIcon, 
  SaveIcon, 
  GridIcon, 
  LayersIcon, 
  BoxIcon, 
  ToolsIcon,
  WandIcon,
  CameraIcon,
  ImageIcon,
  SunIcon,
  MoonIcon,
  XIcon,
  CheckIcon,
  Spinner,
  DocumentTextIcon,
  DatabaseIcon,
  ArrowRightIcon,
  RefreshIcon,
  RulerIcon,
  ScanIcon,
  LayoutIcon, // Icone para Elevação
  CreditCardIcon // Icone para Gaveta (similar visualmente)
} from './Shared';
import { generateImage } from '../services/geminiService';

// --- Tipos ---

type MaterialType = 'MDF Branco' | 'MDF Amadeirado' | 'Compensado' | 'Vidro' | 'Espelho';
type EditorMode = 'plan' | 'elevation'; // Planta (Topo) ou Elevação (Frente)
type ItemType = 'armario_baixo' | 'armario_alto' | 'roupeiro' | 'mesa' | 'porta_giro' | 'gaveta' | 'prateleira' | 'painel';

interface FurnitureItem {
  id: string;
  type: ItemType;
  name: string;
  x: number;
  y: number; // Em Plan: Y do canvas. Em Elevation: Y é a altura do chão.
  width: number;
  depth: number; // Relevante em Plan
  height: number; // Relevante em Elevation
  rotation: number;
  material: MaterialType;
  color: string;
}

interface Smart2DEditorProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (msg: string, title?: string) => void;
    initialBackgroundImage?: string | null;
    initialMode?: EditorMode; // Novo: Modo inicial sugerido
}

export const Smart2DEditor: React.FC<Smart2DEditorProps> = ({ isOpen, onClose, showAlert, initialBackgroundImage, initialMode = 'plan' }) => {
  // Estado
  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode);
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'editor' | 'cutlist' | 'render'>('editor');
  
  // Estado de Fundo (AR Tracing)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [showBackground, setShowBackground] = useState(!!initialBackgroundImage);
  
  // Estado de Render IA
  const [isRendering, setIsRendering] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [renderStyle, setRenderStyle] = useState('Fotorrealista');
  
  // Referência do Canvas
  const canvasRef = useRef<HTMLDivElement>(null);

  const PRICES: Record<string, number> = {
    'MDF Branco': 120.00, 
    'MDF Amadeirado': 180.00,
    'Compensado': 150.00,
    'Vidro': 250.00,
    'Espelho': 220.00
  };

  useEffect(() => {
      if(initialBackgroundImage) setShowBackground(true);
      if(initialMode) setEditorMode(initialMode);
  }, [initialBackgroundImage, initialMode]);

  if (!isOpen) return null;

  // --- Funções de Manipulação ---

  const addItem = (type: ItemType) => {
    const isElevation = editorMode === 'elevation';
    
    let defaultW = 60;
    let defaultH = 70;
    let defaultD = 55;
    let name = 'Módulo';

    if (type === 'gaveta') { defaultW = 50; defaultH = 20; name = 'Gaveta'; }
    if (type === 'porta_giro') { defaultW = 40; defaultH = 200; name = 'Porta Giro'; }
    if (type === 'prateleira') { defaultW = 80; defaultH = 2.5; name = 'Prateleira'; }
    if (type === 'painel') { defaultW = 200; defaultH = 250; defaultD = 1.8; name = 'Painel Fundo'; }

    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      type,
      name,
      x: 100 + (items.length * 10),
      y: 100 + (items.length * 10), // Posição inicial no canvas
      width: defaultW,
      depth: defaultD,
      height: defaultH,
      rotation: 0,
      material: 'MDF Branco',
      color: '#e2e8f0'
    };
    setItems([...items, newItem]);
    setSelectedId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<FurnitureItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    setSelectedId(null);
  };

  // --- Funções de Renderização IA ---
  const handleGenerateRender = async () => {
    if (items.length === 0) {
        showAlert("Adicione móveis ou componentes ao projeto antes de renderizar.", "Projeto Vazio");
        return;
    }

    setIsRendering(true);
    setGeneratedImage(null);

    try {
        let prompt = `Renderize uma imagem fotorrealista de alta qualidade (8k, v-ray style). \n`;
        
        if (editorMode === 'elevation') {
            prompt += `VISTA FRONTAL (ELEVAÇÃO): O móvel é composto por:\n`;
        } else {
            prompt += `VISTA SUPERIOR (PLANTA) convertida para perspectiva isométrica:\n`;
        }
        
        items.forEach((item, index) => {
            prompt += `${index + 1}. ${item.name} (${item.material}) - Largura: ${item.width}cm, ${editorMode === 'elevation' ? `Altura: ${item.height}cm` : `Profundidade: ${item.depth}cm`}, Posição X: ${item.x}, Y: ${item.y}.\n`;
        });

        if (initialBackgroundImage) {
            prompt += `\nCONTEXTO REAL (IMPORTANTÍSSIMO): Use a imagem de fundo como GUIA ESTRITO de geometria e perspectiva. O móvel desenhado deve substituir ou complementar o que está no rascunho/foto, mantendo o mesmo ângulo.`;
        }

        prompt += `\nESTILO E ACABAMENTO: Estilo ${renderStyle}. Iluminação de estúdio suave. Texturas realistas de madeira e laca.`;

        const referenceImages = initialBackgroundImage ? [{ 
            data: initialBackgroundImage.split(',')[1], 
            mimeType: initialBackgroundImage.match(/data:(.*);/)?.[1] || 'image/png' 
        }] : null;

        const imageBase64 = await generateImage(prompt, referenceImages, undefined, true, '2K', 'rich');
        setGeneratedImage(`data:image/png;base64,${imageBase64}`);
        
    } catch (error) {
        console.error(error);
        showAlert("Erro ao gerar renderização. Tente novamente.", "Erro IA");
    } finally {
        setIsRendering(false);
    }
  };

  // --- Handlers de Drag & Drop ---

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
    
    const item = items.find(i => i.id === id);
    if (item && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;
      setDragOffset({ x: mouseX - item.x, y: mouseY - item.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;
      
      // Snap to grid 5px for finer control in elevation
      const snap = (val: number) => Math.round(val / 5) * 5; 
      
      updateItem(selectedId, {
        x: snap(mouseX - dragOffset.x),
        y: snap(mouseY - dragOffset.y)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Renderização dos Itens no Canvas ---
  const renderItemVisual = (item: FurnitureItem) => {
      const isSelected = selectedId === item.id;
      
      // Estilos base
      const style: React.CSSProperties = {
          position: 'absolute',
          left: item.x * zoom,
          top: item.y * zoom,
          width: item.width * zoom,
          // Em Plan, altura visual = depth. Em Elevation, altura visual = height.
          height: (editorMode === 'plan' ? item.depth : item.height) * zoom,
          backgroundColor: isSelected ? 'rgba(219, 234, 254, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isSelected ? '#2563eb' : '#94a3b8',
          borderWidth: '2px',
          borderStyle: 'solid',
          transform: `rotate(${item.rotation}deg)`,
          zIndex: isSelected ? 10 : 1,
          cursor: isDragging && isSelected ? 'grabbing' : 'grab',
          boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
      };

      // Visuais específicos por tipo (Principalmente para Elevação)
      if (editorMode === 'elevation') {
          if (item.type === 'porta_giro') {
              return (
                  <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} style={style} className="flex flex-col items-center justify-center">
                      <div className="absolute left-1 top-1/2 w-1 h-8 bg-gray-400 rounded-full"></div> {/* Puxador */}
                      <div className="w-full h-full border-r border-b border-gray-300 opacity-50 pointer-events-none"></div>
                      <span className="text-[8px] font-bold text-gray-500 pointer-events-none bg-white/50 px-1 rounded">{item.width}x{item.height}</span>
                  </div>
              );
          }
          if (item.type === 'gaveta') {
              return (
                  <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} style={style} className="flex flex-col items-center justify-center">
                      <div className="w-1/2 h-1 bg-gray-400 rounded-full mb-1"></div> {/* Puxador */}
                      <span className="text-[8px] text-gray-400 pointer-events-none">Gaveta</span>
                  </div>
              );
          }
          if (item.type === 'prateleira') {
              return (
                  <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} style={{...style, backgroundColor: '#cbd5e1', borderColor: '#64748b'}} className="flex items-center justify-center">
                  </div>
              );
          }
      }

      // Default Box (Módulos ou Planta)
      return (
          <div key={item.id} onMouseDown={(e) => handleMouseDown(e, item.id)} style={style} className="group flex flex-col items-center justify-center">
              <div className="text-[10px] text-gray-600 font-bold pointer-events-none text-center leading-tight px-1">
                  {item.name}
                  <div className="text-[8px] opacity-70">
                      {item.width}x{editorMode === 'plan' ? item.depth : item.height}
                  </div>
              </div>
              {editorMode === 'plan' && <div className="absolute bottom-0 w-full h-1 bg-gray-400 group-hover:bg-blue-400"></div>}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-[#2d2424] z-[60] flex flex-col animate-fadeIn" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      
      {/* Header */}
      <header className="h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-[#e6ddcd] dark:border-[#4a4040] flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#d4ac6e] p-2 rounded-lg text-[#3e3535]">
             <GridIcon className="w-5 h-5" />
          </div>
          <div>
             <h1 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8]">Studio 2D de Precisão</h1>
             <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                 Modo: <span className="font-bold uppercase text-[#d4ac6e]">{editorMode === 'plan' ? 'Planta Baixa' : 'Elevação (Frente)'}</span>
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-[#2d2424] p-1 rounded-lg flex gap-1">
                <button 
                    onClick={() => setEditorMode('plan')} 
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${editorMode === 'plan' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}
                >
                    <GridIcon className="w-3 h-3" /> Planta
                </button>
                <button 
                    onClick={() => setEditorMode('elevation')} 
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${editorMode === 'elevation' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}
                >
                    <LayoutIcon className="w-3 h-3" /> Frente/Vista
                </button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            <div className="flex bg-gray-100 dark:bg-[#2d2424] p-1 rounded-lg">
                <button onClick={() => setViewMode('editor')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'editor' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Editor</button>
                <button onClick={() => setViewMode('render')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'render' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Render 3D</button>
            </div>
            
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition ml-2">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Esquerda (Catálogo Adaptável) */}
        <aside className="w-72 bg-[#fffefb] dark:bg-[#3e3535] border-r border-[#e6ddcd] dark:border-[#4a4040] flex flex-col z-10">
          {viewMode === 'render' ? (
             <div className="flex flex-col h-full p-6">
                <h3 className="font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2"><WandIcon className="w-5 h-5"/> Estúdio IA</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Transforme seu desenho técnico em uma imagem realista usando Inteligência Artificial.</p>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Estilo de Render</label>
                        <select 
                            value={renderStyle} 
                            onChange={(e) => setRenderStyle(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] text-sm"
                        >
                            <option value="Fotorrealista">Fotorrealista (Padrão)</option>
                            <option value="Sketch Arquitetônico">Sketch Arquitetônico</option>
                            <option value="Marcenaria Técnica">Desenho Técnico</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleGenerateRender} 
                    disabled={isRendering}
                    className="w-full py-4 bg-[#d4ac6e] text-[#3e3535] font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#c89f5e] transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isRendering ? <Spinner size="sm" /> : <CameraIcon className="w-5 h-5" />}
                    {isRendering ? 'Renderizando...' : 'Gerar Imagem Realista'}
                </button>
             </div>
          ) : (
             <div className="flex flex-col h-full">
                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                    <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">
                        {editorMode === 'plan' ? 'Módulos (Planta)' : 'Componentes (Frente)'}
                    </h3>
                    <p className="text-xs text-gray-500">Arraste ou clique para adicionar</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {editorMode === 'plan' ? (
                        // Itens de Planta
                        [
                            { id: 'armario_baixo', label: 'Balcão Inferior', icon: BoxIcon },
                            { id: 'armario_alto', label: 'Armário Aéreo', icon: LayersIcon },
                            { id: 'roupeiro', label: 'Roupeiro', icon: MaximizeIcon },
                            { id: 'mesa', label: 'Mesa / Bancada', icon: GridIcon }
                        ].map((mod: any) => (
                            <button 
                                key={mod.id}
                                onClick={() => addItem(mod.id)}
                                className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e] bg-white dark:bg-[#2d2424] transition group text-left"
                            >
                                <div className="bg-gray-100 dark:bg-[#3e3535] p-2 rounded-lg text-gray-500 group-hover:text-[#d4ac6e] mr-3">
                                    <mod.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">{mod.label}</p>
                                    <p className="text-[10px] text-gray-400">Vista Superior</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        // Itens de Elevação
                        [
                            { id: 'painel', label: 'Painel / Fundo', icon: MaximizeIcon },
                            { id: 'porta_giro', label: 'Porta de Giro', icon: LayoutIcon },
                            { id: 'gaveta', label: 'Gaveta', icon: CreditCardIcon },
                            { id: 'prateleira', label: 'Prateleira', icon: LayersIcon }
                        ].map((mod: any) => (
                            <button 
                                key={mod.id}
                                onClick={() => addItem(mod.id)}
                                className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e] bg-white dark:bg-[#2d2424] transition group text-left"
                            >
                                <div className="bg-gray-100 dark:bg-[#3e3535] p-2 rounded-lg text-gray-500 group-hover:text-[#d4ac6e] mr-3">
                                    <mod.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">{mod.label}</p>
                                    <p className="text-[10px] text-gray-400">Vista Frontal</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
             </div>
          )}
        </aside>

        {/* Área Principal */}
        <main className="flex-1 relative bg-[#f0f2f5] dark:bg-[#1a1a1a] overflow-hidden flex flex-col">
          
          {viewMode === 'editor' && (
            <>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 bg-white dark:bg-[#3e3535] p-1.5 rounded-full shadow-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8]">-</button>
                    <span className="w-12 flex items-center justify-center text-xs font-bold text-[#3e3535] dark:text-[#f5f1e8]">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8]">+</button>
                </div>

                {/* Background Image Control */}
                {initialBackgroundImage && (
                    <div className="absolute top-4 right-4 z-10 bg-white dark:bg-[#3e3535] p-2 rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] w-48">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><ScanIcon className="w-3 h-3"/> Rascunho AR</span>
                            <input type="checkbox" checked={showBackground} onChange={e => setShowBackground(e.target.checked)} className="rounded text-[#d4ac6e] focus:ring-[#d4ac6e]" />
                        </div>
                        {showBackground && (
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400">Opacidade</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.1" 
                                    value={backgroundOpacity} 
                                    onChange={e => setBackgroundOpacity(parseFloat(e.target.value))} 
                                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4ac6e]" 
                                />
                            </div>
                        )}
                    </div>
                )}

                <div 
                    ref={canvasRef}
                    className="flex-1 relative overflow-hidden"
                    style={{ 
                        // Grid style changes based on mode
                        backgroundImage: editorMode === 'plan' 
                            ? 'radial-gradient(#94a3b8 1px, transparent 1px)' 
                            : 'linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)',
                        backgroundSize: `${(editorMode === 'plan' ? 20 : 50) * zoom}px ${(editorMode === 'plan' ? 20 : 50) * zoom}px`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={() => setSelectedId(null)}
                >
                    {/* Background Image Layer */}
                    {initialBackgroundImage && showBackground && (
                        <img 
                            src={initialBackgroundImage} 
                            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none select-none origin-top-left"
                            style={{ opacity: backgroundOpacity, transform: `scale(${zoom})` }}
                            alt="Background Reference"
                        />
                    )}

                    {items.map(item => renderItemVisual(item))}
                    
                    {items.length === 0 && !initialBackgroundImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 text-[#3e3535] dark:text-[#f5f1e8]">
                            <ArrowRightIcon className="w-16 h-16 mb-4" />
                            <p className="text-xl font-bold">Modo {editorMode === 'plan' ? 'Planta Baixa' : 'Elevação'}</p>
                            <p className="text-sm">Arraste componentes do menu à esquerda</p>
                        </div>
                    )}
                </div>
            </>
          )}

          {viewMode === 'render' && (
             <div className="flex-1 flex items-center justify-center p-8">
                {generatedImage ? (
                    <div className="relative max-w-4xl w-full bg-white dark:bg-[#3e3535] p-2 rounded-xl shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040]">
                        <img src={generatedImage} alt="Render IA" className="w-full h-auto rounded-lg" />
                        <div className="absolute bottom-6 right-6 flex gap-3">
                            <button onClick={() => setGeneratedImage(null)} className="bg-white/90 text-[#3e3535] px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-white flex items-center gap-2">
                                <RefreshIcon className="w-4 h-4"/> Novo Render
                            </button>
                            <a href={generatedImage} download="render-ia.png" className="bg-[#d4ac6e] text-[#3e3535] px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-[#c89f5e] flex items-center gap-2">
                                <DownloadIcon className="w-4 h-4"/> Baixar
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-50 max-w-md">
                        <WandIcon className="w-24 h-24 mx-auto mb-4 text-[#d4ac6e]" />
                        <h3 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">Estúdio de Renderização</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Clique em "Gerar Imagem Realista" no menu lateral para visualizar seu projeto 2D em 3D.</p>
                    </div>
                )}
             </div>
          )}

        </main>

        {/* Sidebar Direita (Propriedades - Apenas Editor) */}
        {viewMode === 'editor' && (
            <aside className="w-72 bg-[#fffefb] dark:bg-[#3e3535] border-l border-[#e6ddcd] dark:border-[#4a4040] flex flex-col z-10 shadow-xl">
                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424]">
                    <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">Propriedades</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {selectedId ? (
                        (() => {
                            const item = items.find(i => i.id === selectedId)!;
                            return (
                                <div className="space-y-4 animate-fadeIn">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome</label>
                                        <input type="text" value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Largura</label>
                                            <input type="number" value={item.width} onChange={(e) => updateItem(item.id, { width: Number(e.target.value) })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                                {editorMode === 'plan' ? 'Profundidade' : 'Altura'}
                                            </label>
                                            <input 
                                                type="number" 
                                                value={editorMode === 'plan' ? item.depth : item.height} 
                                                onChange={(e) => updateItem(item.id, editorMode === 'plan' ? { depth: Number(e.target.value) } : { height: Number(e.target.value) })} 
                                                className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Material</label>
                                        <select value={item.material} onChange={(e) => updateItem(item.id, { material: e.target.value as MaterialType })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]">
                                            <option value="MDF Branco">MDF Branco</option>
                                            <option value="MDF Amadeirado">MDF Amadeirado</option>
                                            <option value="Compensado">Compensado</option>
                                            <option value="Vidro">Vidro</option>
                                            <option value="Espelho">Espelho</option>
                                        </select>
                                    </div>

                                    <button onClick={() => deleteItem(item.id)} className="w-full py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 mt-4 text-sm font-bold">
                                        <TrashIcon className="w-4 h-4" /> Remover Item
                                    </button>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="text-center text-gray-400 py-10">
                            {initialBackgroundImage ? (
                                <div className="text-center">
                                    <RulerIcon className="w-12 h-12 mx-auto mb-2 text-[#d4ac6e]" />
                                    <p className="text-sm font-bold">Modo Traçado Ativo</p>
                                    <p className="text-xs mt-1">Use a foto para desenhar por cima.</p>
                                </div>
                            ) : (
                                <>
                                    <BoxIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Selecione um móvel para editar</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        )}

      </div>
    </div>
  );
};
