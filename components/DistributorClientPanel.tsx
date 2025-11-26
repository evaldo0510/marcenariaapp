import React from 'react';
import { UsersIcon, SearchIcon } from './Shared';

export const DistributorClientPanel: React.FC = () => {
    // Mock data - In real app, fetch from backend linked to partnerId
    const clients = [
        { id: 1, name: "Marcenaria Silva", plan: "Profissional", status: "Ativo", revenue: "R$ 79,90", commission: "R$ 11,98", date: "10/10/2023" },
        { id: 2, name: "Móveis Planejados Souza", plan: "Oficina", status: "Trial", revenue: "R$ 0,00", commission: "R$ 0,00", date: "15/10/2023" },
        { id: 3, name: "Arte em Madeira", plan: "Profissional", status: "Inadimplente", revenue: "R$ 79,90", commission: "R$ 0,00", date: "05/09/2023" },
        { id: 4, name: "José Carlos Móveis", plan: "Gratuito", status: "Ativo", revenue: "R$ 0,00", commission: "R$ 0,00", date: "20/10/2023" },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                    <UsersIcon /> Carteira de Clientes
                </h3>
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar marcenaria..." 
                        className="w-full pl-10 p-2 rounded-lg border bg-white dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                    />
                    <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                </div>
            </div>

            <div className="bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-[#2d2424] text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Data Cadastro</th>
                                <th className="p-4">Plano Atual</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Sua Comissão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                            {clients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#4a4040]/50 transition">
                                    <td className="p-4 font-medium text-[#3e3535] dark:text-[#f5f1e8]">{client.name}</td>
                                    <td className="p-4 text-gray-500">{client.date}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{client.plan}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            client.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                                            client.status === 'Trial' ? 'bg-blue-100 text-blue-800' :
                                            client.status === 'Inadimplente' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">{client.commission}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {clients.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Você ainda não tem clientes indicados. Comece compartilhando seu link!
                    </div>
                )}
            </div>
        </div>
    );
};