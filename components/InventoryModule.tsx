
import React, { useState, useEffect } from 'react';
import { getInventory, saveInventoryItem, deleteInventoryItem } from '../services/historyService';
import type { InventoryItem } from '../types';
import { Spinner, PlusIcon, TrashIcon, ExclamationCircleIcon } from './Shared';

export const InventoryModule: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ unit: 'un', minStock: 5, quantity: 0 });

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await getInventory();
            setInventory(data);
        } catch (e) {
            console.error("Failed to load inventory", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleSave = async () => {
        if (!newItem.name) return;
        await saveInventoryItem({
            id: newItem.id || `item_${Date.now()}`,
            name: newItem.name,
            category: newItem.category || 'Geral',
            quantity: Number(newItem.quantity),
            unit: newItem.unit || 'un',
            minStock: Number(newItem.minStock),
            unitPrice: Number(newItem.unitPrice || 0),
            lastUpdated: Date.now()
        });
        setNewItem({ unit: 'un', minStock: 5, quantity: 0, name: '', category: '', unitPrice: 0 });
        loadInventory();
    };

    const handleDelete = async (id: string) => {
        if(confirm("Remover item do estoque?")) {
            await deleteInventoryItem(id);
            loadInventory();
        }
    }

    const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);

    return (
        <div className="space-y-6 animate-fadeIn">
            {lowStockItems.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                    <ExclamationCircleIcon className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-400">Alerta de Estoque Baixo</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Os seguintes itens precisam de reposição: {lowStockItems.map(i => i.name).join(", ")}.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-[#fffefb] dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                <h3 className="font-bold mb-4 text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2"><PlusIcon /> Adicionar Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="col-span-2">
                        <label className="block text-xs mb-1">Nome do Material</label>
                        <input type="text" className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs mb-1">Qtd</label>
                        <input type="number" className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} />
                    </div>
                     <div>
                         <label className="block text-xs mb-1">Mínimo</label>
                        <input type="number" className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                         <label className="block text-xs mb-1">Unidade</label>
                        <select className="w-full p-2 rounded border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f]" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                            <option value="un">Unidade</option>
                            <option value="m2">m²</option>
                            <option value="m">Metro</option>
                            <option value="kg">Kg</option>
                            <option value="l">Litro</option>
                        </select>
                    </div>
                    <button onClick={handleSave} className="p-2 bg-[#d4ac6e] text-[#3e3535] font-bold rounded hover:bg-[#c89f5e]">Salvar</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9]">
                        <tr>
                            <th className="px-4 py-3">Material</th>
                            <th className="px-4 py-3">Categoria</th>
                            <th className="px-4 py-3">Em Estoque</th>
                            <th className="px-4 py-3">Mínimo</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => (
                            <tr key={item.id} className="border-b dark:border-[#4a4040]">
                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                <td className="px-4 py-3 opacity-70">{item.category}</td>
                                <td className="px-4 py-3 font-bold">{item.quantity} {item.unit}</td>
                                <td className="px-4 py-3">{item.minStock} {item.unit}</td>
                                <td className="px-4 py-3">
                                    {item.quantity <= item.minStock ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Baixo</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">OK</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {loading && <div className="p-4 text-center"><Spinner /></div>}
                 {!loading && inventory.length === 0 && <div className="p-4 text-center text-gray-500">Estoque vazio. Adicione materiais.</div>}
            </div>
        </div>
    );
};
