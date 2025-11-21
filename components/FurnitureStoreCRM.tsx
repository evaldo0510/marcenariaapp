
import React, { useState } from 'react';
import { BriefcaseIcon, SearchIcon, CalendarIcon, ClockIcon, CheckIcon } from './Shared';

interface CRMClient {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'lead' | 'negotiation' | 'closed' | 'lost';
    lastInteraction: string;
    nextAction: string;
    budget: string;
    probability: 'low' | 'medium' | 'high';
}

export const FurnitureStoreCRM: React.FC = () => {
    const [clients] = useState<CRMClient[]>([
        { id: '1', name: 'Ricardo Martins', email: 'ricardo@email.com', phone: '(11) 99999-9999', status: 'negotiation', lastInteraction: 'Enviado orçamento v2', nextAction: 'Ligar sexta-feira', budget: 'R$ 45.000', probability: 'high' },
        { id: '2', name: 'Fernanda Torres', email: 'fernanda@email.com', phone: '(11) 88888-8888', status: 'lead', lastInteraction: 'Visita ao showroom', nextAction: 'Enviar projeto inicial', budget: 'R$ 20.000', probability: 'medium' },
        { id: '3', name: 'Construtora XYZ', email: 'compras@xyz.com', phone: '(11) 77777-7777', status: 'closed', lastInteraction: 'Contrato assinado', nextAction: 'Agendar medição final', budget: 'R$ 150.000', probability: 'high' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'lead': return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">Novo Lead</span>;
            case 'negotiation': return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">Em Negociação</span>;
            case 'closed': return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">Fechado</span>;
            case 'lost': return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">Perdido</span>;
            default: return null;
        }
    };

    const getProbabilityColor = (prob: string) => {
        switch (prob) {
            case 'high': return 'text-green-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                    <input 
                        type="text" 
                        placeholder="Buscar cliente por nome, telefone ou email..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-3 rounded-lg border bg-white dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                    />
                    <SearchIcon className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                </div>
                <button className="bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-6 rounded-lg hover:bg-[#c89f5e] transition shadow-sm">
                    + Novo Cliente
                </button>
            </div>

            {/* Kanban/List Toggle could go here, keeping list for simplicity */}
            <div className="bg-white dark:bg-[#3e3535] rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-[#2d2424] text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Cliente / Contato</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Orçamento Est.</th>
                                <th className="p-4">Última Interação</th>
                                <th className="p-4">Próximo Passo</th>
                                <th className="p-4 text-center">Probabilidade</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                            {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#4a4040]/50 transition">
                                    <td className="p-4">
                                        <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.email}</p>
                                        <p className="text-xs text-gray-500">{client.phone}</p>
                                    </td>
                                    <td className="p-4">{getStatusBadge(client.status)}</td>
                                    <td className="p-4 font-mono font-medium">{client.budget}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">
                                        <div className="flex items-center gap-1">
                                            <ClockIcon /> {/* Using generic ClockIcon from Shared */}
                                            {client.lastInteraction}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                                            <CalendarIcon className="w-3 h-3" />
                                            {client.nextAction}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className={`text-xs font-bold uppercase ${getProbabilityColor(client.probability)}`}>
                                            {client.probability === 'high' ? 'Alta' : client.probability === 'medium' ? 'Média' : 'Baixa'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-gray-400 hover:text-[#d4ac6e]">Details &rarr;</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
