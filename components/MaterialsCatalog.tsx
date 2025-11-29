
import React, { useState, useEffect } from 'react';
import { CatalogIcon, SearchIcon, PlusIcon, TagIcon } from './Shared';
import { MDF_DATABASE } from '../services/materialsData';

interface Material {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    supplier: string;
    image?: string;
    color?: string;
}

export const MaterialsCatalog: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todos');

    useEffect(() => {
        // Carrega dados iniciais combinando mock data com o banco de dados do sistema
        const initialMaterials: Material[] = [
            { id: '100', name: 'Corrediça Telescópica 450mm', category: 'Ferragens', price: 25.00, unit: 'par', supplier: 'Casa do Marceneiro' },
            { id: '101', name: 'Dobradiça 35mm com Amortecedor', category: 'Ferragens', price: 12.50, unit: 'un', supplier: 'Casa do Marceneiro' },
            { id: '102', name: 'Cola de Contato 2.8kg', category: 'Químicos', price: 85.00, unit: 'lata', supplier: 'Gasômetro' },
        ];

        // Importa MDFs do banco de dados central
        const mdfItems: Material[] = MDF_DATABASE.map((mdf, index) => ({
            id: mdf.id,
            name: `MDF ${mdf.name}`,
            category: mdf.type === 'wood' ? 'Madeiras' : mdf.type === 'stone' ? 'Pedras' : 'Unicolores',
            price: mdf.type === 'stone' ? 1200.00 : 350.00, // Preço base estimado
            unit: 'chapa',
            supplier: mdf.brand,
            color: mdf.hex
        }));

        setMaterials([...initialMaterials, ...mdfItems]);
    }, []);

    const filteredMaterials = materials.filter(m => 
        (filterCategory === 'Todos' || m.category === filterCategory) &&
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categories = ['Todos', 'Madeiras', 'Unicolores', 'Ferragens', 'Químicos', 'Pedras'];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><CatalogIcon /> Catálogo de Materiais</h2>
                <button className="bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] flex items-center gap-2 shadow-sm">
                    <PlusIcon /> Novo Item
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Buscar por nome, marca ou tipo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-3 rounded-lg border bg-white dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none transition"
                    />
                    <SearchIcon className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border ${filterCategory === cat ? 'bg-[#3e3535] text-white border-[#3e3535] dark:bg-[#d4ac6e] dark:text-[#3e3535] dark:border-[#d4ac6e]' : 'bg-white dark:bg-[#2d2424] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e]'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMaterials.map(material => (
                    <div key={material.id} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] shadow-sm hover:shadow-md transition flex flex-col justify-between h-full group">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider
                                    ${material.category === 'Ferragens' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                                      material.category === 'Madeiras' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {material.category}
                                </span>
                                {material.color ? (
                                    <div className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: material.color }}></div>
                                ) : (
                                    <TagIcon className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                            <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-1 line-clamp-2 text-sm group-hover:text-[#d4ac6e] transition-colors" title={material.name}>{material.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">{material.supplier}</p>
                        </div>
                        <div className="flex justify-between items-end border-t border-gray-100 dark:border-[#4a4040] pt-3">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase">Preço Estimado</p>
                                <p className="text-lg font-bold text-[#d4ac6e]">R$ {material.price.toFixed(2)}</p>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-50 dark:bg-[#2d2424] px-2 py-1 rounded">/ {material.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
