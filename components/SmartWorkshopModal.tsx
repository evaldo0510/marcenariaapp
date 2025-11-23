
import React, { useState, useEffect } from 'react';
import { 
  DashboardIcon, 
  ServerIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  HeadsetIcon, 
  CogIcon, 
  ActivityIcon, 
  CpuIcon, 
  HardDriveIcon, 
  ShieldAlertIcon, 
  CheckIcon,
  TrendingUpIcon,
  TerminalIcon,
  BrainIcon,
  HammerIcon,
  RulerIcon,
  BoxIcon
} from './Shared';

interface SmartWorkshopModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Componente Principal
export const SmartWorkshopModal: React.FC<SmartWorkshopModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStatus, setServerStatus] = useState('online');
  const [cpuUsage, setCpuUsage] = useState(45);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', msg: 'Máquina CNC 04: Sobreaquecimento', time: '10 min atrás' },
    { id: 2, type: 'success', msg: 'Projeto "Cozinha Silva" exportado', time: '1 hora atrás' }
  ]);

  // Simulação de dados em tempo real
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const noise = Math.floor(Math.random() * 10) - 5;
        const newVal = prev + noise;
        return newVal > 100 ? 100 : newVal < 0 ? 0 : newVal;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardOverview cpuUsage={cpuUsage} notifications={notifications} />;
      case 'server': return <ServerMonitor cpuUsage={cpuUsage} />;
      case 'sales': return <SalesDepartment />;
      case 'hr': return <HRDepartment />;
      case 'ai': return <AIAutonomy />;
      default: return <DashboardOverview cpuUsage={cpuUsage} notifications={notifications} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-2 md:p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-[95vw] h-[90vh] bg-[#2d2424] text-[#f5f1e8] font-sans overflow-hidden shadow-2xl rounded-xl flex flex-col md:flex-row border border-[#4a4040]" onClick={e => e.stopPropagation()}>
        
        {/* Sidebar com estilo Industrial/Madeira */}
        <aside className="w-full md:w-64 bg-[#1e1e1e] border-r border-[#4a4040] flex flex-col z-20">
          <div className="p-6 flex items-center space-x-3 border-b border-[#4a4040] bg-[#1e1e1e]">
            <div className="bg-gradient-to-br from-[#d4ac6e] to-[#b99256] p-2 rounded-lg shadow-lg">
              <HammerIcon className="text-[#3e3535] w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-[#f5f1e8] leading-tight">MARCENARIA<br/><span className="text-[#d4ac6e] text-sm font-normal">DIGITAL 4.0</span></h1>
            </div>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Painel Geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<ServerIcon className="w-5 h-5" />} label="Infraestrutura & CNC" active={activeTab === 'server'} onClick={() => setActiveTab('server')} />
            <NavItem icon={<BoxIcon className="w-5 h-5" />} label="Projetos & Vendas" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
            <NavItem icon={<UsersIcon className="w-5 h-5" />} label="Equipa & RH" active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} />
            
            <div className="pt-6 pb-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Automação</div>
            <NavItem icon={<BrainIcon className="w-5 h-5" />} label="IA Gestora" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          </nav>

          <div className="p-4 border-t border-[#4a4040] bg-[#2d2424]">
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></div>
              <span className="font-mono">SRV: 159.69.115.71</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#2d2424]">
          {/* Background Texture Detail */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4ac6e]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <header className="h-16 bg-[#1e1e1e]/90 backdrop-blur border-b border-[#4a4040] flex items-center justify-between px-8 z-10">
            <div className="flex items-center space-x-2">
               <RulerIcon className="text-[#d4ac6e]/50 w-5 h-5" />
               <h2 className="text-lg font-medium text-[#f5f1e8] capitalize tracking-wide">{activeTab === 'ai' ? 'Gestão Autónoma IA' : activeTab === 'sales' ? 'Projetos e Vendas' : activeTab === 'dashboard' ? 'Painel Geral' : activeTab === 'server' ? 'Servidor' : 'Recursos Humanos'}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-[#3e3535] rounded-full text-gray-400 hover:text-[#d4ac6e] transition border border-transparent hover:border-[#4a4040]">
                <HeadsetIcon className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-[#3e3535] rounded-full text-gray-400 hover:text-[#d4ac6e] transition border border-transparent hover:border-[#4a4040]">
                <CogIcon className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4ac6e] to-[#b99256] flex items-center justify-center font-bold text-[#3e3535] text-xs shadow-lg">
                MD
              </div>
              <button onClick={onClose} className="ml-4 text-gray-500 hover:text-red-500 transition">
                  <span className="text-2xl">&times;</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Componentes Auxiliares com Design Atualizado

const NavItem: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-300 group ${
        active 
          ? 'bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] shadow-lg font-bold' 
          : 'text-gray-400 hover:bg-[#3e3535] hover:text-[#f5f1e8] hover:pl-4'
      }`}
    >
      <div className={`${active ? 'text-[#3e3535]' : 'text-gray-500 group-hover:text-[#d4ac6e]'} transition-colors`}>
        {icon}
      </div>
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </button>
  );
}

const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: any; trend: 'up' | 'down' }> = ({ title, value, subtext, icon, trend }) => {
  return (
    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#4a4040] shadow-xl relative overflow-hidden group hover:border-[#d4ac6e]/30 transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        {/* Icon overlay effect */}
        {React.cloneElement(icon, { className: 'w-16 h-16' })}
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-[#f5f1e8]">{value}</h3>
        </div>
        <div className="p-2 bg-[#2d2424] rounded-lg text-[#d4ac6e] border border-[#4a4040]">
          {icon}
        </div>
      </div>
      <div className="flex items-center text-sm relative z-10">
        <span className={`flex items-center font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUpIcon className="mr-1 w-4 h-4" />
          {subtext}
        </span>
      </div>
    </div>
  );
}

const DashboardOverview: React.FC<{ cpuUsage: number; notifications: any[] }> = ({ cpuUsage, notifications }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturação Mensal" value="€ 42.500" subtext="+12% vs mês anterior" icon={<ShoppingBagIcon className="w-5 h-5" />} trend="up" />
        <StatCard title="Projetos Ativos" value="34" subtext="8 em montagem" icon={<BoxIcon className="w-5 h-5" />} trend="up" />
        <StatCard title="Uptime Servidor" value={`${cpuUsage}%`} subtext="Carga Nominal" icon={<CpuIcon className="w-5 h-5" />} trend="up" />
        <StatCard title="Tickets Suporte" value="8" subtext="-2 urgente" icon={<HeadsetIcon className="w-5 h-5" />} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1e1e1e] rounded-xl border border-[#4a4040] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-[#f5f1e8] flex items-center"><ActivityIcon className="mr-2 text-[#d4ac6e] w-5 h-5"/> Status da Produção Digital</h3>
             <span className="text-xs font-mono text-gray-400 bg-[#2d2424] px-2 py-1 rounded border border-[#4a4040]">SRV: 159.69.115.71</span>
          </div>
          <div className="h-64 flex items-end justify-between space-x-1">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="bg-[#b99256] hover:bg-[#d4ac6e] rounded-sm w-full transition-all duration-500 opacity-80 hover:opacity-100"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              ></div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500 font-mono">
            <span>08:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-xl border border-[#4a4040] p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-[#f5f1e8]">Alertas de Fábrica</h3>
          <div className="space-y-4">
            {notifications.map(note => (
              <div key={note.id} className="flex items-start space-x-3 p-3 bg-[#2d2424] rounded-lg border border-[#4a4040] hover:border-gray-600 transition group">
                {note.type === 'warning' ? <ShieldAlertIcon className="text-[#d4ac6e] mt-1 w-5 h-5" /> : <CheckIcon className="text-green-500 mt-1 w-5 h-5" />}
                <div>
                  <p className="text-sm text-gray-200 font-medium group-hover:text-white transition">{note.msg}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{note.time}</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 text-xs font-bold text-[#d4ac6e] hover:text-[#f5f1e8] border border-dashed border-[#4a4040] hover:border-[#d4ac6e]/50 rounded mt-2 transition uppercase tracking-wide">
              Ver Log do Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ServerMonitor: React.FC<{ cpuUsage: number }> = ({ cpuUsage }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#4a4040] rounded-xl p-4 font-mono text-sm text-[#d4ac6e] overflow-hidden shadow-inner relative">
        <div className="absolute top-2 right-2 flex space-x-1">
           <div className="w-2 h-2 rounded-full bg-red-500"></div>
           <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
           <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center space-x-2 mb-4 border-b border-[#4a4040] pb-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-gray-400">root@marcenaria-digital:~#</span> <span className="text-white">monitor --production</span>
        </div>
        <div className="space-y-1 opacity-90 text-gray-300">
          <p><span className="text-green-500">{'>'}</span> Conexão API Marcenaria... <span className="text-green-500">[OK]</span></p>
          <p><span className="text-green-500">{'>'}</span> Sincronizando catálogo 3D... <span className="text-green-500">[OK]</span></p>
          <p><span className="text-green-500">{'>'}</span> Firewall Industrial: Ativo</p>
          <p><span className="text-green-500">{'>'}</span> Módulos de Corte: Running</p>
          <p className="animate-pulse text-yellow-400">{'>'} A aguardar input de novos projetos...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#4a4040] shadow-lg">
          <h3 className="flex items-center space-x-2 text-lg font-bold mb-6 text-[#f5f1e8]">
            <CpuIcon className="text-[#d4ac6e] w-5 h-5" /> <span>Processamento (Render 3D)</span>
          </h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded text-[#3e3535] bg-[#d4ac6e]">
                  Carga
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold inline-block text-[#d4ac6e]">
                  {cpuUsage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#4a4040]">
              <div style={{ width: `${cpuUsage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[#b99256] to-[#d4ac6e] transition-all duration-500"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="text-center p-3 bg-[#2d2424] rounded border border-[#4a4040]">
                <p className="text-xs text-gray-400 uppercase">Temp Core</p>
                <p className="font-bold text-[#f5f1e8]">42°C</p>
             </div>
             <div className="text-center p-3 bg-[#2d2424] rounded border border-[#4a4040]">
                <p className="text-xs text-gray-400 uppercase">Render Queue</p>
                <p className="font-bold text-[#f5f1e8]">128</p>
             </div>
          </div>
        </div>

        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#4a4040] shadow-lg">
          <h3 className="flex items-center space-x-2 text-lg font-bold mb-6 text-[#f5f1e8]">
            <HardDriveIcon className="text-blue-500 w-5 h-5" /> <span>Armazenamento Projetos</span>
          </h3>
          <div className="flex justify-center py-4">
             <div className="w-32 h-32 rounded-full border-8 border-[#4a4040] border-t-[#d4ac6e] flex items-center justify-center flex-col shadow-[0_0_20px_rgba(212,172,110,0.2)]">
                <span className="text-2xl font-bold text-[#f5f1e8]">45%</span>
                <span className="text-xs text-gray-400">Livre</span>
             </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">Arquivos CAD/CAM</p>
        </div>
      </div>
    </div>
  );
}

const SalesDepartment: React.FC = () => {
  const sales = [
    { id: '#PRJ-901', product: 'Cozinha Planejada MDF Naval', amount: '€ 4.200', status: 'Aprovado' },
    { id: '#PRJ-902', product: 'Roupeiro Embutido 3m', amount: '€ 1.450', status: 'Orçamento' },
    { id: '#PRJ-903', product: 'Móvel TV Sala Estar', amount: '€ 890', status: 'Produção' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-bold text-[#f5f1e8]">Projetos Recentes</h2>
         <button className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold px-4 py-2 rounded shadow-lg text-sm transition flex items-center">
            <BoxIcon className="mr-2 w-4 h-4" /> Novo Projeto
         </button>
      </div>
      <div className="bg-[#1e1e1e] rounded-xl border border-[#4a4040] overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#2d2424] text-gray-200 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">ID Projeto</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Orçamento</th>
              <th className="px-6 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4a4040]">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-[#4a4040]/50 transition">
                <td className="px-6 py-4 font-mono text-[#d4ac6e]">{sale.id}</td>
                <td className="px-6 py-4 text-gray-300 font-medium">{sale.product}</td>
                <td className="px-6 py-4 text-white font-bold">{sale.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    sale.status === 'Aprovado' ? 'bg-green-900/20 text-green-500 border border-green-500/20' : 
                    sale.status === 'Produção' ? 'bg-blue-900/20 text-blue-500 border border-blue-500/20' :
                    'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {sale.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HRDepartment: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#4a4040] shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-[#f5f1e8]">Escala de Montagem & Férias</h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-[#2d2424] rounded border border-[#4a4040] hover:border-gray-600 transition">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-[#4a4040] flex items-center justify-center text-xs font-bold text-gray-300 border border-gray-600">MJ</div>
                <div>
                  <p className="text-sm font-bold text-white">Maria João</p>
                  <p className="text-xs text-[#d4ac6e]">Equipa de Acabamentos</p>
                </div>
              </div>
              <div className="flex space-x-2">
                 <button className="text-green-400 hover:bg-green-900/20 px-3 py-1 rounded text-xs border border-green-900/30 transition">Aprovar</button>
                 <button className="text-red-400 hover:bg-red-900/20 px-3 py-1 rounded text-xs border border-red-900/30 transition">Negar</button>
              </div>
           </div>
        </div>
      </div>
      
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-[#4a4040] shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-[#f5f1e8]">Produtividade da Oficina</h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">A IA detetou uma descida de eficiência no setor de <span className="text-white font-semibold">Corte CNC</span> esta semana.</p>
        <div className="h-4 bg-[#4a4040] rounded-full overflow-hidden border border-[#4a4040]">
          <div className="h-full bg-gradient-to-r from-[#b99256] to-[#d4ac6e] w-3/4 relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
          </div>
        </div>
        <div className="mt-3 flex justify-between text-xs font-bold uppercase tracking-wider">
           <span className="text-gray-500">Meta: 90%</span>
           <span className="text-[#d4ac6e]">Atual: 75%</span>
        </div>
      </div>
    </div>
  );
}

const AIAutonomy: React.FC = () => {
  const [logs, setLogs] = useState([
    { id: 1, action: 'Otimização de corte de chapas (Nest) executada.', dept: 'Produção', time: '02:00' },
    { id: 2, action: 'Encomenda automática de parafusos 4x40mm.', dept: 'Compras', time: '09:30' },
    { id: 3, action: 'Notificação de manutenção preventiva na Orladora.', dept: 'Manutenção', time: '11:15' }
  ]);

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-gradient-to-br from-[#2d2424] to-[#1e1e1e] p-8 rounded-2xl border border-[#d4ac6e]/30 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-gradient-to-b from-[#d4ac6e] via-[#1e1e1e] to-[#1e1e1e]"></div>
        <BrainIcon className="mx-auto text-[#d4ac6e] mb-4 animate-pulse w-12 h-12" />
        <h2 className="text-2xl font-bold text-[#f5f1e8] mb-2 tracking-tight">Gestão Autónoma Inteligente</h2>
        <p className="text-gray-400 max-w-lg mx-auto mb-6">O sistema supervisiona a Marcenaria Digital (IP 159.69.115.71), otimizando cortes, stocks e fluxos de venda sem intervenção manual.</p>
        <button className="bg-[#d4ac6e] text-[#3e3535] font-bold px-8 py-3 rounded hover:bg-[#b99256] transition shadow-lg border-t border-[#f0e9dc]/20">
          Ajustar Parâmetros
        </button>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-[#4a4040] p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-6 flex items-center text-[#f5f1e8]">
          <TerminalIcon className="mr-2 text-[#d4ac6e] w-5 h-5" /> Log de Decisões Autónomas
        </h3>
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-4 bg-[#2d2424] rounded border-l-4 border-[#d4ac6e] hover:bg-[#3e3535] transition">
              <div>
                <p className="text-gray-200 font-medium text-sm">{log.action}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#4a4040] text-gray-400 border border-gray-600">{log.dept}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-mono">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
