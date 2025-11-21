
import React, { useState } from 'react';
import { CatalogIcon, SearchIcon, PlusIcon, TagIcon } from './Shared';

interface Material {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    supplier: string;
}

export const MaterialsCatalog: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([
        { id: '1', name: 'MDF Branco TX 15mm', category: 'Chapas', price: 220.00, unit: 'chapa', supplier: 'Leo Madeiras' },
        { id: '2', name: 'MDF Carvalho Hanover 18mm', category: 'Chapas', price: 350.00, unit: 'chapa', supplier: 'Duratex' },
        { id: '3', name: 'Corrediça Telescópica 450mm', category: 'Ferragens', price: 25.00, unit: 'par', supplier: 'Casa do Marceneiro' },
        { id: '4', name: 'Dobradiça 35mm com Amortecedor', category: 'Ferragens', price: 12.50, unit: 'un', supplier: 'Casa do Marceneiro' },
        { id: '5', name: 'Cola de Contato 2.8kg', category: 'Químicos', price: 85.00, unit: 'lata', supplier: 'Gasômetro' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');

    const filteredMaterials = materials.filter(m => 
        (filterCategory === 'Todos' || m.category === filterCategory) &&
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categories = ['Todos', ...new Set(materials.map(m => m.category))];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><CatalogIcon /> Catálogo de Materiais</h2>
                <button className="bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] flex items-center gap-2">
                    <PlusIcon /> Novo Item
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou fornecedor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-3 rounded-lg border bg-white dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]"
                    />
                    <SearchIcon className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${filterCategory === cat ? 'bg-[#3e3535] text-white dark:bg-[#d4ac6e] dark:text-[#3e3535]' : 'bg-gray-200 dark:bg-[#4a4040] text-gray-700 dark:text-gray-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMaterials.map(material => (
                    <div key={material.id} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] shadow-sm hover:shadow-md transition flex flex-col justify-between h-full">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded uppercase">{material.category}</span>
                                <TagIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-1 line-clamp-2" title={material.name}>{material.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{material.supplier}</p>
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-[#4a4040] pt-3">
                            <div>
                                <p className="text-xs text-gray-400">Preço Médio</p>
                                <p className="text-xl font-bold text-[#d4ac6e]">R$ {material.price.toFixed(2)}</p>
                            </div>
                            <span className="text-xs text-gray-500">/ {material.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
