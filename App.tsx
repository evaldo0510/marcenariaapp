import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, MessageSquare, Ruler, Download, Settings, Loader2, Image as ImageIcon, 
  RefreshCcw, ClipboardList, Hammer, Palette, Sun, LayoutTemplate, Sparkles, ChevronUp, 
  Map, Focus, Eye, ScanLine, Mic, Square, AudioLines, Plus, Trash2, ImagePlus, Share2, 
  Edit3, Maximize, Box, Link as LinkIcon, Search, X, ArrowUp, Wand2, Undo2, RotateCcw, 
  Send, SlidersHorizontal, Save, LayoutGrid, Home, ChevronRight, Clock, FileText,
  MoreHorizontal, Menu, User, Briefcase, Cloud, LogOut, ChevronLeft, Calculator, DollarSign,
  PieChart, Tag, Brain, Layers, Star, AlertTriangle, Youtube, CheckCircle2, ZoomIn, Pencil,
  Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc, setDoc, writeBatch } from 'firebase/firestore';

/* MarceneiroAI v16.0 - Database Optimization
   Features: Split Storage Pattern (Lightweight Lists / Heavy Content), User Profiles, Robust Image Saving.
*/

// --- GLOBAL VARIABLES DECLARATION ---
declare var __firebase_config: string | undefined;
declare var __app_id: string | undefined;
declare var __initial_auth_token: string | undefined;

// --- FIREBASE INIT ---
const firebaseConfig = (typeof __firebase_config !== 'undefined') 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "demo", authDomain: "demo", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-800 p-6 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Ops, algo correu mal.</h2>
          <p className="text-stone-500 mb-6">Ocorreu um erro técnico. Tente recarregar a página.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="bg-amber-900 text-white px-6 py-3 rounded-full font-bold shadow-lg">Recarregar Aplicação</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- UTILS ---
const cleanAndParseJson = (text: string) => {
  if (!text) return { projectType: "Erro", analysis_comment: "Sem resposta." };
  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    if (!cleanText) throw new Error("Empty JSON body");
    return JSON.parse(cleanText);
  } catch (e) {
    return {
        projectType: "Erro de Leitura",
        analysis_comment: "A IA não conseguiu formatar a resposta corretamente. Tente simplificar o pedido.",
        cutlist: [],
        hardware: [],
        budget_estimate: {}
    };
  }
};

const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- API LAYER ---
const generateContent = async (prompt: string, mediaData: any = null, mediaType = "image/png", systemInstruction = "") => {
  const apiKey = process.env.API_KEY; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const parts: any[] = [{ text: prompt }];
  
  if (mediaData) {
    try {
      const mediaArray = Array.isArray(mediaData) ? mediaData : [mediaData];
      mediaArray.forEach(media => {
          if (typeof media === 'string' && media.length > 50) { 
              parts.push({ inlineData: { mimeType: mediaType, data: media } });
          }
      });
    } catch (e) { console.warn("Erro ao processar mídia", e); }
  }
  
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
          hardware: { type: "ARRAY", items: { type: "STRING" } },
          budget_estimate: { type: "OBJECT", properties: { suggested_sheet_price: { type: "NUMBER" }, suggested_hardware_total: { type: "NUMBER" }, suggested_labor_days: { type: "NUMBER" }, complexity_level: { type: "STRING" } } }
        }
    };
  }
  
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Sem resposta da IA");
    return (isTranscription || isTextAdaptation) ? text : cleanAndParseJson(text);
  } catch (error) { 
    if (!isTranscription) console.error("Gemini Error:", error);
    return isTranscription ? "Erro na transcrição." : { projectType: "Erro de Conexão", analysis_comment: "Verifique sua internet e tente novamente." };
  }
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
    } catch (e: any) { console.log("Fallback to Imagen due to:", e.message); }
  }
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (data.predictions?.[0]) return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    throw new Error("Nenhuma imagem gerada");
  } catch (e) { throw e; }
};

// --- UI Components ---
const SidebarLink: React.FC<{ icon: any; label: string; active?: boolean; onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-amber-50 text-amber-900 font-semibold shadow-sm border border-amber-100' : 'text-stone-500 hover:bg-white hover:text-stone-900 hover:shadow-sm'}`}>
    <Icon size={20} className={active ? "text-amber-600" : "text-stone-400"} /><span className="text-sm">{label}</span>
  </button>
);

const ProjectCard: React.FC<{ project: any; onClick: (p: any) => void; onDelete: (id: string) => void }> = ({ project, onClick, onDelete }) => (
  <div onClick={() => onClick(project)} className="group relative bg-white rounded-2xl border border-stone-200 hover:border-amber-300 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full">
    <div className="h-48 bg-stone-100 relative overflow-hidden">
      {project.thumbnail ? (
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-50"><Box strokeWidth={1} size={48} className="mb-2" /><span className="text-xs font-medium">Sem imagem</span></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
    </div>
    <div className="p-5 flex flex-col flex-1">
      <h3 className="font-bold text-stone-800 line-clamp-1 text-base mb-2">{project.name}</h3>
      <p className="text-xs text-stone-500 line-clamp-2 mb-4 flex-1">{project.type || "Rascunho inicial"}</p>
      <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-100 pt-3">
        <span className="flex items-center gap-1"><Clock size={12}/> {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'Hoje'}</span>
        <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-full font-medium">{project.type ? "Analítico" : "Visual"}</span>
      </div>
    </div>
  </div>
);

// --- MODAL DE CADASTRO ---
const CompanyRegistrationModal = ({ isOpen, onClose, onSave, isSaving }: any) => {
  const [formData, setFormData] = useState({ companyName: '', phone: '', specialty: 'Móveis Planejados' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="bg-amber-900 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20"><User size={32} /></div>
          <h2 className="text-xl font-bold">Cadastro Profissional</h2>
          <p className="text-amber-200/80 text-sm mt-1">Para salvar projetos, identifique sua marcenaria.</p>
        </div>
        <div className="p-6 space-y-4">
           <div><label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome da Marcenaria</label><input type="text" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-amber-500 transition" placeholder="Ex: Marcenaria Silva" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
           <div><label className="block text-xs font-bold text-stone-500 uppercase mb-1">Telefone</label><input type="text" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-amber-500 transition" placeholder="(11) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
           <div><label className="block text-xs font-bold text-stone-500 uppercase mb-1">Especialidade</label><select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-amber-500 transition" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})}><option>Móveis Planejados</option><option>Móveis Rústicos</option><option>Esquadrias</option></select></div>
        </div>
        <div className="p-6 pt-0 flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-lg text-stone-500 font-bold hover:bg-stone-100 transition">Cancelar</button><button onClick={() => onSave(formData)} disabled={!formData.companyName || isSaving} className="flex-[2] py-3 rounded-lg bg-green-600 text-white font-bold shadow-lg hover:bg-green-500 transition disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2">{isSaving ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18} />} Confirmar</button></div>
      </div>
    </div>
  );
};

// --- ORÇAMENTO ---
const BudgetCalculator = ({ data, onUpdateBudget }: any) => {
  const defaultCosts = { sheetPrice: data.budget_estimate?.suggested_sheet_price || 280, hardwareTotal: data.budget_estimate?.suggested_hardware_total || 0, laborRate: 150, days: data.budget_estimate?.suggested_labor_days || 2, markup: 100 };
  const [costs, setCosts] = useState(data.budget || defaultCosts);
  useEffect(() => { if (data.budget_estimate && !data.budget) setCosts((prev: any) => ({...prev, sheetPrice: data.budget_estimate.suggested_sheet_price || prev.sheetPrice, hardwareTotal: data.budget_estimate.suggested_hardware_total || prev.hardwareTotal, days: data.budget_estimate.suggested_labor_days || prev.days})); }, [data.budget_estimate]);
  const totalAreaM2 = (data.cutlist || []).reduce((acc: number, item: any) => acc + (item.width * item.length * item.quantity) / 1000000, 0);
  const estimatedSheets = Math.ceil(totalAreaM2 / (2.75 * 1.84 * 0.7)); 
  const materialCost = estimatedSheets * costs.sheetPrice;
  const laborCost = costs.laborRate * costs.days;
  const hardwareCost = parseFloat(costs.hardwareTotal);
  const baseCost = materialCost + laborCost + hardwareCost;
  const finalPrice = baseCost * (1 + (costs.markup / 100));
  useEffect(() => { onUpdateBudget({ ...costs, estimatedSheets, totalAreaM2 }); }, [costs]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2"><h3 className="font-bold text-stone-800 flex items-center gap-2"><Calculator size={18} className="text-amber-600"/> Orçamento Inteligente</h3>{data.budget_estimate && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1"><Brain size={10}/> Sugestão IA</span>}</div>
        <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-1 rounded">R$ {finalPrice.toFixed(2)}</span>
      </div>
      <div className="p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
           <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Custos Base</h4>
           <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-stone-600 mb-1">Preço Chapa</label><input type="number" value={costs.sheetPrice} onChange={e => setCosts({...costs, sheetPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm"/></div><div><label className="block text-xs font-medium text-stone-600 mb-1">Qtd. Chapas</label><input type="text" value={`${estimatedSheets} un`} disabled className="w-full px-3 py-1.5 bg-stone-100 border border-stone-200 rounded text-sm text-stone-500"/></div></div>
           <div><label className="block text-xs font-medium text-stone-600 mb-1">Ferragens</label><input type="number" value={costs.hardwareTotal} onChange={e => setCosts({...costs, hardwareTotal: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm"/></div>
           <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-stone-600 mb-1">Diária</label><input type="number" value={costs.laborRate} onChange={e => setCosts({...costs, laborRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm"/></div><div><label className="block text-xs font-medium text-stone-600 mb-1">Dias</label><input type="number" value={costs.days} onChange={e => setCosts({...costs, days: parseFloat(e.target.value) || 0})} className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-sm"/></div></div>
        </div>
        <div className="bg-stone-50 rounded-xl p-5 flex flex-col justify-between"><div className="space-y-2 text-sm text-stone-600"><div className="flex justify-between"><span>Material</span><span>R$ {materialCost.toFixed(2)}</span></div><div className="flex justify-between"><span>Ferragens</span><span>R$ {hardwareCost.toFixed(2)}</span></div><div className="flex justify-between"><span>Mão de Obra</span><span>R$ {laborCost.toFixed(2)}</span></div><div className="h-px bg-stone-200 my-2"></div><div className="flex justify-between font-bold text-stone-800"><span>Custo</span><span>R$ {baseCost.toFixed(2)}</span></div></div><div className="mt-4 pt-4 border-t border-stone-200"><div className="flex justify-between mb-2"><label className="text-xs font-bold text-stone-500">MARGEM {costs.markup}%</label></div><input type="range" min="0" max="300" step="5" value={costs.markup} onChange={e => setCosts({...costs, markup: parseInt(e.target.value)})} className="w-full h-2 bg-stone-200 rounded-lg accent-amber-600"/><div className="mt-4 flex justify-between items-end"><span className="text-sm font-medium text-stone-500">Venda</span><span className="text-2xl font-bold text-stone-900">R$ {finalPrice.toFixed(2)}</span></div></div></div>
      </div>
    </div>
  );
};

const TechnicalView = ({ data, onUpdateBudget }: any) => (
  <div className="w-full h-full bg-stone-50/50 p-4 md:p-8 overflow-y-auto animate-in fade-in duration-500">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between gap-6">
        <div><div className="flex items-center gap-2 mb-2"><span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase">Projeto</span><h2 className="text-2xl font-bold text-stone-800">{data.projectType || "Novo"}</h2></div><p className="text-sm text-stone-500 max-w-2xl">{data.analysis_comment}</p></div>
        <div className="flex gap-4"><div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-center min-w-[100px]"><div className="text-[10px] text-stone-400 uppercase font-bold">Pé Direito</div><div className="text-xl font-mono text-stone-700">{data.ceilingHeight || "-"} <span className="text-xs">mm</span></div></div><div className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-center min-w-[100px]"><div className="text-[10px] text-stone-400 uppercase font-bold">Material</div><div className="text-sm font-medium text-stone-700 truncate max-w-[120px]">{data.globalMaterial?.split(' ')[0]}</div></div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <BudgetCalculator data={data} onUpdateBudget={onUpdateBudget} />
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"><div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50"><h3 className="font-bold text-stone-800 flex items-center gap-2"><ClipboardList size={18} className="text-amber-600"/> Lista de Corte</h3></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-stone-50 text-stone-500 font-medium text-xs uppercase"><tr><th className="px-6 py-3 text-left">Peça</th><th className="px-6 py-3 text-center">Qtd</th><th className="px-6 py-3 text-right">mm</th></tr></thead><tbody className="divide-y divide-stone-50">{data.cutlist?.map((item: any, idx: number) => (<tr key={idx}><td className="px-6 py-3 font-medium text-stone-700">{item.part} <span className="text-stone-400 text-xs">({item.component_ref})</span></td><td className="px-6 py-3 text-center text-stone-500">{item.quantity}</td><td className="px-6 py-3 text-right font-mono text-stone-600">{item.length} x {item.width}</td></tr>))}{!data.cutlist?.length && <tr><td colSpan={3} className="p-8 text-center text-stone-400">Vazio.</td></tr>}</tbody></table></div></div>
        </div>
        <div className="space-y-6">
           {(data.detected_elements?.length > 0 || data.custom_decor?.length > 0) && (<div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5"><h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 mb-4">Visual</h3><div className="flex flex-wrap gap-2">{data.detected_elements?.map((el: any, i: number) => <span key={i} className="bg-stone-50 border border-stone-200 text-stone-600 px-2 py-1 rounded text-xs flex items-center gap-1"><Search size={10} className="text-indigo-500"/> {el}</span>)}{data.custom_decor?.map((el: any, i: number) => <span key={i} className="bg-stone-50 border border-stone-200 text-stone-600 px-2 py-1 rounded text-xs flex items-center gap-1"><Sparkles size={10} className="text-amber-500"/> {el}</span>)}</div></div>)}
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"><h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Hammer size={18} className="text-stone-400"/> Ferragens</h3><div className="flex flex-col gap-2">{data.hardware?.map((h: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm text-stone-600"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {h}</div>))}{!data.hardware?.length && <p className="text-stone-400 text-xs italic">Nenhuma.</p>}</div></div>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN PROJECT EDITOR ---
const ProjectEditor = ({ initialProject, user, userProfile, onBack, onRequestRegistration }: any) => {
  const [mobileTab, setMobileTab] = useState('visual'); 
  const [inputImages, setInputImages] = useState<string[]>(initialProject?.inputImages || (initialProject?.inputImage ? [initialProject.inputImage] : []));
  const [videoLinks, setVideoLinks] = useState<any[]>(initialProject?.videoLinks || []);
  const [mainImageIndex, setMainImageIndex] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [messages, setMessages] = useState<any[]>([{ role: 'ai', text: `Olá! Estou pronto. Envie plantas, fotos ou links de YouTube para criar o projeto.` }]);
  const [inputMessage, setInputMessage] = useState('');
  const [projectData, setProjectData] = useState<any>(initialProject?.data || { projectType: "", cutlist: [], globalMaterial: "Padrão", ceilingHeight: 2600 });
  const [renderedImage, setRenderedImage] = useState<string | null>(initialProject?.renderedImage || null);
  const [creativity, setCreativity] = useState(0.5);
  const [showCamera, setShowCamera] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRenderControls, setShowRenderControls] = useState(false);
  
  // Camera Zoom State
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recordingMimeType = useRef("audio/webm");

  useEffect(() => { if (mobileTab === 'chat' || window.innerWidth >= 768) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, mobileTab]);

  const handleBudgetUpdate = (budgetData: any) => setProjectData((prev: any) => ({ ...prev, budget: budgetData }));

  // --- SAVE WITH SPLIT STORAGE ---
  const saveProject = async () => {
    if (!user) return;
    if (!userProfile) { onRequestRegistration(); return; }
    setIsSaving(true);
    try {
      const projectId = initialProject?.id || doc(collection(db, 'artifacts', appId, 'users', user.uid, 'projects')).id;
      const now = serverTimestamp();
      
      // 1. Heavy content (Images, Full JSON)
      const heavyData = {
         inputImages,
         inputImage: inputImages[0],
         renderedImage,
         videoLinks,
         data: projectData, // Full technical data
         updatedAt: now
      };
      
      // 2. Light metadata (For listing)
      const lightData = {
         id: projectId,
         name: projectData.projectType || "Projeto Sem Título",
         type: projectData.projectType || "Rascunho",
         updatedAt: now,
         thumbnail: renderedImage || inputImages[0] // We keep one thumb for list
      };

      // Save using Split Pattern
      const projectRef = doc(db, 'artifacts', appId, 'users', user.uid, 'projects', projectId);
      const contentRef = doc(db, 'artifacts', appId, 'users', user.uid, 'project_contents', projectId);

      const batch = writeBatch(db);
      batch.set(projectRef, lightData, { merge: true });
      batch.set(contentRef, heavyData, { merge: true });
      await batch.commit();

    } catch (e) { console.error(e); alert("Erro ao salvar."); } finally { setIsSaving(false); }
  };

  // --- AUDIO & CAMERA (ROBUST + ZOOM) ---
  const handleStartRecording = async () => { try { const s = await navigator.mediaDevices.getUserMedia({audio:true}); let m = MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'audio/mp4'; if(!MediaRecorder.isTypeSupported(m)) m=''; const r = new MediaRecorder(s, m?{mimeType:m}:{}); mediaRecorderRef.current=r; const c: any[]=[]; r.ondataavailable=e=>{if(e.data.size>0)c.push(e.data)}; r.onstop=()=>{const b=new Blob(c,{type:m||'audio/webm'}); const fr=new FileReader(); fr.readAsDataURL(b); fr.onloadend=()=>{if(typeof fr.result === 'string') processAudioInput(fr.result.split(',')[1])}; s.getTracks().forEach(t=>t.stop())}; r.start(); setIsRecording(true); } catch(e){alert("Erro mic.");} }; 
  const handleStopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); setLoading(true); setLoadingStep("Transcrevendo..."); } };
  const processAudioInput = async (b64: string) => { try { const txt = await generateContent("Transcreva.", [b64], recordingMimeType.current, "Transcreva áudio para texto."); setInputMessage(p => p ? `${p} ${txt}` : txt); } catch (e) {} finally { setLoading(false); } };
  
  const startCamera = async () => { 
    try { 
      let stream; 
      try {stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment', zoom: true} as any});} catch {stream = await navigator.mediaDevices.getUserMedia({video:true});} 
      
      if(videoRef.current){
        videoRef.current.srcObject=stream;
        videoRef.current.onloadedmetadata=()=>videoRef.current!.play().catch(e=>{});
        
        // Detect Zoom Capabilities
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
            const capabilities = (track as any).getCapabilities();
            if (capabilities.zoom) {
                setZoomCapabilities({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step });
                setZoom(capabilities.zoom.min);
            } else { setZoomCapabilities(null); }
        }
      } 
    } catch(e){ alert("Erro camera"); setShowCamera(false); } 
  };
  
  const handleCameraZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = parseFloat(e.target.value);
     setZoom(value);
     if (videoRef.current && videoRef.current.srcObject) {
         const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
         if (track && 'applyConstraints' in track) (track as any).applyConstraints({ advanced: [{ zoom: value }] }).catch((err: any) => console.log('Zoom não suportado', err));
     }
  };

  useEffect(() => { if(showCamera) startCamera(); else (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t=>t.stop()); }, [showCamera]);
  const capturePhoto = () => { if(videoRef.current && canvasRef.current) { const w=videoRef.current.videoWidth,h=videoRef.current.videoHeight; canvasRef.current.width=w; canvasRef.current.height=h; canvasRef.current.getContext('2d')?.drawImage(videoRef.current,0,0,w,h); handleImageInput(canvasRef.current.toDataURL('image/png')); setShowCamera(false); } };

  // --- LOGIC ---
  const handleImageInput = (dataUrl: string) => {
    const newImages = [...inputImages, dataUrl];
    setInputImages(newImages);
    if (newImages.length === 1) setMainImageIndex(0);
    setMessages(prev => [...prev, {role:'user', text: `Ref #${newImages.length} adicionada.`, image: dataUrl}]);
    processAnalysis(newImages, videoLinks);
  };
  const handleVideoLink = (url: string) => {
    const videoId = extractYoutubeId(url);
    if (!videoId) { alert("Link inválido."); return; }
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const newVideos = [...videoLinks, {id: videoId, url: url, thumb: thumbUrl}];
    setVideoLinks(newVideos);
    setMessages(prev => [...prev, {role:'user', text: `Vídeo adicionado: ${url}`}]);
    setShowYoutubeInput(false);
    processAnalysis(inputImages, newVideos);
  };
  const processAnalysis = async (imagesArray: string[], videosArray: any[]) => {
    setLoading(true); setLoadingStep(`Analisando contexto...`);
    const mediaPayload = imagesArray.map(img => img.split(',')[1]);
    const videoContext = videosArray.map(v => `Ref Vídeo: ${v.url}`).join("\n");
    try {
      const data: any = await generateContent("Analise completa.", mediaPayload, "image/png", `Especialista. ENTRADAS: ${imagesArray.length} imgs, ${videosArray.length} videos. ${videoContext}. SAÍDA: Lista de Corte, Orçamento, Materiais.`);
      setProjectData((prev: any) => ({...data, budget: prev.budget})); 
      setMobileTab('technical'); 
      setMessages(prev => [...prev, {role:'ai', text: `Projeto Integrado: ${data.projectType}.`}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro na análise. Tente novamente."}]); }
    finally { setLoading(false); }
  };
  
  // -- SKETCH & RENDER --
  const handleSketch = async () => {
    if (!inputImages || inputImages.length === 0) { alert("Adicione uma imagem base."); return; }
    setLoading(true); setLoadingStep('Gerando rascunho técnico...');
    try {
      const structuralGuide = inputImages[mainImageIndex]?.split(',')[1];
      const prompt = `Technical architectural sketch of ${projectData.projectType}. Line drawing, blueprint style, white background, black lines. Precise geometry, showing dimensions and structure. No shading, high contrast, clean lines.`;
      const url = await generateRenderImage(prompt, structuralGuide, 0.4);
      setRenderedImage(url);
      setMobileTab('visual'); 
      setMessages(prev => [...prev, {role:'ai', text: "Rascunho técnico gerado."}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro ao gerar rascunho."}]); }
    finally { setLoading(false); }
  };

  const handleRender = async () => {
    if (!inputImages || inputImages.length === 0) { alert("Adicione uma imagem base."); return; }
    if (!userProfile) { onRequestRegistration(); return; } 
    setLoading(true); setLoadingStep('Renderizando...');
    try {
      const structuralGuide = inputImages[mainImageIndex]?.split(',')[1];
      const videoStylePrompt = videoLinks.length > 0 ? "Style from YouTube refs." : "";
      const prompt = `Hyper-realistic interior photo of ${projectData.projectType}. ${projectData.globalMaterial}. ${videoStylePrompt} Decor: ${projectData.custom_decor?.join(', ')}. 8k.`;
      const url = await generateRenderImage(prompt, structuralGuide, creativity);
      setRenderedImage(url);
      setMobileTab('visual'); 
      setMessages(prev => [...prev, {role:'ai', text: "Render pronto."}]);
    } catch(e) { setMessages(prev => [...prev, {role:'ai', text: "Erro render."}]); }
    finally { setLoading(false); }
  };
  const handleSend = async () => {
    if(showYoutubeInput) { handleVideoLink(inputMessage); setInputMessage(''); return; }
    if(!inputMessage.trim()) return;
    const txt = inputMessage;
    setMessages(prev => [...prev, {role:'user', text: txt}]);
    setInputMessage('');
    setLoading(true); setLoadingStep('Processando...');
    if (txt.toLowerCase().includes('render') || txt.toLowerCase().includes('foto')) { await handleRender(); return; }
    if (txt.toLowerCase().includes('rascunho') || txt.toLowerCase().includes('desenho')) { await handleSketch(); return; }
    try {
      const newData = await generateContent(`Edit: ${txt}. Current: ${JSON.stringify(projectData)}`, null, "text/plain", "Editor JSON Técnico.");
      setProjectData(newData);
      setMessages(prev => [...prev, {role:'ai', text: "Feito."}]);
    } catch(e) {} finally { setLoading(false); }
  };
  const removeImage = (index: number) => {
    const newImages = inputImages.filter((_, i) => i !== index);
    setInputImages(newImages);
    if (mainImageIndex >= index && mainImageIndex > 0) setMainImageIndex(mainImageIndex - 1);
  };

  return (
    <div className="flex h-[100dvh] bg-stone-100 font-sans text-stone-800 overflow-hidden">
      {/* Modals */}
      {showCamera && <div className="fixed inset-0 z-50 bg-black flex flex-col"><div className="flex-1 relative"><video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"/><canvas ref={canvasRef} className="hidden"/>{zoomCapabilities && <div className="absolute bottom-32 left-0 w-full flex justify-center px-8"><input type="range" min={zoomCapabilities.min} max={zoomCapabilities.max} step={zoomCapabilities.step} value={zoom} onChange={handleCameraZoom} className="w-full accent-white h-1 bg-white/30 rounded-lg appearance-none cursor-pointer" /></div>}</div><div className="bg-black/90 p-8 flex justify-center gap-12"><button onClick={()=>setShowCamera(false)} className="bg-stone-800 p-4 rounded-full text-white"><X/></button><button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-stone-400"></button><div className="w-14"/></div></div>}
      {isFullscreen && renderedImage && <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"><button onClick={()=>setIsFullscreen(false)} className="absolute top-4 right-4 text-white"><X size={32}/></button><img src={renderedImage} className="max-w-full max-h-full object-contain"/><a href={renderedImage} download="render.png" className="absolute bottom-8 bg-white text-black px-8 py-3 rounded-full font-bold flex gap-2"><Download/> BAIXAR</a></div>}

      {/* --- DESKTOP: Sidebar --- */}
      <div className="hidden md:flex w-20 lg:w-64 bg-stone-900 text-stone-400 flex-col border-r border-stone-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-stone-800 gap-3"><div className="bg-amber-600 p-1.5 rounded"><ScanLine size={20} className="text-white"/></div><span className="font-bold text-stone-100 hidden lg:block tracking-tight">Marceneiro<span className="text-amber-500">AI</span></span></div>
        <div className="flex-1 py-6 px-3 space-y-2"><button onClick={onBack} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-800 hover:text-white transition"><Home size={20}/><span className="hidden lg:block">Projetos</span></button><div className="h-px bg-stone-800 my-4 mx-3"></div><button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-900/20 text-amber-500 border border-amber-900/30"><Edit3 size={20}/><span className="hidden lg:block font-medium">Editor</span></button></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <div className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4"><button onClick={onBack} className="md:hidden text-stone-500"><ChevronLeft size={24}/></button><h1 className="text-lg font-bold text-stone-800 truncate">{initialProject?.name || "Novo Projeto"}</h1><span className="hidden md:flex px-2 py-0.5 bg-stone-100 text-stone-500 text-[10px] rounded uppercase font-bold tracking-wider">{isSaving ? "Salvando..." : "Salvo"}</span></div>
          <div className="flex items-center gap-3">
             <button onClick={saveProject} disabled={isSaving} className="hidden md:flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium text-sm px-4 py-2 hover:bg-stone-50 rounded-lg transition"><Save size={18}/> Salvar</button>
             {/* New Sketch Button */}
             <button onClick={handleSketch} disabled={loading} className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition"><Pencil size={16}/><span className="hidden md:inline">Rascunho</span></button>
             <button onClick={handleRender} disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-amber-900/20 font-bold text-sm flex items-center gap-2 transition transform hover:-translate-y-0.5">{loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}<span className="hidden md:inline">Gerar Render</span><span className="md:hidden">Render</span></button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <div className={`flex-1 bg-stone-100 relative overflow-hidden flex flex-col ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            <div className="hidden md:flex items-center justify-center p-4 pb-0 gap-4">
               <button onClick={()=>setMobileTab('visual')} className={`px-6 py-2 rounded-t-xl font-bold text-sm transition ${mobileTab === 'visual' ? 'bg-white text-amber-600 border-t border-x border-stone-200 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Visualização 3D</button>
               <button onClick={()=>setMobileTab('technical')} className={`px-6 py-2 rounded-t-xl font-bold text-sm transition ${mobileTab === 'technical' ? 'bg-white text-amber-600 border-t border-x border-stone-200 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Ficha Técnica & Orçamento</button>
            </div>
            <div className="flex-1 relative overflow-y-auto bg-white md:m-4 md:mt-0 md:rounded-b-xl md:rounded-tr-xl md:shadow-sm md:border border-stone-200">
               {mobileTab === 'technical' && <TechnicalView data={projectData} onUpdateBudget={handleBudgetUpdate} />}
               {mobileTab === 'visual' && (
                 <div className="w-full h-full flex items-center justify-center p-4 bg-stone-100/50">
                    {renderedImage ? (
                      <div className="relative max-w-full max-h-full group"><img src={renderedImage} className="max-h-[70vh] md:max-h-[75vh] w-auto object-contain rounded-lg shadow-xl" /><div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>setIsFullscreen(true)} className="bg-white p-3 rounded-full shadow-lg text-stone-700 hover:text-amber-600"><Maximize size={20}/></button></div></div>
                    ) : (
                      <div className="text-center p-10">{inputImages.length > 0 ? (<div className="flex flex-col items-center"><div className="relative inline-block mb-4"><img src={inputImages[mainImageIndex]} className="h-48 object-contain opacity-70 rounded-lg grayscale shadow-inner" /><span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase shadow">Referência Principal</span></div><p className="text-stone-400 mb-4 text-sm">{inputImages.length} imagens. Clique em Render.</p><div className="flex gap-2"><button onClick={handleSketch} className="bg-stone-200 text-stone-700 px-6 py-3 rounded-full font-bold shadow-md hover:bg-stone-300 transition flex gap-2"><Pencil size={18}/> Rascunho</button><button onClick={handleRender} className="bg-amber-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition"><RefreshCcw size={18}/> Render</button></div></div>) : (<div className="text-stone-300 flex flex-col items-center"><ImageIcon size={64} strokeWidth={1} className="mb-4"/><p>Adicione referências para começar</p></div>)}</div>
                    )}
                    
                    {/* Collapsible Controls (FIXED) */}
                    {showRenderControls ? (
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-4 rounded-xl border border-stone-200 shadow-xl w-64 z-10 transition-all animate-in fade-in slide-in-from-bottom-2">
                           <div className="flex justify-between items-center mb-3 border-b border-stone-100 pb-2">
                              <span className="text-xs font-bold text-stone-600 uppercase tracking-wide flex items-center gap-1"><SlidersHorizontal size={12}/> Ajustes</span>
                              <button onClick={() => setShowRenderControls(false)} className="text-stone-400 hover:text-red-500 transition p-1 hover:bg-stone-100 rounded-full"><X size={14} /></button>
                           </div>
                           <div className="space-y-4">
                               <div>
                                  <div className="flex justify-between text-[10px] font-bold text-stone-400 mb-1"><span>Fidelidade (Desenho)</span><span>Criatividade (IA)</span></div>
                                  <input type="range" min="0" max="1" step="0.1" value={creativity} onChange={e=>setCreativity(parseFloat(e.target.value))} className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer"/>
                               </div>
                           </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowRenderControls(true)} className="absolute bottom-4 left-4 bg-white p-3 rounded-full shadow-lg text-stone-600 hover:text-amber-600 border border-stone-200 z-10 hover:scale-105 transition-transform" title="Ajustes de Render"><SlidersHorizontal size={20} /></button>
                    )}
                 </div>
               )}
            </div>
          </div>

          <div className={`md:w-80 lg:w-96 bg-white border-l border-stone-200 flex flex-col z-30 absolute md:relative inset-0 md:inset-auto ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
             <div className="p-3 border-b border-stone-100 bg-stone-50 overflow-x-auto whitespace-nowrap flex gap-2 shrink-0">
                {videoLinks.map((v, idx) => (<div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-red-200 flex-shrink-0"><img src={v.thumb} className="w-full h-full object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-black/20"><Youtube size={12} className="text-white"/></div></div>))}
                {inputImages.map((img, idx) => (<div key={idx} onClick={() => setMainImageIndex(idx)} className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 flex-shrink-0 transition-all ${mainImageIndex === idx ? 'border-amber-500 scale-105 shadow-md' : 'border-stone-200 opacity-60 hover:opacity-100'}`}><img src={img} className="w-full h-full object-cover" /><button onClick={(e) => {e.stopPropagation(); removeImage(idx)}} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md hover:bg-red-600"><X size={10}/></button></div>))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 cursor-pointer hover:border-amber-400 hover:text-amber-500 transition flex-shrink-0"><Plus size={20} /><input type="file" className="hidden" accept="image/*" onChange={(e)=>{if(e.target.files && e.target.files[0]){const r=new FileReader();r.onload=()=>handleImageInput(r.result as string);r.readAsDataURL(e.target.files[0])}}}/></label>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30">
                {messages.map((msg, i) => (<div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>{msg.image && <img src={msg.image} className="w-24 h-24 object-cover rounded-lg border border-stone-200 mb-2" />}<div className={`max-w-[85%] p-3.5 text-sm leading-relaxed rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'}`}>{msg.text}</div></div>))}
                {loading && <div className="flex items-center gap-2 text-xs text-stone-400 pl-2"><Loader2 size={12} className="animate-spin"/> {loadingStep}</div>}<div ref={chatEndRef}/>
             </div>
             <div className="p-4 bg-white border-t border-stone-100"><div className="bg-stone-100 rounded-3xl p-1.5 flex items-center gap-2 border border-transparent focus-within:border-amber-200 focus-within:bg-white focus-within:shadow-md transition-all duration-300"><div className="flex items-center gap-1 pl-1"><button onClick={()=>setShowYoutubeInput(!showYoutubeInput)} className="p-2 text-red-500 hover:bg-stone-100 rounded-full transition"><Youtube size={20}/></button><button onClick={()=>setShowCamera(true)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-stone-100 rounded-full transition"><Camera size={20}/></button></div><input value={inputMessage} onChange={e=>setInputMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder={showYoutubeInput ? "Cole o link do YouTube..." : "Digite..."} className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-400 h-10" disabled={loading}/><button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`p-2.5 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-amber-600'}`}>{isRecording ? <Square size={18} fill="currentColor"/> : <Mic size={20}/>}</button><button onClick={handleSend} disabled={!inputMessage.trim()} className="p-2.5 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-500 transition disabled:opacity-50 disabled:shadow-none transform active:scale-90"><Send size={20}/></button></div></div>
          </div>
        </div>
        <div className="md:hidden h-16 bg-white border-t border-stone-200 flex items-center justify-around shrink-0 z-40 pb-safe"><button onClick={()=>setMobileTab('visual')} className={`flex flex-col items-center gap-1 ${mobileTab==='visual'?'text-amber-600':'text-stone-400'}`}><Eye size={24} strokeWidth={mobileTab==='visual'?2.5:1.5}/><span className="text-[10px] font-bold">3D</span></button><button onClick={()=>setMobileTab('technical')} className={`flex flex-col items-center gap-1 ${mobileTab==='technical'?'text-amber-600':'text-stone-400'}`}><ClipboardList size={24} strokeWidth={mobileTab==='technical'?2.5:1.5}/><span className="text-[10px] font-bold">Orçamento</span></button><button onClick={()=>setMobileTab('chat')} className={`flex flex-col items-center gap-1 ${mobileTab==='chat'?'text-amber-600':'text-stone-400'}`}><MessageSquare size={24} strokeWidth={mobileTab==='chat'?2.5:1.5}/><span className="text-[10px] font-bold">Chat</span></button></div>
      </div>
    </div>
  );
}