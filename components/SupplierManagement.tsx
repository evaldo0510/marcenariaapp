
import React, { useState } from 'react';
import { TruckIcon, PlusIcon, TrashIcon, SearchIcon, StarIcon } from './Shared';

interface Supplier {
    id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    category: string;
    rating: number;
    notes: string;
}

export const SupplierManagement: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([
        { id: '1', name: 'Leo Madeiras', contact: 'João Silva', phone: '(11) 99999-9999', email: 'vendas@leomadeiras.com', category: 'Chapas', rating: 5, notes: 'Entrega rápida.' },
        { id: '2', name: 'Casa do Marceneiro', contact: 'Maria Oliveira', phone: '(11) 88888-8888', email: 'maria@casamarceneiro.com', category: 'Ferragens', rating: 4, notes: 'Bom preço em dobradiças.' },
    ]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = () => {
        if (!currentSupplier.name) return;
        if (currentSupplier.id) {
            setSuppliers(suppliers.map(s => s.id === currentSupplier.id ? { ...s, ...currentSupplier } as Supplier : s));
        } else {
            setSuppliers([...suppliers, { ...currentSupplier, id: Date.now().toString(), rating: currentSupplier.rating || 0 } as Supplier]);
        }
        setIsEditing(false);
        setCurrentSupplier({});
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja remover este fornecedor?")) {
            setSuppliers(suppliers.filter(s => s.id !== id));
        }
    };

    const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-fadeIn">
            {!isEditing ? (
                <>
                    <div className="flex justify-between items-center">
                        <div className="relative flex-grow max-w-md">
                            <input
                                type="text"
                                placeholder="Buscar fornecedor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 p-2 rounded-lg border bg-white dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                            />
                            <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        </div>
                        <button onClick={() => setIsEditing(true)} className="ml-4 bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] flex items-center gap-2">
                            <PlusIcon /> Novo Fornecedor
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSuppliers.map(supplier => (
                            <div key={supplier.id} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">{supplier.name}</h3>
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} isFavorite={i < supplier.rating} className="w-4 h-4" />
                                        ))}
                                    </div>
                                </div>
                                <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded text-gray-600 dark:text-gray-300 mb-3 inline-block">{supplier.category}</span>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p><strong>Contato:</strong> {supplier.contact}</p>
                                    <p><strong>Tel:</strong> {supplier.phone}</p>
                                    <p><strong>Email:</strong> {supplier.email}</p>
                                </div>
                                <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#4a4040]">
                                    <button onClick={() => { setCurrentSupplier(supplier); setIsEditing(true); }} className="text-blue-600 hover:underline text-sm">Editar</button>
                                    <button onClick={() => handleDelete(supplier.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-gray-200 dark:border-[#4a4040]">
                    <h3 className="text-xl font-bold mb-4">{currentSupplier.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                            <input type="text" value={currentSupplier.name || ''} onChange={e => setCurrentSupplier({ ...currentSupplier, name: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Categoria Principal</label>
                            <select value={currentSupplier.category || 'Geral'} onChange={e => setCurrentSupplier({ ...currentSupplier, category: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]">
                                <option value="Geral">Geral</option>
                                <option value="Chapas">Chapas (MDF/MDP)</option>
                                <option value="Ferragens">Ferragens</option>
                                <option value="Tintas">Tintas e Vernizes</option>
                                <option value="Ferramentas">Ferramentas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome do Contato</label>
                            <input type="text" value={currentSupplier.contact || ''} onChange={e => setCurrentSupplier({ ...currentSupplier, contact: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Telefone</label>
                            <input type="text" value={currentSupplier.phone || ''} onChange={e => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" value={currentSupplier.email || ''} onChange={e => setCurrentSupplier({ ...currentSupplier, email: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Avaliação (1-5)</label>
                            <input type="number" min="1" max="5" value={currentSupplier.rating || 5} onChange={e => setCurrentSupplier({ ...currentSupplier, rating: parseInt(e.target.value) })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Notas</label>
                            <textarea value={currentSupplier.notes || ''} onChange={e => setCurrentSupplier({ ...currentSupplier, notes: e.target.value })} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" rows={3}></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => { setIsEditing(false); setCurrentSupplier({}); }} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded bg-[#d4ac6e] text-[#3e3535] font-bold hover:bg-[#c89f5e]">Salvar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
