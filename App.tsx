import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, MessageSquare, Ruler, Download, Settings, Loader2, Image as ImageIcon, 
  RefreshCcw, ClipboardList, Hammer, Palette, Sun, LayoutTemplate, Sparkles, ChevronUp, 
  Map, Focus, Eye, ScanLine, Mic, Square, AudioLines, Plus, Trash2, ImagePlus, Share2, 
  Edit3, Maximize, Box, Link as LinkIcon, Search, X, ArrowUp, Wand2, Undo2, RotateCcw, 
  SendHorizontal, SlidersHorizontal, Save, LayoutGrid, Home, ChevronRight, Clock, FileText,
  MoreHorizontal, Menu, User, Briefcase, Cloud, LogOut, ChevronLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

/* MarceneiroAI v10.0 - UI/UX Overhaul (Modern SaaS Design)
   Features: Polished UI, Mobile Tabs, Sidebar Navigation, Glassmorphism, Floating Controls.
*/

// --- GLOBAL VARIABLES DECLARATION ---
declare var __firebase_config: string | undefined;
declare var __app_id: string | undefined;
declare var __initial_auth_token: string | undefined;

// --- FIREBASE INIT ---
// Ensure config exists or fallback to dummy to prevent crash on non-configured environments
const firebaseConfig = (typeof __firebase_config !== 'undefined') 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "demo", authDomain: "demo", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- API LAYER ---
const generateContent = async (prompt: string, mediaData: string | null = null, mediaType = "image/png", systemInstruction = "") => {
  const apiKey = process.env.API_KEY; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const parts: any[] = [{ text: prompt }];
  if (mediaData) parts.push({ inlineData: { mimeType: mediaType, data: mediaData } });
  
  const isTextAdaptation = systemInstruction.includes("Adaptador Técnico");
  const isTranscription = prompt.includes("Transcreva");
  
  const payload: any = { 
    contents: [{ parts }], 
    generationConfig: { temperature: isTextAdaptation ? 0.4 : 0.2 }, 
    systemInstruction: { parts: [{ text: systemInstruction }] } 
  };
  
  if (!isTranscription && !isTextAdaptation) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = {
        type: "OBJECT",
        properties: {
          projectType: { type: "STRING" }, dimensions_summary: { type: "STRING" }, ceilingHeight: { type: "NUMBER" }, sketch_fidelity_notes: { type: "STRING" }, 
          palette: { type: "ARRAY", items: { type: "STRING" } }, detected_elements: { type: "ARRAY", items: { type: "STRING" } }, custom_decor: { type: "ARRAY", items: { type: "STRING" } }, 
          components: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING" }, name: { type: "STRING" }, dimensions: { type: "STRING" }, description: { type: "STRING" }, material_focus: { type: "STRING" } } } },
          globalMaterial: { type: "STRING" }, analysis_comment: { type: "STRING" },
          cutlist: { type: "ARRAY", items: { type: "OBJECT", properties: { component_ref: { type: "STRING" }, part: { type: "STRING" }, quantity: { type: "NUMBER" }, width: { type: "NUMBER" }, length: { type: "NUMBER" }, material: { type: "STRING" } } } },
          hardware: { type: "ARRAY", items: { type: "STRING" } }
        }
    };
  }
  
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Sem resposta da IA");
    return (isTranscription || isTextAdaptation) ? text : JSON.parse(text);
  } catch (error) { console.error(error); throw error; }
};

const generateRenderImage = async (prompt: string, inputImageBase64: string | null = null, creativityLevel = 0.55) => {
  const apiKey = process.env.API_KEY;
  let url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  let payload: any = { instances: [{ prompt }], parameters: { sampleCount: 1 } };

  if (inputImageBase64) {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    payload = { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: inputImageBase64 } }] }], generationConfig: { responseModalities: ["IMAGE"], temperature: creativityLevel } };
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      const b64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (b64) return `data:image/png;base64,${b64}`;
    } catch (e) { console.log("Fallback to Imagen"); }
  }
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (data.predictions?.[0]) return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    throw new Error("Falha ao gerar imagem");
  } catch (e) { throw e; }
};

// --- UI Components ---

const SidebarLink: React.FC<{ icon: any; label: string; active?: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-amber-50 text-amber-900 font-semibold shadow-sm border border-amber-100' 
        : 'text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm'
    }`}
  >
    <Icon size={20} className={active ? "text-amber-600" : "text-stone-400"} />
    <span className="text-sm">{label}</span>
  </button>
);

const ProjectCard: React.FC<{ project: any; onClick: (p: any) => void; onDelete: (id: string) => void }> = ({ project, onClick, onDelete }) => (
  <div 
    onClick={() => onClick(project)} 
    className="group relative bg-white rounded-2xl border border-stone-200 hover:border-amber-300 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
  >
    <div className="h-48 bg-stone-100 relative overflow-hidden">
      {project.thumbnail ? (
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-50">
          <Box strokeWidth={1} size={48} className="mb-2" />
          <span className="text-xs font-medium">Sem imagem</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} 
        className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100"
        title="Excluir"
      >
        <Trash2 size={16} />
      </button>
    </div>
    <div className="p-5 flex flex-col flex-1">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-stone-800 line-clamp-1 text-base">{project.name}</h3>
      </div>
      <p className="text-xs text-stone-500 line-clamp-2 mb-4 flex-1">{project.data?.projectType || "Rascunho inicial"}</p>
      <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-3">
        <span className="flex items-center gap-1"><Clock size={12}/> {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'Hoje'}</span>
        <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-full font-medium">{project.data?.components?.length || 0} itens</span>
      </div>
    </div>
  </div>
);

// --- Technical View (Cleaned Up) ---
const TechnicalView = ({ data }: {data: any}) => (
  <div className="w-full h-full bg-stone-50/50 p-4 md:p-8 overflow-y-auto animate-in fade-in duration-500">
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Projeto</span>
             <h2 className="text-2xl font-bold text-stone-800">{data.projectType || "Novo Projeto"}</h2>
          </div>
          <p className="text-sm text-stone-500 max-w-2xl">{data.analysis_comment}</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-center min-w-[100px]">
              <div className="text-[10px] text-stone-400 uppercase font-bold">Pé Direito</div>
              <div className="text-xl font-mono text-stone-700">{data.ceilingHeight || "-"} <span className="text-xs">mm</span></div>
           </div>
           <div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-center min-w-[100px]">
              <div className="text-[10px] text-stone-400 uppercase font-bold">Material</div>
              <div className="text-sm font-medium text-stone-700 truncate max-w-[120px]">{data.globalMaterial?.split(' ')[0]}</div>
           </div>
        </div>
      </div>

      {/* Analysis Tags */}
      {(data.detected_elements?.length > 0 || data.custom_decor?.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {data.detected_elements?.map((el: any, i: number) => <span key={i} className="bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm"><Search size={12} className="text-indigo-500"/> {el}</span>)}
          {data.custom_decor?.map((el: any, i: number) => <span key={i} className="bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm"><Sparkles size={12} className="text-amber-500"/> {el}</span>)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cutlist Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-bold text-stone-800 flex items-center gap-2"><ClipboardList size={18} className="text-amber-600"/> Lista de Corte Estimada</h3>
            <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-1 rounded">IA Beta</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 font-medium text-xs uppercase tracking-wider">
                <tr><th className="px-6 py-3 text-left">Peça</th><th className="px-6 py-3 text-center">Qtd</th><th className="px-6 py-3 text-right">Dimensões (mm)</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {data.cutlist?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-amber-50/30 transition">
                    <td className="px-6 py-3 font-medium text-stone-700">{item.part} <span className="text-stone-400 font-normal ml-1 text-xs">({item.component_ref})</span></td>
                    <td className="px-6 py-3 text-center text-stone-500">{item.quantity}</td>
                    <td className="px-6 py-3 text-right font-mono text-stone-600">{item.length} x {item.width}</td>
                  </tr>
                ))}
                {!data.cutlist?.length && <tr><td colSpan={3} className="p-8 text-center text-stone-400 italic">Nenhum item listado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hardware & Components */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Hammer size={18} className="text-stone-400"/> Ferragens</h3>
              <div className="flex flex-col gap-2">
                {data.hardware?.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {h}
                  </div>
                ))}
                {!data.hardware?.length && <p className="text-stone-400 text-xs italic">Nenhuma ferragem especificada.</p>}
              </div>
           </div>
           
           <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
             <div className="flex items-start gap-3">
               <div className="bg-amber-100 p-2 rounded-lg text-amber-700"><Sparkles size={18}/></div>
               <div>
                 <h4 className="font-bold text-amber-900 text-sm mb-1">Dica de Acabamento</h4>
                 <p className="text-xs text-amber-800/80 leading-relaxed">
                   Para o render {data.globalMaterial}, considere ajustar a iluminação para 'Luz Natural' para realçar a textura dos veios da madeira.
                 </p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Project Editor Logic ---
const ProjectEditor = ({ initialProject, user, onBack }: { initialProject: any, user: any, onBack: () => void }) => {
  // Navigation State
  const [mobileTab, setMobileTab] = useState('visual'); // 'visual', 'technical', 'chat'
  
  const [inputImage, setInputImage] = useState<string | null>(initialProject?.inputImage || null); 
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Chat State
  const [messages, setMessages] = useState<{role: string, text: string, image?: string}[]>([{ role: 'ai', text: `Olá! Estou pronto para trabalhar no projeto "${initialProject?.name || 'Novo'}".` }]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Data State
  const [projectData, setProjectData] = useState<any>(initialProject?.data || { projectType: "", cutlist: [], globalMaterial: "Padrão", ceilingHeight: 2600 });
  const [renderedImage, setRenderedImage] = useState<string | null>(initialProject?.renderedImage || null);
  const [creativity, setCreativity] = useState(0.5);
  
  // UI Controls
  const [showCamera, setShowCamera] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => { if (mobileTab === 'chat' || window.innerWidth >= 768) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, mobileTab]);

  // --- Functions (Saved, Audio, Camera - same logic, polished UI triggers) ---
  const saveProject = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const projectPayload = {
        name: projectData.projectType || "Projeto Sem Título",
        updatedAt: serverTimestamp(),
        thumbnail: renderedImage || inputImage,
        data: projectData,
        inputImage, renderedImage, type: projectData.projectType
      };
      const ref = collection(db, 'artifacts', appId, 'users', user.uid, 'projects');
      if (initialProject?.id) await updateDoc(doc(ref, initialProject.id), projectPayload);
      else await addDoc(ref, projectPayload);
    } catch (e) { alert("Erro ao salvar."); } 
    finally { setIsSaving(false); }
  };

  const handleStartRecording = async () => {
    /* Logic kept same as previous robust implementation */
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder as any;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                processAudioInput(reader.result.split(',')[1]);
            }
        };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (e) { alert("Erro mic."); }
  };
  const handleStopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); setLoading(true); setLoadingStep("Transcrevendo..."); } };
  const processAudioInput = async (b64: string) => {
    try { const txt = await generateContent("Transcreva.", b64, "audio/webm", "Transcreva."); setInputMessage(p => p ? `${p} ${txt}` : txt); }
    catch (e) {} finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if(videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => videoRef.current!.play().catch(e=>{}); }
    } catch(e) { alert("Erro camera"); setShowCamera(false); }
  };
  useEffect(() => { if(showCamera) startCamera(); else (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t=>t.stop()); }, [showCamera]);
  const capturePhoto = () => {
    if(videoRef.current && canvasRef.current) {
      const w = videoRef.current.videoWidth, h = videoRef.current.videoHeight;
      canvasRef.current.width = w; canvasRef.current.height = h;
      canvasRef.current.getContext('2d')?.drawImage(videoRef.current,0,0,w,h);
      handleImageInput(canvasRef.current.toDataURL('image/png'));
      setShowCamera(false);
    }
  };

  const handleImageInput = (dataUrl: string) => {
    const b64 = dataUrl.split(',')[1];
    setInputImage(dataUrl);
    setMessages(prev => [...prev, {role:'user', text: 'Analise esta imagem.', image: dataUrl}]);
    processAnalysis(b64);
  };

  const processAnalysis = async (b64: string) => {
    setLoading(true); setLoadingStep('Analisando geometria...');
    try {
      const data = await generateContent("Analise completa.", b64, "image/png", "Especialista em Marcenaria.");
      setProjectData(data);
      setMobileTab('technical'); // Switch tab on completion
      setMessages(prev => [...prev, {role:'ai', text: `Projeto: ${data.projectType}.`}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro."}]); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if(!inputMessage.trim()) return;
    const txt = inputMessage;
    setMessages(prev => [...prev, {role:'user', text: txt}]);
    setInputMessage('');
    setLoading(true); setLoadingStep('Processando...');
    if (txt.toLowerCase().includes('render') || txt.toLowerCase().includes('foto')) { await handleRender(); return; }
    try {
      const newData = await generateContent(`Edit: ${txt}. Current: ${JSON.stringify(projectData)}`, null, "text/plain", "Editor JSON Técnico.");
      setProjectData(newData);
      setMessages(prev => [...prev, {role:'ai', text: "Feito."}]);
    } catch(e) {} finally { setLoading(false); }
  };

  const handleRender = async () => {
    setLoading(true); setLoadingStep('Renderizando...');
    try {
      const prompt = `Hyper-realistic interior photo of ${projectData.projectType}. ${projectData.globalMaterial}. Decor: ${projectData.custom_decor?.join(', ')}. 8k.`;
      const url = await generateRenderImage(prompt, inputImage?.split(',')[1], creativity);
      setRenderedImage(url);
      setMobileTab('visual'); // Switch to visual tab
      setMessages(prev => [...prev, {role:'ai', text: "Render pronto."}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro render."}]); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-[100dvh] bg-stone-100 font-sans text-stone-800 overflow-hidden">
      
      {/* Fullscreen & Camera Modals */}
      {showCamera && <div className="fixed inset-0 z-50 bg-black flex flex-col"><div className="flex-1 relative"><video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"/><canvas ref={canvasRef} className="hidden"/></div><div className="bg-black/90 p-8 flex justify-center gap-12"><button onClick={()=>setShowCamera(false)} className="bg-stone-800 p-4 rounded-full text-white"><X/></button><button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-stone-400"></button><div className="w-14"/></div></div>}
      {isFullscreen && renderedImage && <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"><button onClick={()=>setIsFullscreen(false)} className="absolute top-4 right-4 text-white"><X size={32}/></button><img src={renderedImage} className="max-w-full max-h-full object-contain"/><a href={renderedImage} download="render.png" className="absolute bottom-8 bg-white text-black px-8 py-3 rounded-full font-bold flex gap-2"><Download/> BAIXAR</a></div>}

      {/* --- DESKTOP: Sidebar Navigation --- */}
      <div className="hidden md:flex w-20 lg:w-64 bg-stone-900 text-stone-400 flex-col border-r border-stone-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-stone-800 gap-3">
          <div className="bg-amber-600 p-1.5 rounded"><ScanLine size={20} className="text-white"/></div>
          <span className="font-bold text-stone-100 hidden lg:block tracking-tight">Marceneiro<span className="text-amber-500">AI</span></span>
        </div>
        <div className="flex-1 py-6 px-3 space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-800 hover:text-white transition"><Home size={20}/><span className="hidden lg:block">Projetos</span></button>
          <div className="h-px bg-stone-800 my-4 mx-3"></div>
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-900/20 text-amber-500 border border-amber-900/30"><Edit3 size={20}/><span className="hidden lg:block font-medium">Editor</span></button>
        </div>
        <div className="p-4 border-t border-stone-800">
           <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-800 hover:text-white transition"><User size={20}/><span className="hidden lg:block text-xs">Perfil</span></button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Desktop Header */}
        <div className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="md:hidden text-stone-500"><ChevronLeft size={24}/></button>
            <h1 className="text-lg font-bold text-stone-800 truncate">{initialProject?.name || "Novo Projeto"}</h1>
            <span className="hidden md:flex px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] rounded uppercase font-bold tracking-wider">{isSaving ? "Salvando..." : "Salvo"}</span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={saveProject} disabled={isSaving} className="hidden md:flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium text-sm px-4 py-2 hover:bg-stone-50 rounded-lg transition"><Save size={18}/> Salvar</button>
             <button onClick={handleRender} disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-amber-900/20 font-bold text-sm flex items-center gap-2 transition transform hover:-translate-y-0.5">
               {loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}
               <span className="hidden md:inline">Gerar Render</span><span className="md:hidden">Render</span>
             </button>
          </div>
        </div>

        {/* WORKSPACE (Mobile: Tabs / Desktop: Split) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* VISUAL & TECHNICAL CANVAS */}
          <div className={`flex-1 bg-stone-100 relative overflow-hidden flex flex-col ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center justify-center p-4 pb-0 gap-4">
               <button onClick={()=>setMobileTab('visual')} className={`px-6 py-2 rounded-t-xl font-bold text-sm transition ${mobileTab === 'visual' ? 'bg-white text-amber-600 border-t border-x border-stone-200 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Visualização 3D</button>
               <button onClick={()=>setMobileTab('technical')} className={`px-6 py-2 rounded-t-xl font-bold text-sm transition ${mobileTab === 'technical' ? 'bg-white text-amber-600 border-t border-x border-stone-200 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Ficha Técnica</button>
            </div>

            <div className="flex-1 relative overflow-y-auto bg-white md:m-4 md:mt-0 md:rounded-b-xl md:rounded-tr-xl md:shadow-sm md:border border-stone-200">
               {/* Content Switcher */}
               {mobileTab === 'technical' && <TechnicalView data={projectData} />}
               
               {mobileTab === 'visual' && (
                 <div className="w-full h-full flex items-center justify-center p-4 bg-stone-100/50">
                    {renderedImage ? (
                      <div className="relative max-w-full max-h-full group">
                        <img src={renderedImage} className="max-h-[70vh] md:max-h-[75vh] w-auto object-contain rounded-lg shadow-xl" />
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={()=>setIsFullscreen(true)} className="bg-white p-3 rounded-full shadow-lg text-stone-700 hover:text-amber-600"><Maximize size={20}/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-10">
                        {inputImage ? (
                          <div className="relative inline-block">
                             <img src={inputImage} className="h-64 object-contain opacity-50 rounded-lg grayscale" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <button onClick={handleRender} className="bg-amber-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition"><RefreshCcw size={18}/> Gerar 3D Agora</button>
                             </div>
                          </div>
                        ) : (
                          <div className="text-stone-300 flex flex-col items-center">
                             <ImageIcon size={64} strokeWidth={1} className="mb-4"/>
                             <p>Tire uma foto ou faça upload para começar</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Floating Controls (Creativity) */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-stone-200 shadow-lg hidden md:block w-64">
                       <div className="flex justify-between text-xs font-bold text-stone-500 mb-2"><span>Fidelidade</span><span>Criatividade</span></div>
                       <input type="range" min="0" max="1" step="0.1" value={creativity} onChange={e=>setCreativity(parseFloat(e.target.value))} className="w-full accent-amber-600 h-1 bg-stone-200 rounded-lg"/>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* DESKTOP SIDEBAR CHAT (Hidden on Mobile unless tab selected) */}
          <div className={`md:w-80 lg:w-96 bg-white border-l border-stone-200 flex flex-col z-30 absolute md:relative inset-0 md:inset-auto ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.image && <img src={msg.image} className="w-24 h-24 object-cover rounded-lg border border-stone-200 mb-2" />}
                    <div className={`max-w-[85%] p-3.5 text-sm leading-relaxed rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && <div className="flex items-center gap-2 text-xs text-stone-400 pl-2"><Loader2 size={12} className="animate-spin"/> {loadingStep}</div>}
                <div ref={chatEndRef}/>
             </div>

             {/* Modern Floating Input */}
             <div className="p-4 bg-white border-t border-stone-100">
                <div className="bg-stone-100 rounded-3xl p-1.5 flex items-center gap-2 border border-transparent focus-within:border-amber-200 focus-within:bg-white focus-within:shadow-md transition-all duration-300">
                   <div className="flex items-center gap-1 pl-1">
                      <label className="p-2 text-stone-400 hover:text-amber-600 hover:bg-stone-100 rounded-full cursor-pointer transition"><Upload size={20}/><input type="file" className="hidden" accept="image/*" onChange={(e)=>{if(e.target.files && e.target.files[0]){const r=new FileReader();r.onload=()=>handleImageInput(r.result as string);r.readAsDataURL(e.target.files[0])}}}/></label>
                      <button onClick={()=>setShowCamera(true)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-stone-100 rounded-full transition"><Camera size={20}/></button>
                   </div>
                   <input 
                     value={inputMessage} 
                     onChange={e=>setInputMessage(e.target.value)} 
                     onKeyDown={e=>e.key==='Enter'&&handleSend()}
                     placeholder="Digite ou fale..." 
                     className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-400 h-10"
                     disabled={loading}
                   />
                   <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`p-2.5 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-amber-600'}`}>
                     {isRecording ? <Square size={18} fill="currentColor"/> : <Mic size={20}/>}
                   </button>
                   <button onClick={handleSend} disabled={!inputMessage.trim()} className="p-2.5 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-500 transition disabled:opacity-50 disabled:shadow-none transform active:scale-90">
                     <SendHorizontal size={20}/>
                   </button>
                </div>
             </div>
          </div>

        </div>

        {/* MOBILE BOTTOM TABS */}
        <div className="md:hidden h-16 bg-white border-t border-stone-200 flex items-center justify-around shrink-0 z-40 pb-safe">
           <button onClick={()=>setMobileTab('visual')} className={`flex flex-col items-center gap-1 ${mobileTab==='visual'?'text-amber-600':'text-stone-400'}`}>
             <Eye size={24} strokeWidth={mobileTab==='visual'?2.5:1.5}/>
             <span className="text-[10px] font-bold">3D</span>
           </button>
           <button onClick={()=>setMobileTab('technical')} className={`flex flex-col items-center gap-1 ${mobileTab==='technical'?'text-amber-600':'text-stone-400'}`}>
             <ScanLine size={24} strokeWidth={mobileTab==='technical'?2.5:1.5}/>
             <span className="text-[10px] font-bold">Técnico</span>
           </button>
           <button onClick={()=>setMobileTab('chat')} className={`flex flex-col items-center gap-1 ${mobileTab==='chat'?'text-amber-600':'text-stone-400'}`}>
             <MessageSquare size={24} strokeWidth={mobileTab==='chat'?2.5:1.5}/>
             <span className="text-[10px] font-bold">Chat</span>
           </button>
        </div>

      </div>
    </div>
  );
};

// --- APP ROOT ---
export const App = () => {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    init();
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        const q = query(collection(db, 'artifacts', appId, 'users', u.uid, 'projects'), orderBy('updatedAt', 'desc'));
        onSnapshot(q, s => { setProjects(s.docs.map(d=>({id:d.id, ...d.data()}))); setLoading(false); });
      } else setLoading(false);
    });
  }, []);

  const deleteProj = async (id: string) => { if(confirm("Excluir?")) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'projects', id)); };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-400"><Loader2 className="animate-spin mb-4" size={40} /><p className="text-sm font-medium">Carregando estúdio...</p></div>;

  if (activeProject) return <ProjectEditor initialProject={activeProject === 'new' ? null : activeProject} user={user} onBack={() => setActiveProject(null)} />;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex w-64 bg-stone-900 text-stone-400 flex-col border-r border-stone-800 sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 gap-3">
          <div className="bg-amber-600 p-2 rounded-lg"><ScanLine size={24} className="text-white"/></div>
          <span className="font-bold text-stone-100 text-lg tracking-tight">Marceneiro<span className="text-amber-500">AI</span></span>
        </div>
        <div className="flex-1 py-8 px-4 space-y-2">
          <SidebarLink icon={Home} label="Meus Projetos" active={true} onClick={()=>{}}/>
          <SidebarLink icon={User} label="Clientes" active={false} onClick={()=>{}}/>
          <SidebarLink icon={Settings} label="Configurações" active={false} onClick={()=>{}}/>
        </div>
        <div className="p-6 border-t border-stone-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-900 flex items-center justify-center text-amber-100 font-bold">{user?.uid?.slice(0,2).toUpperCase()}</div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold text-stone-200 truncate">Marceneiro Pro</p>
                 <p className="text-xs text-stone-600 truncate">Plano Premium</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header Mobile/Desktop */}
        <div className="bg-white border-b border-stone-200 px-6 py-5 md:py-8 flex justify-between items-center sticky top-0 z-20 shadow-sm">
           <div className="lg:hidden flex items-center gap-3">
              <div className="bg-amber-600 p-1.5 rounded"><ScanLine size={20} className="text-white"/></div>
              <span className="font-bold text-stone-900">MarceneiroAI</span>
           </div>
           <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-stone-900">Painel de Controle</h1>
              <p className="text-stone-500 text-sm">Gerencie seus projetos e orçamentos</p>
           </div>
           <button onClick={() => setActiveProject('new')} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 flex items-center gap-2 transition transform hover:scale-105">
             <Plus size={20}/> <span className="hidden md:inline">Novo Projeto</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 mb-6 text-stone-500">
                 <LayoutGrid size={20} />
                 <h2 className="text-sm font-bold uppercase tracking-widest">Projetos Recentes</h2>
              </div>
              
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-stone-200">
                   <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4"><Box size={40} className="text-stone-300"/></div>
                   <h3 className="text-lg font-bold text-stone-700">Comece seu portfólio</h3>
                   <p className="text-stone-400 mb-6 max-w-sm text-center">Crie seu primeiro projeto com inteligência artificial para visualizar e orçar.</p>
                   <button onClick={() => setActiveProject('new')} className="text-amber-600 font-bold hover:underline">Criar Projeto Agora</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projects.map(p => <ProjectCard key={p.id} project={p} onClick={setActiveProject} onDelete={deleteProj} />)}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}