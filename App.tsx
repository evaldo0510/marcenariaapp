import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, MessageSquare, Ruler, Download, Settings, Loader2, Image as ImageIcon, 
  RefreshCcw, ClipboardList, Hammer, Palette, Sun, LayoutTemplate, Sparkles, ChevronUp, 
  Map, Focus, Eye, ScanLine, Mic, Square, AudioLines, Plus, Trash2, ImagePlus, Share2, 
  Edit3, Maximize, Box, Link as LinkIcon, Search, X, ArrowUp, Wand2, Undo2, RotateCcw, 
  SendHorizontal, SlidersHorizontal, Save, LayoutGrid, Home, ChevronRight, Clock, FileText,
  MoreHorizontal, Menu
} from 'lucide-react';

/* MarceneiroAI v7.2 - Mobile & Tablet Optimized
   Features: Dynamic Viewport Height (dvh), Touch-First UI, Responsive Grids, Wood Theme.
*/

// --- API Handling ---
const generateContent = async (prompt: string, mediaData: string | null = null, mediaType = "image/png", systemInstruction = "") => {
  const apiKey = process.env.API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const parts: any[] = [{ text: prompt }];
  if (mediaData) {
    parts.push({
      inlineData: {
        mimeType: mediaType,
        data: mediaData
      }
    });
  }

  const isTextAdaptation = systemInstruction.includes("Adaptador Técnico");
  const isTranscription = prompt.includes("Transcreva");

  const payload: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: isTextAdaptation ? 0.4 : 0.2
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  if (!isTranscription && !isTextAdaptation) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = {
        type: "OBJECT",
        properties: {
          projectType: { type: "STRING" },
          dimensions_summary: { type: "STRING" },
          ceilingHeight: { type: "NUMBER" },
          sketch_fidelity_notes: { type: "STRING" },
          palette: { type: "ARRAY", items: { type: "STRING" } },
          detected_elements: { type: "ARRAY", items: { type: "STRING" } },
          custom_decor: { type: "ARRAY", items: { type: "STRING" } },
          components: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                name: { type: "STRING" },
                dimensions: { type: "STRING" },
                description: { type: "STRING" },
                material_focus: { type: "STRING" }
              }
            }
          },
          globalMaterial: { type: "STRING" },
          analysis_comment: { type: "STRING" },
          cutlist: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                component_ref: { type: "STRING" },
                part: { type: "STRING" },
                quantity: { type: "NUMBER" },
                width: { type: "NUMBER" },
                length: { type: "NUMBER" },
                material: { type: "STRING" }
              }
            }
          },
          hardware: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) throw new Error("Sem resposta da IA");
    
    const text = data.candidates[0].content.parts[0].text;
    return (isTranscription || isTextAdaptation) ? text : JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Falha ao processar com Gemini.");
  }
};

const generateRenderImage = async (prompt: string, inputImageBase64: string | null = null, creativityLevel = 0.55) => {
  const apiKey = process.env.API_KEY;
  
  if (inputImageBase64) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: inputImageBase64 } }
        ]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: creativityLevel
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      const base64Image = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (base64Image) return `data:image/png;base64,${base64Image}`;
    } catch (error) {
       console.log("Fallback to Imagen");
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  const payload = {
    instances: [{ prompt: prompt }],
    parameters: { sampleCount: 1 }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.predictions && data.predictions[0]) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    throw new Error("Falha ao gerar imagem.");
  }
};

// --- Responsive Components ---

const ProjectCard: React.FC<{ project: any, onOpen: (p: any) => void, onDelete: (id: any) => void }> = ({ project, onOpen, onDelete }) => (
  <div onClick={() => onOpen(project)} className="bg-white group cursor-pointer border border-stone-200 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-md rounded-xl overflow-hidden active:scale-[0.98] transform">
    <div className="h-40 md:h-48 bg-stone-100 relative overflow-hidden">
      {project.thumbnail ? (
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition duration-700" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone-300"><Box strokeWidth={1} size={40} /></div>
      )}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
        className="absolute top-2 right-2 md:top-3 md:right-3 p-2 bg-white/80 md:bg-transparent md:text-stone-400 md:hover:text-red-500 rounded-full md:opacity-0 md:group-hover:opacity-100 transition text-red-500 md:text-inherit shadow-sm md:shadow-none"
      >
        <Trash2 size={16} />
      </button>
    </div>
    <div className="p-3 md:p-4 bg-white">
      <h3 className="text-sm font-semibold text-stone-800 truncate">{project.name}</h3>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-stone-400 uppercase tracking-widest">{new Date(project.updatedAt).toLocaleDateString()}</span>
        <ArrowUp size={12} className="text-amber-600 rotate-45 group-hover:translate-x-1 transition" />
      </div>
    </div>
  </div>
);

const MinimalButton = ({ icon: Icon, onClick, active, title, disabled, className }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    title={title}
    className={`p-2.5 md:p-2 rounded-md transition-all duration-200 flex items-center gap-2 text-sm
      ${active ? 'bg-amber-900 text-white shadow-md' : 'text-stone-500 hover:text-amber-900 hover:bg-stone-50'} 
      ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      ${className}
    `}
  >
    <Icon size={20} className="md:w-[18px] md:h-[18px]" strokeWidth={1.5} />
  </button>
);

const TechnicalView = ({ data }: { data: any }) => {
  return (
    <div className="w-full h-full bg-white p-4 md:p-8 overflow-y-auto font-sans text-stone-800">
      <div className="mb-6 md:mb-10 pb-4 md:pb-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-stone-900">{data.projectType || "Sem Título"}</h2>
          <p className="text-xs md:text-sm text-stone-400 mt-2 font-light max-w-xl italic">{data.analysis_comment}</p>
        </div>
        <div className="text-left md:text-right w-full md:w-auto bg-stone-50 p-2 md:p-0 rounded md:bg-transparent">
           <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1">Pé Direito</div>
           <div className="text-lg md:text-xl font-light font-mono text-stone-600">{data.ceilingHeight || "-"} <span className="text-sm text-stone-400">mm</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 order-2 lg:order-1">
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 mb-4 flex items-center gap-2 border-l-2 border-amber-500 pl-2">Lista de Corte</h3>
            <div className="overflow-x-auto rounded-lg border border-stone-100">
              <table className="w-full text-sm text-left">
                <thead className="text-stone-500 font-medium bg-stone-50 border-b border-stone-100">
                  <tr><th className="py-3 px-4 font-medium whitespace-nowrap">Peça</th><th className="py-3 font-medium whitespace-nowrap">Ref.</th><th className="py-3 text-center font-medium">Qtd</th><th className="py-3 px-4 font-medium text-right whitespace-nowrap">Dimensões</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data.cutlist?.map((item: any, idx: number) => (
                    <tr key={idx} className="group hover:bg-orange-50/30 transition">
                      <td className="py-3 px-4 text-stone-800">{item.part}</td>
                      <td className="py-3 text-stone-400 text-xs uppercase">{item.component_ref}</td>
                      <td className="py-3 text-center text-stone-500 font-mono">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600 whitespace-nowrap">{item.length} x {item.width}</td>
                    </tr>
                  ))}
                  {!data.cutlist?.length && <tr><td colSpan={4} className="py-8 text-center text-stone-300 italic">Nenhum dado processado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8 order-1 lg:order-2">
           <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 mb-4 border-l-2 border-amber-500 pl-2">Especificações</h3>
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded border border-stone-100">
                  <span className="block text-[10px] text-stone-400 uppercase mb-1">Material Base</span>
                  <span className="text-sm font-medium text-amber-900">{data.globalMaterial}</span>
                </div>
                {data.palette?.length > 0 && (
                  <div className="p-4 bg-stone-50 rounded border border-stone-100">
                    <span className="block text-[10px] text-stone-400 uppercase mb-2">Paleta</span>
                    <div className="flex flex-wrap gap-2">
                      {data.palette.map((c: string, i: number) => <span key={i} className="px-2 py-1 bg-white border border-stone-200 text-xs text-stone-600 rounded-full">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Editor ---
const ProjectEditor = ({ initialProject, onBack, onSave }: any) => {
  const [activeTab, setActiveTab] = useState('technical');
  const [inputImage, setInputImage] = useState<string | null>(initialProject?.inputImage || null); 
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [messages, setMessages] = useState<{role: string, text?: string, image?: string}[]>([{ role: 'ai', text: 'Estúdio pronto. Envie seu rascunho.' }]);
  const [inputMessage, setInputMessage] = useState('');
  const [projectData, setProjectData] = useState<any>(initialProject?.data || { projectType: "", cutlist: [], globalMaterial: "Padrão" });
  const [renderedImage, setRenderedImage] = useState<string | null>(initialProject?.renderedImage || null);
  const [creativity, setCreativity] = useState(0.5);
  const [showMobileSettings, setShowMobileSettings] = useState(false); // Mobile Settings toggle
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Handlers Simplificados (Mantidos)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1];
        setInputImage(reader.result as string);
        setMessages(prev => [...prev, {role:'user', image: reader.result as string}]);
        processAnalysis(b64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAnalysis = async (b64: string) => {
    setLoading(true); setLoadingStep('Lendo geometria...');
    try {
      const data = await generateContent("Analise técnica completa.", b64, "image/png", "Especialista em Marcenaria e Leitura de Plantas.");
      setProjectData(data);
      setActiveTab('technical');
      setMessages(prev => [...prev, {role:'ai', text: `Projeto lido: ${data.projectType}.`}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro na leitura."}]); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if(!inputMessage.trim()) return;
    const txt = inputMessage;
    setMessages(prev => [...prev, {role:'user', text: txt}]);
    setInputMessage('');
    setLoading(true); setLoadingStep('Processando...');
    
    if (txt.toLowerCase().includes('render') || txt.toLowerCase().includes('foto')) {
       await handleRender();
       return;
    }

    try {
      const newData = await generateContent(`Edit: ${txt}. Current: ${JSON.stringify(projectData)}`, null, "text/plain", "Editor JSON Técnico.");
      setProjectData(newData);
      setMessages(prev => [...prev, {role:'ai', text: "Atualizado."}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro."}]); }
    finally { setLoading(false); }
  };

  const handleRender = async () => {
    setLoading(true); setLoadingStep('Fotografando...');
    try {
      const prompt = `Hyper-realistic interior photography of ${projectData.projectType}. ${projectData.globalMaterial}. Decor: ${projectData.custom_decor?.join(', ')}. Warm lighting, wood textures, architectural digest style. 8k.`;
      const url = await generateRenderImage(prompt, inputImage?.split(',')[1], creativity);
      setRenderedImage(url);
      setActiveTab('render');
      setShowMobileSettings(false); // Close settings on mobile after render
      setMessages(prev => [...prev, {role:'ai', text: "Imagem gerada."}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro no render."}]); }
    finally { setLoading(false); }
  };

  const save = () => {
    onSave({
      id: initialProject?.id || Date.now(),
      name: projectData.projectType || "Sem Nome",
      updatedAt: new Date().toISOString(),
      thumbnail: renderedImage || inputImage,
      data: projectData,
      inputImage, renderedImage
    });
  };

  // --- Mobile Optimized UI Structure ---
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-stone-50 text-stone-800 font-sans overflow-hidden">
      
      {/* LEFT/TOP: Main Content (Canvas) - Grows to fill space */}
      <div className="flex-1 flex flex-col relative bg-stone-50/50 overflow-hidden h-[55%] md:h-full order-1 md:order-1 border-b md:border-b-0 border-stone-200">
        
        {/* Top Wood Toolbar */}
        <div className="h-14 px-4 flex items-center justify-between bg-white border-b border-stone-200 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-stone-400 hover:text-amber-900 transition"><ArrowUp className="-rotate-90" size={20}/></button>
            <div className="h-4 w-px bg-stone-200"></div>
            <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('technical')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold transition ${activeTab === 'technical' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500'}`}>Técnico</button>
              <button onClick={() => setActiveTab('render')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold transition ${activeTab === 'render' ? 'bg-white shadow-sm text-amber-900' : 'text-stone-500'}`}>Visual</button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MinimalButton icon={Save} onClick={save} title="Salvar" />
            {projectData.projectType && (
              <button 
                onClick={handleRender} 
                disabled={loading}
                className="bg-amber-900 text-white px-3 md:px-5 py-1.5 rounded-md text-[10px] md:text-xs font-bold tracking-wide hover:bg-amber-800 transition shadow-lg shadow-amber-900/20 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? <Loader2 size={12} className="animate-spin"/> : <RefreshCcw size={12}/>}
                <span className="hidden md:inline">RENDER</span>
                <span className="md:hidden">FOTO</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'technical' ? (
            <TechnicalView data={projectData} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 p-4 md:p-8">
              {renderedImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white group border-4 border-white max-h-full max-w-full">
                    <img src={renderedImage} className="max-h-[70vh] md:max-h-[80vh] w-auto h-auto object-contain" />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <a href={renderedImage} download="project.png" className="bg-white p-3 rounded-full shadow-lg hover:scale-105 transition text-stone-800"><Download size={20}/></a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-stone-400">
                  <ImageIcon strokeWidth={1} size={48} className="mx-auto mb-4 opacity-50"/>
                  <p className="text-sm font-light">Aguardando renderização...</p>
                </div>
              )}
              
              {/* Settings Toggle (Mobile) */}
              <button 
                onClick={() => setShowMobileSettings(!showMobileSettings)}
                className="md:hidden absolute top-4 left-4 z-10 bg-white/90 backdrop-blur text-stone-700 p-2 rounded-full shadow-md border border-stone-200"
              >
                <SlidersHorizontal size={18} />
              </button>

              {/* Floating Creativity Control (Desktop Sidebar / Mobile Modal) */}
              <div className={`
                absolute bottom-0 left-0 w-full md:w-64 bg-white p-4 md:rounded-tr-xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:shadow-xl border-t md:border-t-0 md:border-r border-stone-100 transition-transform duration-300 z-20
                ${showMobileSettings || window.innerWidth >= 768 ? 'translate-y-0' : 'translate-y-full md:translate-y-0 hidden md:block'}
                ${window.innerWidth >= 768 ? 'md:bottom-8 md:left-8 md:rounded-xl md:border' : ''}
              `}>
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] uppercase font-bold text-stone-400">Liberdade Criativa</span>
                   <span className="text-[10px] font-mono text-amber-600">{Math.round(creativity * 100)}%</span>
                   <button onClick={() => setShowMobileSettings(false)} className="md:hidden text-stone-400"><X size={16}/></button>
                 </div>
                 <input type="range" min="0" max="1" step="0.1" value={creativity} onChange={e => setCreativity(parseFloat(e.target.value))} className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-900"/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT/BOTTOM: Chat & Controls - Fixed height on mobile */}
      <div className="w-full md:w-96 bg-white border-l border-stone-200 flex flex-col z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] h-[45%] md:h-full order-2 md:order-2">
        {/* Chat Header (Hidden on Mobile to save space) */}
        <div className="hidden md:flex h-16 px-6 items-center justify-between border-b border-stone-100 bg-stone-50/50 shrink-0">
          <span className="text-sm font-bold tracking-widest uppercase text-amber-900">Assistente</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide bg-white">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && <img src={msg.image} className="w-20 md:w-32 h-auto rounded border border-stone-200 mb-2" />}
              <div className={`max-w-[95%] md:max-w-[90%] p-2.5 md:p-3 text-xs md:text-sm leading-relaxed rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-amber-900 text-white rounded-br-sm shadow-md' 
                  : 'bg-stone-100 text-stone-700 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-xs text-stone-400"><Loader2 size={10} className="animate-spin"/> {loadingStep}</div>}
          <div ref={chatEndRef}/>
        </div>

        {/* Input Area - Compact on Mobile */}
        <div className="p-3 md:p-4 border-t border-stone-100 bg-white shrink-0 pb-safe">
          <div className="bg-stone-50 rounded-full md:rounded-2xl p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2 border border-transparent focus-within:border-amber-200 transition">
            
            <div className="flex gap-0.5 text-stone-400">
               <label className="p-2 hover:text-amber-900 hover:bg-white rounded-full cursor-pointer transition"><Upload size={18} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} /></label>
               <button className="p-2 hover:text-amber-900 hover:bg-white rounded-full transition"><Camera size={18} /></button>
            </div>

            <input 
              className="flex-1 bg-transparent text-sm outline-none text-stone-800 placeholder-stone-400 min-w-0"
              placeholder="Digite..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading}
              style={{fontSize: '16px'}} /* Prevent iOS Zoom */
            />

            <button 
              onClick={handleSend}
              disabled={loading || !inputMessage.trim()}
              className="p-2 bg-amber-900 text-white rounded-full shadow-sm active:scale-95 transition disabled:opacity-50 disabled:shadow-none"
            >
              {inputMessage.trim() ? <ArrowUp size={18} /> : <Mic size={18} />}
            </button>
          </div>
          
          <div className="mt-2 flex justify-center gap-6 md:gap-4 pb-2 md:pb-0">
             <button className="text-[10px] text-stone-400 hover:text-purple-600 flex items-center gap-1 transition"><Wand2 size={12}/> <span className="hidden md:inline">Melhorar</span> Texto</button>
             <button className="text-[10px] text-stone-400 hover:text-red-600 flex items-center gap-1 transition"><RotateCcw size={12}/> Reset<span className="hidden md:inline">ar</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Root ---
export const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => { const s = localStorage.getItem('wood_projects'); if (s) setProjects(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('wood_projects', JSON.stringify(projects)); }, [projects]);

  const handleSave = (p: any) => {
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = p; return copy; }
      return [p, ...prev];
    });
  };

  const handleNew = () => { setActiveProject(null); setCurrentView('editor'); };

  if (currentView === 'editor') return <ProjectEditor initialProject={activeProject} onBack={() => setCurrentView('dashboard')} onSave={handleSave} />;

  return (
    <div className="min-h-[100dvh] bg-stone-50 font-sans text-stone-900 selection:bg-amber-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2 text-stone-900">Marceneiro<span className="font-bold text-amber-900">AI</span></h1>
            <p className="text-sm md:text-base text-stone-500 font-light">Seu estúdio de design e marcenaria inteligente.</p>
          </div>
          <button onClick={handleNew} className="w-full md:w-auto bg-amber-900 text-white px-8 py-3 rounded-md text-sm font-bold tracking-wide hover:bg-amber-800 transition shadow-xl shadow-stone-300">
            + NOVO PROJETO
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onOpen={(prj) => { setActiveProject(prj); setCurrentView('editor'); }} onDelete={(id) => setProjects(prev => prev.filter(x => x.id !== id))} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-20 md:py-32 text-center border border-dashed border-stone-300 rounded-xl bg-white">
              <p className="text-stone-400 font-light">Nenhum projeto encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}