import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Component Imports
import { Header } from './components/Header';
import { ToolsHubModal } from './components/ToolsHubModal';
import { HistoryPanel } from './components/HistoryPanel';
import { AboutModal } from './components/AboutModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ManagementDashboard } from './components/ManagementDashboard';
import { DistributorPortal } from './components/DistributorPortal';
import { ClientRegistration } from './components/ClientRegistration';
import { ProjectEditor } from './components/ProjectEditor'; 
import { ImageProjectGenerator } from './components/ImageProjectGenerator'; 
import { BomGeneratorModal } from './components/BomGeneratorModal';
import { CuttingPlanGeneratorModal } from './components/CuttingPlanGeneratorModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';
import { EncontraProModal } from './components/EncontraProModal';
import { LiveAssistant } from './components/LiveAssistant';
import { ResearchAssistant } from './components/ResearchAssistant';
import { ARViewer } from './components/ARViewer';
import { AlertNotification, Spinner } from './components/Shared';
import { Smart2DEditor } from './components/Smart2DEditor';
import { getHistory, addProjectToHistory, removeProjectFromHistory } from './services/historyService';
import type { ProjectHistoryItem } from './types';

// --- GLOBAL DECLARATIONS ---
declare var __firebase_config: string | undefined;
declare var __app_id: string | undefined;

// --- FIREBASE INIT ---
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "dummy", authDomain: "dummy", projectId: "dummy" };

// Safe initialization
let app;
let auth;
let db;

try {
    // Only initialize if config looks somewhat valid, or if we accept dummy mode knowing auth might fail
    const isDummy = firebaseConfig.apiKey === "dummy";
    
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Auth component registration check handled by import maps, but explicit check helps debugging
    if (!isDummy) {
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase running in dummy mode. Auth and DB features will be disabled.");
        auth = null;
        db = null;
    }
} catch (e) {
    console.error("Firebase init error:", e);
    // Fallback dummies to prevent crash if init fails completely
    app = null;
    auth = null;
    db = null;
}

// --- APP COMPONENT ---
interface AppProps {
  onLogout: () => void;
  userEmail: string;
  userPlan: string;
}

export default function App({ onLogout, userEmail, userPlan }: AppProps) {
  // Navigation State
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isToolsHubOpen, setIsToolsHubOpen] = useState(true); 
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isPartnerPortalOpen, setIsPartnerPortalOpen] = useState(false);
  
  // Data State
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectHistoryItem | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  
  // UI State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [alert, setAlert] = useState<{ show: boolean, message: string, title?: string }>({ show: false, message: '' });

  const isAdmin = userEmail === 'evaldo0510@gmail.com';
  const isPartner = userPlan === 'partner' || isAdmin;
  const isCarpenter = userPlan !== 'partner'; 

  // --- EFFECTS ---

  useEffect(() => {
    if (!auth) {
        // Only warn if we expected auth to work (not dummy)
        if (firebaseConfig.apiKey !== "dummy") {
             console.warn("Auth not initialized, skipping auth check.");
        }
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
            setFirebaseUser(u);
        } else {
            signInAnonymously(auth).catch(e => console.warn("Firebase auth failed:", e));
        }
    });

    loadHistory();

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // --- HANDLERS ---

  const loadHistory = async () => {
      try {
          const data = await getHistory();
          setHistory(data);
      } catch (e) { console.error(e); }
  };

  const showAlert = (message: string, title = 'Aviso') => {
      setAlert({ show: true, message, title });
      setTimeout(() => setAlert({ show: false, message: '' }), 4000);
  };

  const handleToolSelect = (toolId: string) => {
      setIsToolsHubOpen(false);
      setActiveTool(toolId);
      
      if (['project', 'project_editor', 'smart2d'].includes(toolId)) {
          setCurrentProject(null);
      }
  };

  const handleOpenProject = (project: ProjectHistoryItem) => {
      setCurrentProject(project);
      setIsHistoryOpen(false);
      if (project.views3d.length > 0 || project.image2d) {
          setActiveTool('project_editor'); 
      } else {
          setActiveTool('project_editor');
      }
  };

  const handleDeleteProject = async (id: string) => {
      await removeProjectFromHistory(id);
      loadHistory();
  };

  // --- RENDER HELPERS ---

  const renderActiveTool = () => {
      switch (activeTool) {
          case 'project': 
              return <ImageProjectGenerator isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'project_editor': 
              return <ProjectEditor 
                        initialProject={currentProject} 
                        user={firebaseUser} 
                        db={db} 
                        onBack={() => { setActiveTool(null); loadHistory(); }} 
                     />;
          
          case 'smart2d':
              return <Smart2DEditor isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'bom':
              return <BomGeneratorModal isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'cutting':
              return <CuttingPlanGeneratorModal isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'cost':
              return <CostEstimatorModal isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'encontra':
              return <EncontraProModal isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'live':
              return <LiveAssistant isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'research':
              return <ResearchAssistant isOpen={true} onClose={() => setActiveTool(null)} showAlert={showAlert} />;
          
          case 'ar':
              return <ARViewer isOpen={true} onClose={() => setActiveTool(null)} imageSrc={currentProject?.views3d[0] || ''} showAlert={showAlert} />;

          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] dark:bg-[#2d2424] transition-colors duration-300">
      <Header 
        userEmail={userEmail}
        isAdmin={isAdmin}
        isPartner={isPartner}
        isCarpenter={isCarpenter}
        isStoreOwner={false}
        currentProject={currentProject}
        onOpenToolsHub={() => { setIsToolsHubOpen(true); setActiveTool(null); }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenManagement={() => setIsManagementOpen(true)}
        onOpenPartnerPortal={() => setIsPartnerPortalOpen(true)}
        onConfigureApi={() => setIsSettingsOpen(true)}
        onOpenEncontraPro={() => handleToolSelect('encontra')}
        onOpenLive={() => handleToolSelect('live')}
        onOpenResearch={() => handleToolSelect('research')}
        onOpenDistributors={() => {}} 
        onOpenClients={() => {}} 
        onOpenBomGenerator={() => handleToolSelect('bom')}
        onOpenCuttingPlanGenerator={() => handleToolSelect('cutting')}
        onOpenCostEstimator={() => handleToolSelect('cost')}
        onOpenWhatsapp={() => {}}
        onOpenAutoPurchase={() => {}}
        onOpenEmployeeManagement={() => {}}
        onOpenLearningHub={() => {}}
        onOpenAR={() => handleToolSelect('ar')}
        onOpenWallet={() => {}}
        onOpenProjectGenerator={() => handleToolSelect('project_editor')}
        onOpenStoreMode={() => {}}
        onOpenSmartWorkshop={() => {}}
        onOpenNotifications={() => {}}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
        onOpenAdmin={() => {}}
      />

      <main className="relative flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {!activeTool && !isToolsHubOpen && (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <button 
                        onClick={() => setIsToolsHubOpen(true)}
                        className="bg-[#d4ac6e] text-[#3e3535] px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition"
                    >
                        Abrir Menu de Ferramentas
                    </button>
                </div>
            </div>
        )}

        {renderActiveTool()}

        <ToolsHubModal 
            isOpen={isToolsHubOpen} 
            onClose={() => setIsToolsHubOpen(false)} 
            onSelectTool={(id) => {
                if (id === 'project') handleToolSelect('project_editor'); 
                else handleToolSelect(id);
            }} 
        />

        <HistoryPanel 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            history={history} 
            onViewProject={handleOpenProject}
            onAddNewView={() => {}} 
            onDeleteProject={handleDeleteProject}
        />

        <ManagementDashboard 
            isOpen={isManagementOpen} 
            onClose={() => setIsManagementOpen(false)} 
            onOpenProjectGenerator={() => handleToolSelect('project_editor')}
            onOpenCuttingPlan={() => handleToolSelect('cutting')}
        />

        <DistributorPortal 
            isOpen={isPartnerPortalOpen} 
            onClose={() => setIsPartnerPortalOpen(false)} 
        />

        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        
        <ApiKeyModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} showAlert={showAlert} />

        <AlertNotification 
            show={alert.show} 
            message={alert.message} 
            title={alert.title || ''} 
            onClose={() => setAlert({ ...alert, show: false })} 
        />
      </main>
    </div>
  );
}