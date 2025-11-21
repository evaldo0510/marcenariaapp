
import React, { useState } from 'react';
import { CurrencyDollarIcon, ChartBarIcon, CheckIcon } from './Shared';
import type { WalletTransaction } from '../types';

export const CommissionWallet: React.FC = () => {
    const [balance, setBalance] = useState(450.00);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([
        { id: '1', type: 'credit', amount: 49.90 * 0.15, description: 'Comissão - Marcenaria Silva', date: Date.now(), status: 'completed' },
        { id: '2', type: 'credit', amount: 149.90 * 0.15, description: 'Comissão - Móveis Souza', date: Date.now() - 100000, status: 'pending' },
        { id: '3', type: 'debit', amount: 200.00, description: 'Saque PIX', date: Date.now() - 5000000, status: 'completed' },
    ]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#3e3535] to-[#2d2424] dark:from-[#d4ac6e] dark:to-[#b99256] p-6 rounded-xl text-white dark:text-[#3e3535] shadow-xl">
                    <p className="opacity-80 text-sm mb-1">Saldo Disponível</p>
                    <h3 className="text-4xl font-bold mb-6">R$ {balance.toFixed(2)}</h3>
                    <div className="flex gap-3">
                        <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg font-bold transition backdrop-blur-sm">
                            Solicitar Saque
                        </button>
                        <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg font-bold transition backdrop-blur-sm">
                            Extrato
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                    <h4 className="font-bold text-gray-500 uppercase text-xs mb-4">Resumo do Mês</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Vendas Totais</span>
                            <span className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">R$ 2.450,00</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Comissões Pendentes</span>
                            <span className="font-bold text-yellow-500">R$ 125,50</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        <p className="text-xs text-gray-400">Meta para próximo bônus: R$ 3.000,00</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#3e3535] rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden">
                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Histórico de Transações</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-[#2d2424]">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                            {transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td className="p-4 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-[#3e3535] dark:text-[#f5f1e8]">{tx.description}</td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                            tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {tx.status === 'completed' ? 'Confirmado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className={`p-4 text-right font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.type === 'credit' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
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
