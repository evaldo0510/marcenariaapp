
import React, { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction } from '../services/historyService';
import type { Transaction } from '../types';
import { Spinner, PlusIcon, TrashIcon, CurrencyDollarIcon, TrendingUpIcon } from './Shared';

export const FinanceModule: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTx, setNewTx] = useState<Partial<Transaction>>({ type: 'expense', category: 'Material', date: Date.now() });

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (e) {
            console.error("Failed to load transactions", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const handleAdd = async () => {
        if (!newTx.amount || !newTx.description) return;
        await addTransaction({
            type: newTx.type as 'income' | 'expense',
            amount: Number(newTx.amount),
            description: newTx.description || '',
            category: newTx.category || 'Geral',
            date: newTx.date || Date.now(),
            status: 'paid'
        });
        setNewTx({ type: 'expense', category: 'Material', date: Date.now(), amount: undefined, description: '' });
        loadTransactions();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Tem certeza?")) {
            await deleteTransaction(id);
            loadTransactions();
        }
    }

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="space-y-6 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-400 font-bold">Receitas</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">R$ {totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-400 font-bold">Despesas</p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-300">R$ {totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                    <div>
                        <p className="text-blue-700 dark:text-blue-400 font-bold">Saldo Atual</p>
                        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-red-600'}`}>R$ {balance.toFixed(2)}</p>
                    </div>
                    <TrendingUpIcon className="w-8 h-8 text-blue-300" />
                </div>
            </div>

            <div className="bg-[#fffefb] dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                <h3 className="font-bold mb-4 text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2"><PlusIcon /> Nova Movimentação</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="col-span-2">
                        <label className="block text-xs mb-1">Descrição</label>
                        <input type="text" className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs mb-1">Valor (R$)</label>
                        <input type="number" className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                         <label className="block text-xs mb-1">Tipo</label>
                        <select className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value as any})}>
                            <option value="income">Entrada</option>
                            <option value="expense">Saída</option>
                        </select>
                    </div>
                    <button onClick={handleAdd} className="p-2 bg-[#d4ac6e] text-[#3e3535] font-bold rounded hover:bg-[#c89f5e]">Adicionar</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9]">
                        <tr>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Descrição</th>
                            <th className="px-4 py-3">Categoria</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} className="border-b dark:border-[#4a4040]">
                                <td className="px-4 py-3">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{t.description}</td>
                                <td className="px-4 py-3 text-xs opacity-70">{t.category}</td>
                                <td className={`px-4 py-3 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-4 text-center"><Spinner /></div>}
                {!loading && transactions.length === 0 && <div className="p-4 text-center text-gray-500">Nenhuma transação registrada.</div>}
            </div>
        </div>
    );
};
