
import React, { useState, useEffect, useMemo } from 'react';
import { FinanceModule } from './FinanceModule';
import { InventoryModule } from './InventoryModule';
import { KanbanBoard } from './KanbanBoard';
import { PricingCalculator } from './PricingCalculator';
import { SupplierManagement } from './SupplierManagement';
import { SystemSettings } from './SystemSettings';
import { QuotationSystem } from './QuotationSystem';
import { MaterialsCatalog } from './MaterialsCatalog';
import { 
    ChartBarIcon, 
    CurrencyDollarIcon, 
    ClipboardListIcon, 
    ViewBoardsIcon, 
    CalculatorIcon, 
    TruckIcon, 
    CogIcon,
    CatalogIcon,
    ReceiptIcon,
    SparklesIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    AlertCircleIcon,
    PlusIcon
} from './Shared';
import { getHistory, getInventory, getTransactions } from '../services/historyService';
import type { ProjectHistoryItem, InventoryItem, Transaction } from '../types';

interface ManagementDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModuleTab = 'dashboard' | 'finance' | 'inventory' | 'kanban' | 'pricing' | 'suppliers' | 'settings' | 'quotations' | 'catalog';

// --- AI ASSISTANT COMPONENT ---
const AIAssistant: React.FC<{ projects: ProjectHistoryItem[], inventory: InventoryItem[], transactions: Transaction[] }> = ({ projects, inventory, transactions }) => {
  const insights = useMemo(() => {
    const tips: { type: 'urgent' | 'warning' | 'success' | 'opportunity' | 'info'; title: string; message: string }[] = [];
    
    // 1. Análise de Estoque
    const lowStock = inventory.filter(i => i.quantity <= i.minStock);
    if (lowStock.length > 0) {
      tips.push({
        type: 'urgent',
        title: '🚨 Reposição de Estoque Urgente',
        message: `Identifiquei ${lowStock.length} itens críticos. Você precisa comprar: ${lowStock.map(i => i.name).join(', ')} para evitar paradas na produção.`
      });
    }

    // 2. Análise Financeira
    const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
    
    if (expense > income && income > 0) {
       tips.push({
         type: 'warning',
         title: '⚠️ Fluxo de Caixa Negativo',
         message: 'Atenção! Suas saídas superaram as entradas este mês. Verifique gastos desnecessários ou cobre clientes inadimplentes.'
       });
    } else if (income > 0 && (income - expense) / income < 0.2) {
       tips.push({
         type: 'info', 
         title: '📉 Margem de Lucro Apertada',
         message: `Sua margem atual é de apenas ${(((income - expense) / income) * 100).toFixed(1)}%. Considere revisar a precificação na Calculadora para aumentar seus ganhos.`
       });
    }

    // 3. Análise de Projetos (Gargalos)
    const doing = projects.filter(p => p.status === 'producao' || p.status === 'montagem').length;

    if (doing > 3) {
      tips.push({
        type: 'warning',
        title: '🚧 Gargalo na Produção',
        message: `Você tem ${doing} projetos em andamento ao mesmo tempo. Evite iniciar novos trabalhos da coluna "Em Orçamento" para garantir a qualidade e o prazo dos atuais.`
      });
    }
    
    // 4. Dica de Faturamento (Oportunidade)
    // Assuming projectValue is available, otherwise ignoring
    const potentialRevenue = projects.reduce((acc, p) => acc + (p.status !== 'finalizado' ? Number(p.projectValue || 0) : 0), 0);
    if (potentialRevenue > 0) {
        tips.push({
            type: 'opportunity',
            title: '💰 Receita Potencial',
            message: `Você tem ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(potentialRevenue)} em projetos abertos. Foque em concluir os itens em andamento para liberar esse caixa.`
        });
    }

    if (tips.length === 0) {
      tips.push({
        type: 'success',
        title: '✨ Tudo Organizado!',
        message: 'Seus indicadores estão ótimos. O fluxo de caixa está positivo e o estoque controlado. Continue assim!'
      });
    }

    return tips;
  }, [projects, inventory, transactions]);

  return (
    <div className="mb-8 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
            <SparklesIcon className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Assistente Inteligente</h2>
            <p className="text-indigo-100 opacity-90 text-sm">Analiso seus dados em tempo real para sugerir melhorias na sua organização.</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid gap-4">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-4 rounded-lg border-l-4 transition-all hover:translate-x-1 shadow-sm ${
            insight.type === 'urgent' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
            insight.type === 'warning' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20' :
            insight.type === 'success' ? 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
            insight.type === 'opportunity' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20' :
            'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          }`}>
             <h3 className={`font-bold text-lg mb-1 flex items-center gap-2 ${
                insight.type === 'urgent' ? 'text-red-700 dark:text-red-400' :
                insight.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                insight.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' :
                insight.type === 'opportunity' ? 'text-blue-700 dark:text-blue-400' :
                'text-indigo-700 dark:text-indigo-400'
             }`}>
                {insight.title}
             </h3>
             <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- DASHBOARD OVERVIEW COMPONENT ---
const DashboardOverview: React.FC<{ 
    setActiveTab: (tab: ModuleTab) => void,
    projects: ProjectHistoryItem[], 
    inventory: InventoryItem[], 
    transactions: Transaction[] 
}> = ({ setActiveTab, projects, inventory, transactions }) => {
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const receita = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
    const despesa = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const lowStock = inventory.filter(i => i.quantity <= i.minStock);
    const activeProjects = projects.filter(p => p.status && p.status !== 'finalizado').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">Visão Geral</h2>
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <SparklesIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">IA Ativa</span>
                </div>
            </div>

            {/* AI Assistant Section */}
            <AIAssistant projects={projects} inventory={inventory} transactions={transactions} />

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border-l-4 border-l-emerald-500 shadow-sm border border-gray-200 dark:border-[#4a4040]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Receitas (Total)</p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(receita)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <TrendingUpIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border-l-4 border-l-red-500 shadow-sm border border-gray-200 dark:border-[#4a4040]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Despesas (Total)</p>
                            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(despesa)}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <TrendingDownIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border-l-4 border-l-blue-500 shadow-sm border border-gray-200 dark:border-[#4a4040]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo</p>
                            <h3 className={`text-2xl font-bold ${receita - despesa >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
                                {formatCurrency(receita - despesa)}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts */}
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h3 className="font-semibold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                        <AlertCircleIcon className="text-amber-500 w-5 h-5"/>
                        Atenção Necessária
                    </h3>
                    <div className="space-y-3">
                        {lowStock.length > 0 ? (
                            lowStock.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                                    <span>Estoque baixo: <strong>{item.name}</strong></span>
                                    <span className="font-bold">{item.quantity} {item.unit}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic">Nenhum alerta de estoque.</p>
                        )}
                        {activeProjects > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                                <span>Projetos em andamento</span>
                                <span className="font-bold">{activeProjects}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h3 className="font-semibold text-[#3e3535] dark:text-[#f5f1e8] mb-4">Acesso Rápido</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab('quotations')} className="p-4 bg-gray-50 dark:bg-[#2d2424] hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] rounded-xl border border-gray-200 dark:border-[#5a4f4f] text-center transition-colors group">
                            <PlusIcon className="mx-auto mb-2 text-blue-600 dark:text-blue-400 w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Nova Cotação</span>
                        </button>
                        <button onClick={() => setActiveTab('inventory')} className="p-4 bg-gray-50 dark:bg-[#2d2424] hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] rounded-xl border border-gray-200 dark:border-[#5a4f4f] text-center transition-colors group">
                            <ClipboardListIcon className="mx-auto mb-2 text-emerald-600 dark:text-emerald-400 w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Entrada Estoque</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<ModuleTab>('dashboard');
    
    // State for shared data across tabs (fetched from IndexedDB)
    const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [p, i, t] = await Promise.all([
                        getHistory(),
                        getInventory(),
                        getTransactions()
                    ]);
                    setProjects(p);
                    setInventory(i);
                    setTransactions(t);
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                }
            };
            fetchData();
        }
    }, [isOpen, activeTab]); // Refresh data when tab changes to keep it somewhat fresh

    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'finance': return <FinanceModule />;
            case 'inventory': return <InventoryModule />;
            case 'kanban': return <KanbanBoard />;
            case 'pricing': return <PricingCalculator />;
            case 'suppliers': return <SupplierManagement />;
            case 'settings': return <SystemSettings />;
            case 'quotations': return <QuotationSystem />;
            case 'catalog': return <MaterialsCatalog />;
            case 'dashboard':
            default:
                return <DashboardOverview setActiveTab={setActiveTab} projects={projects} inventory={inventory} transactions={transactions} />;
        }
    };

    const NavButton: React.FC<{ tab: ModuleTab; icon: any; label: string }> = ({ tab, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 md:w-full flex flex-col md:flex-row items-center gap-2 md:gap-3 px-4 py-3 rounded-lg mb-1 transition-colors text-xs md:text-sm whitespace-nowrap ${activeTab === tab ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            <Icon className="w-5 h-5 md:w-5 md:h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-[#2d2424] z-50 flex flex-col md:flex-row animate-fadeIn h-full overflow-hidden">
            {/* Sidebar / Top Nav */}
            <aside className="w-full md:w-64 bg-[#fffefb] dark:bg-[#3e3535] border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#4a4040] flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-[#4a4040] flex justify-between items-center md:block">
                    <h2 className="text-lg md:text-xl font-bold text-[#b99256] flex items-center gap-2">
                        <ChartBarIcon /> <span className="hidden md:inline">Gestão PRO</span> <span className="md:hidden">Gestão</span>
                    </h2>
                    <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800 dark:hover:text-white px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
                        Fechar
                    </button>
                </div>
                <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 custom-scrollbar">
                    <NavButton tab="dashboard" icon={ChartBarIcon} label="Visão Geral" />
                    <div className="hidden md:block my-2 border-t border-gray-100 dark:border-gray-700"></div>
                    
                    {/* Mobile Separator */}
                    <div className="w-px h-8 bg-gray-200 mx-2 md:hidden"></div>

                    <p className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Produção</p>
                    <NavButton tab="kanban" icon={ViewBoardsIcon} label="Kanban" />
                    <NavButton tab="quotations" icon={ReceiptIcon} label="Cotações" />
                    <NavButton tab="pricing" icon={CalculatorIcon} label="Preços" />
                    
                    {/* Mobile Separator */}
                    <div className="w-px h-8 bg-gray-200 mx-2 md:hidden"></div>

                    <p className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Recursos</p>
                    <NavButton tab="inventory" icon={ClipboardListIcon} label="Estoque" />
                    <NavButton tab="catalog" icon={CatalogIcon} label="Catálogo" />
                    <NavButton tab="suppliers" icon={TruckIcon} label="Fornec." />
                    
                    {/* Mobile Separator */}
                    <div className="w-px h-8 bg-gray-200 mx-2 md:hidden"></div>

                    <p className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Admin</p>
                    <NavButton tab="finance" icon={CurrencyDollarIcon} label="Financeiro" />
                    <NavButton tab="settings" icon={CogIcon} label="Config." />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-full overflow-hidden">
                <header className="h-14 md:h-16 bg-[#fffefb] dark:bg-[#3e3535] border-b border-gray-200 dark:border-[#4a4040] flex justify-between items-center px-4 md:px-6 flex-shrink-0">
                    <h1 className="text-base md:text-lg font-bold text-gray-800 dark:text-white capitalize">
                        {activeTab === 'dashboard' ? 'Visão Geral' : activeTab}
                    </h1>
                    <button onClick={onClose} className="hidden md:block text-gray-500 hover:text-gray-800 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        Voltar ao App
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto p-4 md:p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
