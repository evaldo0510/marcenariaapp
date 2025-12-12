
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  MessageSquare, 
  Ruler, 
  Download, 
  Settings, 
  Loader2, 
  Image as ImageIcon, 
  RefreshCcw,
  ClipboardList,
  Hammer,
  Palette,
  Sun,
  LayoutTemplate,
  Sparkles,
  ChevronUp,
  Map,
  Focus,
  Eye,
  ScanLine,
  Mic,
  Square,
  AudioLines,
  Plus,
  Trash2,
  ImagePlus
} from 'lucide-react';

/* MarceneiroAI v3.2 - Galeria de Vistas & Upload Específico
   Features: Zone segmentation, Floor plan reading, Contextual Rendering, Audio Dictation, Zone-specific uploads, Gallery.
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

  const isTranscription = prompt.includes("Transcreva");

  const payload: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.3
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  if (!isTranscription) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = {
        type: "OBJECT",
        properties: {
          projectType: { type: "STRING" },
          ceilingHeight: { type: "NUMBER" },
          zones: {
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
                zone: { type: "STRING" },
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
    return isTranscription ? text : JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Falha ao processar com Gemini.");
  }
};

const generateRenderImage = async (prompt: string, inputImageBase64: string | null = null) => {
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
        temperature: 0.45
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

// --- Components ---

const TechnicalView = ({ data }: { data: any }) => {
  return (
    <div className="w-full h-full bg-slate-50 p-4 md:p-6 overflow-y-auto font-sans text-slate-800">
      
      {/* Header do Projeto */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase">{data.projectType || "Projeto"}</h2>
            <p className="text-xs text-slate-500 mt-1">{data.analysis_comment}</p>
          </div>
          <div className="text-right">
             <div className="text-xs font-bold text-slate-400 uppercase">Pé Direito</div>
             <div className="text-lg font-mono font-bold text-slate-800">{data.ceilingHeight || "-"}mm</div>
          </div>
        </div>

        {/* Zonas Identificadas */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
           {data.zones && data.zones.map((zone: any, idx: number) => (
             <div key={idx} className="bg-slate-100 p-2 rounded border border-slate-200 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Zona {idx + 1}</span>
                <span className="font-bold text-sm text-slate-700">{zone.name}</span>
                <span className="text-xs text-slate-500">{zone.dimensions}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cutlist Grouped by Module */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ClipboardList size={16} /> Lista de Corte
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                <tr>
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2">Peça</th>
                  <th className="px-3 py-2 text-center">Qtd</th>
                  <th className="px-3 py-2">mm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.cutlist && data.cutlist.length > 0 ? (
                  data.cutlist.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold text-slate-600 text-[10px] uppercase">{item.zone}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{item.part}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 font-mono">{item.length} x {item.width}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-400">Lista vazia.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hardware & Specs */}
        <div className="space-y-4">
           <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2">
                <Hammer size={16}/> Ferragens
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.hardware && data.hardware.map((h: string, i: number) => (
                  <span key={i} className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded border border-orange-100">
                    {h}
                  </span>
                ))}
              </div>
           </div>
           
           <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-900">
             <strong>Dica de Montagem:</strong> Comece o nivelamento pelo canto da parede de 2900. O fechamento superior do armário deve considerar o pé direito de {data.ceilingHeight}mm menos 20mm de folga.
           </div>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [activeTab, setActiveTab] = useState('technical');
  const [inputImage, setInputImage] = useState<string | null>(null); // Planta Geral
  
  // Store specific sketches for each zone (e.g., zoneId: base64)
  const [zoneSketches, setZoneSketches] = useState<Record<string, string>>({});
  // Gallery of generated renders
  const [renderGallery, setRenderGallery] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [showMobileSettings, setShowMobileSettings] = useState(false);
  
  // Rendering State
  const [selectedZone, setSelectedZone] = useState('all'); 
  const [renderConfig, setRenderConfig] = useState({
    environment: "Quarto Casal", 
    lighting: "Luz Natural (Dia)", 
    style: "Moderno Aconchegante",
    useOriginalAsBase: true 
  });

  const [projectData, setProjectData] = useState<any>({
    projectType: "Novo Projeto",
    ceilingHeight: 0,
    zones: [],
    cutlist: [],
    hardware: [],
    analysis_comment: "Aguardando planta..."
  });
  
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Olá! Envie a planta baixa para começar. Se tiver rascunhos das vistas, melhor ainda!', image: null as string | null }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // --- Audio Handlers ---
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processAudioInput(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setLoading(true);
      setLoadingStep("Processando áudio com IA...");
    }
  };

  const processAudioInput = async (base64Audio: string) => {
    try {
      const systemPrompt = `
        Você é um assistente de marcenaria. Transcreva o áudio corrigindo termos técnicos. Retorne APENAS o texto.
      `;
      const transcription = await generateContent("Transcreva este comando.", base64Audio, "audio/webm", systemPrompt);
      setInputMessage(prev => prev ? `${prev} ${transcription}` : transcription);
      setLoading(false);
      setLoadingStep("");
    } catch (error) {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // --- Image Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingStep('Lendo planta baixa...');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setInputImage(reader.result as string);
      setMessages(prev => [...prev, { role: 'user', text: 'Analise esta planta.', image: reader.result as string }]);

      try {
        const systemPrompt = `
          Especialista em Plantas Baixas de marcenaria.
          1. Identifique TIPO DE AMBIENTE.
          2. Identifique PÉ DIREITO.
          3. SEGMENTE ZONAS (zones).
          4. Crie LISTA DE CORTE (cutlist) por zona.
          Retorne JSON estrito.
        `;
        const analysis = await generateContent("Analise esta planta baixa completa.", base64, "image/png", systemPrompt);
        setProjectData(analysis);
        
        const zoneNames = analysis.zones ? analysis.zones.map((z: any) => z.name).join(", ") : "áreas";
        setMessages(prev => [...prev, { role: 'ai', text: `Entendi! Identifiquei: ${zoneNames}.`, image: null }]);
        setActiveTab('technical');
      } catch (err) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Erro na leitura da planta.', image: null }]);
      } finally {
        setLoading(false);
        setLoadingStep('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleZoneSketchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedZone === 'all') return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setZoneSketches(prev => ({
        ...prev,
        [selectedZone]: reader.result as string // Save base64 for this specific zone
      }));
      setMessages(prev => [...prev, { role: 'ai', text: `Ótimo! Usarei este rascunho de vista para renderizar a zona "${selectedZone}" com mais precisão.`, image: null }]);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText, image: null }]);
    setInputMessage('');
    setLoading(true);
    setLoadingStep('Atualizando projeto...');

    try {
      const updatePrompt = `
        Dados Atuais: ${JSON.stringify(projectData)}
        Usuario: "${userText}"
        Ação: Atualize decoração, materiais ou medidas. Recalcule lista de corte se necessário.
        Retorne JSON atualizado.
      `;
      const updatedData = await generateContent(updatePrompt, null, "image/png", "Atualizador de Ambientes.");
      setProjectData(updatedData);
      setMessages(prev => [...prev, { role: 'ai', text: "Projeto atualizado.", image: null }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Erro ao atualizar.', image: null }]);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleGenerateRender = async () => {
    setLoading(true);
    
    try {
      let focusPrompt = "";
      let activeZoneData = null;
      let baseImageForRender = renderConfig.useOriginalAsBase ? inputImage : null;

      if (selectedZone === 'all') {
        focusPrompt = `Wide angle view of the entire room. Showing ${projectData.zones.map((z: any) => z.name).join(', ')}.`;
        setLoadingStep('Renderizando ambiente completo...');
      } else {
        activeZoneData = projectData.zones.find((z: any) => z.id === selectedZone || z.name === selectedZone);
        if (activeZoneData) {
          focusPrompt = `Close up architectural shot focusing specifically on the ${activeZoneData.name}. ${activeZoneData.description}.`;
          setLoadingStep(`Renderizando zona: ${activeZoneData.name}...`);
          
          // Check if we have a specific sketch for this zone
          if (zoneSketches[selectedZone]) {
            baseImageForRender = zoneSketches[selectedZone];
            console.log("Using specific sketch for", selectedZone);
          }
        }
      }

      const prompt = `
        Photorealistic interior design render.
        Subject: ${focusPrompt}
        Context: ${projectData.projectType}. Ceiling height ${projectData.ceilingHeight}mm.
        Style: ${renderConfig.style}, ${renderConfig.environment}.
        Lighting: ${renderConfig.lighting}.
        Decor details: Bedding, plants, rugs matches style.
        Technical: 8k resolution, straight lines, architectural photography.
      `;

      const url = await generateRenderImage(prompt, baseImageForRender ? baseImageForRender.split(',')[1] : null);
      
      setRenderedImage(url);
      
      // Add to Gallery
      setRenderGallery(prev => [
        { id: Date.now(), url: url, zone: selectedZone === 'all' ? 'Geral' : selectedZone, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ]);

      setActiveTab('render');
      setShowMobileSettings(false);
      setMessages(prev => [...prev, { role: 'ai', text: `Visualização pronta (${selectedZone === 'all' ? 'Geral' : selectedZone})!`, image: null }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Erro no render.', image: null }]);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      
      {/* VISUALIZATION AREA */}
      <div className="w-full md:flex-1 h-[60vh] md:h-full flex flex-col bg-slate-100 relative order-1 md:order-2 shadow-xl z-20">
        
        {/* Toolbar */}
        <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-3 md:px-6 bg-neutral-900 shadow-md flex-shrink-0 z-30">
          <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
            <button 
              onClick={() => setActiveTab('technical')}
              className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 transition ${activeTab === 'technical' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              <ScanLine size={14} /> <span className="hidden sm:inline">Planta & Corte</span>
            </button>
            <button 
              onClick={() => setActiveTab('render')}
              className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2 transition ${activeTab === 'render' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              <Eye size={14} /> <span className="hidden sm:inline">Visualização 3D</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
             {projectData.zones.length > 0 && (
                <button 
                onClick={handleGenerateRender}
                disabled={loading}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-full transition shadow-lg disabled:opacity-50"
                >
                <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
                RENDERIZAR
                </button>
             )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex bg-slate-100">
          
          {activeTab === 'technical' && (
             <TechnicalView data={projectData} />
          )}

          {activeTab === 'render' && (
            <div className="w-full h-full flex flex-col md:flex-row relative">
              
              {/* Settings Panel */}
              <div className={`
                absolute md:relative top-0 left-0 w-full md:w-72 bg-neutral-900/95 md:bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 
                flex flex-col z-20 transition-all duration-300 ease-in-out
                ${showMobileSettings ? 'max-h-[85%] overflow-y-auto' : 'max-h-0 md:max-h-full overflow-hidden md:overflow-y-auto'}
              `}>
                <div className="p-4 flex flex-col gap-6">
                   <div className="flex items-center justify-between md:hidden pb-2 border-b border-neutral-800">
                      <span className="font-bold text-white text-sm">Configuração de Render</span>
                      <button onClick={() => setShowMobileSettings(false)}><ChevronUp size={20}/></button>
                   </div>

                   {/* Zone Selector */}
                   <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                      <h4 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-2">
                         <Focus size={12}/> 1. Escolha o Foco
                      </h4>
                      <div className="flex flex-col gap-1 mb-3">
                        <button 
                          onClick={() => setSelectedZone('all')}
                          className={`text-left text-sm px-2 py-1.5 rounded transition ${selectedZone === 'all' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/50' : 'text-neutral-400 hover:text-white'}`}
                        >
                          Visão Geral (Planta)
                        </button>
                        {projectData.zones.map((z: any, i: number) => (
                           <button 
                             key={i}
                             onClick={() => setSelectedZone(z.id || z.name)}
                             className={`text-left text-sm px-2 py-1.5 rounded transition ${selectedZone === (z.id || z.name) ? 'bg-orange-600/20 text-orange-400 border border-orange-600/50' : 'text-neutral-400 hover:text-white'}`}
                           >
                             {z.name}
                           </button>
                        ))}
                      </div>

                      {/* Zone Specific Upload - Only shows if a specific zone is selected */}
                      {selectedZone !== 'all' && (
                         <div className="border-t border-neutral-700 pt-3">
                           <p className="text-[10px] text-neutral-400 mb-2">Quer mais precisão nesta vista?</p>
                           <label className={`
                             flex items-center justify-center gap-2 w-full py-2 rounded text-xs font-bold cursor-pointer transition border border-dashed
                             ${zoneSketches[selectedZone] 
                               ? 'bg-green-900/30 text-green-400 border-green-700' 
                               : 'bg-neutral-700 text-neutral-300 border-neutral-500 hover:bg-neutral-600'}
                           `}>
                             <ImagePlus size={14} />
                             {zoneSketches[selectedZone] ? 'Rascunho Anexado' : 'Anexar Rascunho da Vista'}
                             <input type="file" className="hidden" accept="image/*" onChange={handleZoneSketchUpload} />
                           </label>
                           {zoneSketches[selectedZone] && (
                             <p className="text-[10px] text-green-500 mt-1 text-center">Usaremos este desenho para o render.</p>
                           )}
                         </div>
                      )}
                   </div>

                   {/* Gallery Preview (Mini) */}
                   {renderGallery.length > 0 && (
                     <div className="space-y-2">
                       <h4 className="text-xs font-bold text-neutral-400 uppercase">Galeria de Vistas</h4>
                       <div className="grid grid-cols-2 gap-2">
                         {renderGallery.slice(0, 4).map((img) => (
                           <div 
                              key={img.id} 
                              onClick={() => setRenderedImage(img.url)}
                              className={`aspect-square bg-black rounded overflow-hidden cursor-pointer border-2 ${renderedImage === img.url ? 'border-orange-500' : 'border-transparent'}`}
                           >
                             <img src={img.url} alt={img.zone} className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Style Settings */}
                   <div className="space-y-4">
                     <div>
                       <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Estilo</label>
                       <select 
                         value={renderConfig.style}
                         onChange={(e) => setRenderConfig({...renderConfig, style: e.target.value})}
                         className="w-full bg-neutral-800 text-white text-xs rounded p-2 border border-neutral-700 outline-none"
                       >
                         <option>Moderno Aconchegante</option>
                         <option>Minimalista</option>
                         <option>Industrial</option>
                         <option>Clássico</option>
                       </select>
                     </div>
                     
                     <div className="bg-neutral-800 p-3 rounded border border-neutral-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={renderConfig.useOriginalAsBase}
                            onChange={(e) => setRenderConfig({...renderConfig, useOriginalAsBase: e.target.checked})}
                            className="accent-orange-600 w-4 h-4 rounded"
                          />
                          <span className="text-xs text-white">Usar traços como base</span>
                        </label>
                     </div>
                   </div>
                </div>
              </div>

              {/* Mobile Toggle Button */}
              <button 
                onClick={() => setShowMobileSettings(!showMobileSettings)}
                className="md:hidden absolute top-4 left-4 z-10 bg-black/60 backdrop-blur text-white p-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2"
              >
                 <Settings size={16} /> <span className="text-xs font-bold">{selectedZone === 'all' ? 'Geral' : selectedZone}</span>
              </button>

              {/* Main Image Display */}
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 p-4 md:p-8 relative">
                {renderedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center flex-col">
                    <img src={renderedImage} alt="Render" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-neutral-800" />
                    
                    <div className="absolute bottom-4 right-4 flex gap-2">
                       <a href={renderedImage} download={`render_${selectedZone}.png`} className="bg-white text-black p-3 rounded-full hover:bg-gray-200 shadow-xl z-10">
                         <Download size={20} />
                       </a>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-xs border border-white/20 backdrop-blur text-white">
                       Visualizando: {renderGallery.find(r => r.url === renderedImage)?.zone || selectedZone}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-600">
                    <div className="bg-neutral-900/50 p-4 rounded-full inline-block mb-4">
                      <Map size={40} className="opacity-40" />
                    </div>
                    <p className="text-xs md:text-sm">Selecione uma Zona e clique em RENDERIZAR.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* CHAT AREA */}
      <div className="w-full md:w-[350px] lg:w-1/3 h-[40vh] md:h-full flex flex-col border-t md:border-t-0 md:border-r border-neutral-800 bg-neutral-900 order-2 md:order-1 z-10">
        
        <div className="hidden md:flex p-4 border-b border-neutral-800 items-center space-x-3 bg-neutral-800">
          <div className="bg-orange-600 p-2 rounded-lg shadow-lg">
            <ScanLine size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">MarceneiroAI <span className="text-xs font-normal text-orange-400">PLANTA</span></h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 bg-neutral-900/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-xs md:text-sm ${
                msg.role === 'user' 
                  ? 'bg-orange-600 text-white rounded-br-none shadow-sm' 
                  : 'bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700'
              }`}>
                {msg.image && <img src={msg.image} alt="Upload" className="mb-2 rounded-lg max-h-24 object-cover border border-white/10" />}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-neutral-800 text-orange-400 px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs border border-orange-900/30">
                 {isRecording ? <AudioLines size={14} className="animate-pulse text-red-500" /> : <Loader2 size={12} className="animate-spin" />}
                 {loadingStep || (isRecording ? "Gravando áudio..." : "Processando...")}
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 md:p-4 bg-neutral-900 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 p-3 md:p-2.5 rounded-full text-neutral-400 hover:text-white border border-neutral-700 flex-shrink-0">
              <Upload size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isRecording ? "Ouvindo..." : "Digite ou grave..."}
              disabled={isRecording || loading}
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-3 md:py-2.5 text-sm focus:ring-2 focus:ring-orange-600 outline-none text-white min-w-0 transition-all disabled:opacity-50 disabled:bg-neutral-900"
            />

            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={loading && !isRecording}
              className={`p-3 md:p-2.5 rounded-full text-white flex-shrink-0 shadow-lg transition-all ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-900/30' 
                  : 'bg-neutral-700 hover:bg-neutral-600 border border-neutral-600'
              }`}
            >
              {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
            </button>

            <button 
              onClick={handleSendMessage}
              className="bg-orange-600 hover:bg-orange-700 p-3 md:p-2.5 rounded-full text-white disabled:opacity-50 flex-shrink-0 shadow-lg"
              disabled={loading || isRecording}
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
