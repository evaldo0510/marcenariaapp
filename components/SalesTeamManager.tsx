
import React, { useState } from 'react';
import { UserGroupIcon, TrophyIcon, ChartBarIcon, CurrencyDollarIcon } from './Shared';

interface SalesRep {
    id: string;
    name: string;
    monthlyTarget: number;
    currentSales: number;
    conversionRate: number;
    commissionRate: number;
}

export const SalesTeamManager: React.FC = () => {
    const [team] = useState<SalesRep[]>([
        { id: '1', name: 'Amanda Souza', monthlyTarget: 100000, currentSales: 85000, conversionRate: 18, commissionRate: 2.5 },
        { id: '2', name: 'Pedro Gomes', monthlyTarget: 80000, currentSales: 42000, conversionRate: 12, commissionRate: 2.0 },
        { id: '3', name: 'Juliana Lima', monthlyTarget: 120000, currentSales: 135000, conversionRate: 22, commissionRate: 3.0 },
    ]);

    const totalSales = team.reduce((acc, rep) => acc + rep.currentSales, 0);
    const totalTarget = team.reduce((acc, rep) => acc + rep.monthlyTarget, 0);
    const progress = (totalSales / totalTarget) * 100;

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#3e3535] p-5 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Vendas Totais (Mês)</h4>
                    <p className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{formatCurrency(totalSales)}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-3">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.toFixed(1)}% da meta da loja</p>
                </div>
                <div className="bg-white dark:bg-[#3e3535] p-5 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Melhor Vendedor</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600">
                            <TrophyIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">Juliana Lima</p>
                            <p className="text-xs text-green-600 font-semibold">112% da Meta</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#3e3535] p-5 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Comissões a Pagar</h4>
                    <p className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">
                        {formatCurrency(team.reduce((acc, rep) => acc + (rep.currentSales * (rep.commissionRate / 100)), 0))}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Média de 2.5% sobre vendas</p>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white dark:bg-[#3e3535] rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden">
                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-gray-50 dark:bg-[#2d2424]">
                    <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5" /> Equipe de Vendas
                    </h3>
                    <button className="text-xs font-bold text-[#d4ac6e] hover:underline">+ Adicionar Vendedor</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-[#2d2424] text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="p-4">Vendedor</th>
                                <th className="p-4">Meta</th>
                                <th className="p-4">Realizado</th>
                                <th className="p-4">Progresso</th>
                                <th className="p-4 text-center">Conversão</th>
                                <th className="p-4 text-right">Comissão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                            {team.map(rep => {
                                const repProgress = (rep.currentSales / rep.monthlyTarget) * 100;
                                return (
                                    <tr key={rep.id} className="hover:bg-gray-50 dark:hover:bg-[#4a4040]/50 transition">
                                        <td className="p-4 font-medium text-[#3e3535] dark:text-[#f5f1e8]">{rep.name}</td>
                                        <td className="p-4 text-gray-500">{formatCurrency(rep.monthlyTarget)}</td>
                                        <td className="p-4 font-bold text-[#3e3535] dark:text-[#f5f1e8]">{formatCurrency(rep.currentSales)}</td>
                                        <td className="p-4 w-32">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-grow bg-gray-200 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${repProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                        style={{ width: `${Math.min(repProgress, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold">{Math.round(repProgress)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${rep.conversionRate > 15 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {rep.conversionRate}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-[#3e3535] dark:text-[#f5f1e8]">
                                            {formatCurrency(rep.currentSales * (rep.commissionRate / 100))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
