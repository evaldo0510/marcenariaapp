
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
  ScanIcon // Importado ícone de scan
} from './Shared';
import { generateImage } from '../services/geminiService';

// --- Tipos ---

type MaterialType = 'MDF Branco' | 'MDF Amadeirado' | 'Compensado';

interface FurnitureItem {
  id: string;
  type: 'armario_baixo' | 'armario_alto' | 'roupeiro' | 'mesa';
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  material: MaterialType;
  color: string;
}

interface Smart2DEditorProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (msg: string, title?: string) => void;
    initialBackgroundImage?: string | null; // Novo: Foto de fundo para traçado
}

export const Smart2DEditor: React.FC<Smart2DEditorProps> = ({ isOpen, onClose, showAlert, initialBackgroundImage }) => {
  // Estado
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'editor' | 'cutlist' | 'render'>('editor');
  
  // Estado de Fundo (AR Tracing)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [showBackground, setShowBackground] = useState(!!initialBackgroundImage);
  
  // Estado de Calibragem (Pixel to CM)
  const [scaleFactor, setScaleFactor] = useState(1); // 1px = 1cm (default)
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // Estado de Render IA
  const [isRendering, setIsRendering] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [renderStyle, setRenderStyle] = useState('Moderno');
  
  // Referência do Canvas
  const canvasRef = useRef<HTMLDivElement>(null);

  // Preços Base (Mock)
  const PRICES: Record<string, number> = {
    'MDF Branco': 120.00, 
    'MDF Amadeirado': 180.00,
    'Compensado': 150.00
  };

  useEffect(() => {
      if(initialBackgroundImage) setShowBackground(true);
  }, [initialBackgroundImage]);

  if (!isOpen) return null;

  // --- Funções de Manipulação ---

  const addItem = (type: FurnitureItem['type']) => {
    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      type,
      name: type === 'armario_baixo' ? 'Balcão Inferior' : 
            type === 'armario_alto' ? 'Armário Aéreo' : 
            type === 'roupeiro' ? 'Módulo Roupeiro' : 'Mesa de Trabalho',
      x: 100 + (items.length * 20),
      y: 100 + (items.length * 20),
      width: type === 'mesa' ? 120 : 80,
      depth: type === 'armario_alto' ? 35 : 55,
      height: type === 'armario_baixo' ? 70 : type === 'roupeiro' ? 220 : 75,
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

  // --- Funções de Renderização IA (Integração Real) ---
  const handleGenerateRender = async () => {
    if (items.length === 0) {
        showAlert("Adicione móveis ao projeto antes de renderizar.", "Projeto Vazio");
        return;
    }

    setIsRendering(true);
    setGeneratedImage(null);

    try {
        // Construir um prompt detalhado com base na geometria exata
        let prompt = `Renderize uma imagem fotorrealista de um ambiente de marcenaria estilo ${renderStyle}. \n`;
        prompt += `O projeto contém os seguintes móveis dispostos no espaço:\n`;
        
        items.forEach((item, index) => {
            prompt += `${index + 1}. ${item.name} (${item.material}) medindo ${item.width}cm de largura x ${item.height}cm de altura. \n`;
        });

        if (initialBackgroundImage) {
            prompt += `\nCONTEXTO REAL: Use a imagem de fundo fornecida como referência absoluta para o ambiente (piso, paredes, iluminação). O móvel deve ser inserido neste contexto existente.`;
        }

        prompt += `\nDETALHES VISUAIS: Iluminação de estúdio suave, chão de madeira, paredes claras. Perspectiva isométrica ou frontal mostrando todos os itens. Alta resolução, qualidade fotográfica.`;

        // Aqui chamamos o serviço real do Gemini
        // Passamos a imagem de fundo se existir para "Grounding" visual
        const referenceImages = initialBackgroundImage ? [{ 
            data: initialBackgroundImage.split(',')[1], 
            mimeType: initialBackgroundImage.match(/data:(.*);/)?.[1] || 'image/png' 
        }] : null;

        const imageBase64 = await generateImage(prompt, referenceImages, undefined, true, '2K', 'rich'); // Pro model
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
      
      const snap = (val: number) => Math.round(val / 10) * 10; // Snap to grid 10px
      
      updateItem(selectedId, {
        x: snap(mouseX - dragOffset.x),
        y: snap(mouseY - dragOffset.y)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Cálculo de Peças (Lógica Determinística) ---

  const calculateParts = useMemo(() => {
    const parts: any[] = [];
    let totalArea = 0;
    let totalPrice = 0;

    items.forEach(item => {
      // Regra de marcenaria simples: Caixa + Fundo + Portas
      const thickness = 1.5; // cm (15mm)
      
      // Laterais (2x)
      const sideH = item.height;
      const sideD = item.depth;
      parts.push({ name: `${item.name} - Lateral`, qtd: 2, w: sideD, h: sideH, material: item.material });
      
      // Base e Topo (2x) - Descontando laterais
      const baseW = item.width - (thickness * 2);
      const baseD = item.depth;
      parts.push({ name: `${item.name} - Base/Topo`, qtd: 2, w: baseD, h: baseW, material: item.material });
      
      // Fundo (6mm)
      parts.push({ name: `${item.name} - Fundo`, qtd: 1, w: item.depth - 1, h: item.width - 1, material: 'MDF 6mm Branco' });

      // Portas (Se não for mesa)
      if (item.type !== 'mesa') {
          const numDoors = item.width > 60 ? 2 : 1;
          const doorW = (item.width / numDoors) - 0.3; // Folga
          const doorH = item.height - 0.4;
          parts.push({ name: `${item.name} - Porta`, qtd: numDoors, w: doorW, h: doorH, material: item.material });
      }

      // Cálculo aproximado de área (m2) e preço
      const itemArea = ((sideH * sideD * 2) + (baseW * baseD * 2) + (item.width * item.height)) / 10000;
      totalArea += itemArea;
      totalPrice += itemArea * (PRICES[item.material] || 150);
    });

    return { parts, totalArea, totalPrice };
  }, [items]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Peca,Qtd,Largura(cm),Comprimento(cm),Material\n";
    calculateParts.parts.forEach((part) => {
      csvContent += `${part.name},${part.qtd},${part.w.toFixed(1)},${part.h.toFixed(1)},${part.material}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plano_corte_marcenapp.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
             <p className="text-xs text-gray-500 dark:text-gray-400">Editor Vetorial & Plano de Corte</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-[#2d2424] p-1 rounded-lg">
                <button onClick={() => setViewMode('editor')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'editor' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Editor</button>
                <button onClick={() => setViewMode('cutlist')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'cutlist' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Plano de Corte</button>
                <button onClick={() => setViewMode('render')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'render' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Render 3D</button>
            </div>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Esquerda (Catálogo) */}
        <aside className="w-72 bg-[#fffefb] dark:bg-[#3e3535] border-r border-[#e6ddcd] dark:border-[#4a4040] flex flex-col z-10">
          {viewMode === 'render' ? (
             <div className="flex flex-col h-full p-6">
                <h3 className="font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2"><WandIcon className="w-5 h-5"/> Estúdio IA</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Transforme seu desenho técnico em uma imagem realista usando Inteligência Artificial.</p>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Estilo</label>
                        <select 
                            value={renderStyle} 
                            onChange={(e) => setRenderStyle(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] text-sm"
                        >
                            <option value="Moderno">Moderno</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Classico">Clássico</option>
                            <option value="Rustico">Rústico</option>
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
                    <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">Módulos Disponíveis</h3>
                    <p className="text-xs text-gray-500">Clique para adicionar</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {[
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
                                <p className="text-[10px] text-gray-400">Medida Padrão</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-gray-50 dark:bg-[#2d2424]">
                    <p className="text-xs text-gray-500 uppercase mb-1">Custo Estimado (Mat.)</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">R$ {calculateParts.totalPrice.toFixed(2)}</p>
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
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2424] text-[#3e3535] dark:text-[#f5f1e8]">+</button>
                </div>

                {/* Background Image Control */}
                {initialBackgroundImage && (
                    <div className="absolute top-4 right-4 z-10 bg-white dark:bg-[#3e3535] p-2 rounded-lg shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] w-48">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><ScanIcon className="w-3 h-3"/> Foto Fundo</span>
                            <input type="checkbox" checked={showBackground} onChange={e => setShowBackground(e.target.checked)} className="rounded text-[#d4ac6e] focus:ring-[#d4ac6e]" />
                        </div>
                        {showBackground && (
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={backgroundOpacity} 
                                onChange={e => setBackgroundOpacity(parseFloat(e.target.value))} 
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4ac6e]" 
                            />
                        )}
                    </div>
                )}

                <div 
                    ref={canvasRef}
                    className="flex-1 relative overflow-hidden"
                    style={{ 
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
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

                    {items.map(item => (
                        <div
                            key={item.id}
                            onMouseDown={(e) => handleMouseDown(e, item.id)}
                            style={{
                                position: 'absolute',
                                left: item.x * zoom,
                                top: item.y * zoom,
                                width: item.width * zoom,
                                height: item.depth * zoom,
                                backgroundColor: selectedId === item.id ? 'rgba(219, 234, 254, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                borderColor: selectedId === item.id ? '#2563eb' : '#94a3b8',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                transform: `rotate(${item.rotation}deg)`,
                                zIndex: selectedId === item.id ? 10 : 1,
                                cursor: isDragging && selectedId === item.id ? 'grabbing' : 'grab',
                            }}
                            className="group flex flex-col items-center justify-center shadow-sm select-none"
                        >
                            <div className="text-[10px] text-gray-600 font-bold pointer-events-none text-center leading-tight px-1">
                                {item.name}
                                <div className="text-[8px] opacity-70">{item.width}x{item.depth}</div>
                            </div>
                            {/* Indicador de frente */}
                            <div className="absolute bottom-0 w-full h-1 bg-gray-400 group-hover:bg-blue-400"></div>
                        </div>
                    ))}
                    
                    {items.length === 0 && !initialBackgroundImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 text-[#3e3535] dark:text-[#f5f1e8]">
                            <ArrowRightIcon className="w-16 h-16 mb-4" />
                            <p className="text-xl font-bold">Arraste para mover o canvas</p>
                            <p className="text-sm">Selecione móveis no menu à esquerda</p>
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

          {viewMode === 'cutlist' && (
             <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-[#fffefb] dark:bg-[#3e3535] rounded-xl shadow-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden">
                    <div className="p-6 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f0e9dc] dark:bg-[#2d2424]">
                        <h2 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                            <ToolsIcon /> Plano de Corte Automático
                        </h2>
                        <button onClick={handleExportCSV} className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1">
                            <DocumentTextIcon className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-[#4a4040] text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Peça</th>
                                <th className="p-4 text-center">Qtd</th>
                                <th className="p-4 text-center">Dimensões (cm)</th>
                                <th className="p-4">Material</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                            {calculateParts.parts.map((part, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#4a4040]/50">
                                    <td className="p-4 font-bold text-[#3e3535] dark:text-[#f5f1e8]">{part.name}</td>
                                    <td className="p-4 text-center">{part.qtd}</td>
                                    <td className="p-4 text-center font-mono text-[#d4ac6e]">{part.h.toFixed(1)} x {part.w.toFixed(1)}</td>
                                    <td className="p-4"><span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">{part.material}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {calculateParts.parts.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            Nenhum móvel no projeto. Volte ao editor para adicionar.
                        </div>
                    )}
                </div>
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
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prof.</label>
                                            <input type="number" value={item.depth} onChange={(e) => updateItem(item.id, { depth: Number(e.target.value) })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Altura</label>
                                            <input type="number" value={item.height} onChange={(e) => updateItem(item.id, { height: Number(e.target.value) })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rotação</label>
                                            <input type="number" value={item.rotation} onChange={(e) => updateItem(item.id, { rotation: Number(e.target.value) })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Material</label>
                                        <select value={item.material} onChange={(e) => updateItem(item.id, { material: e.target.value as MaterialType })} className="w-full p-2 rounded border dark:bg-[#2d2424] dark:border-[#5a4f4f]">
                                            <option value="MDF Branco">MDF Branco</option>
                                            <option value="MDF Amadeirado">MDF Amadeirado</option>
                                            <option value="Compensado">Compensado</option>
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
                                    <p className="text-xs mt-1">Arraste os módulos sobre a foto para posicionar.</p>
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
