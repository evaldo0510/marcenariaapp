
import React, { useState, useEffect } from 'react';
import { generateDecorationList } from '../services/geminiService';
import { Spinner, ShoppingBagIcon, CheckIcon, CopyIcon, PaletteIcon } from './Shared';

interface DecorationListModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectDescription: string;
    style: string;
    showAlert: (message: string, title?: string) => void;
}

export const DecorationListModal: React.FC<DecorationListModalProps> = ({ isOpen, onClose, projectDescription, style, showAlert }) => {
    const [items, setItems] = useState<{ item: string, category: string, estimatedPrice: string, suggestion: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadDecorationList();
        }
    }, [isOpen]);

    const loadDecorationList = async () => {
        setIsLoading(true);
        setItems([]);
        try {
            const result = await generateDecorationList(projectDescription, style);
            setItems(result);
        } catch (e) {
            showAlert("Não foi possível gerar a lista de decoração.", "Erro");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyList = () => {
        const text = items.map(i => `• ${i.item} (${i.category}): ${i.estimatedPrice}\n  Dica: ${i.suggestion}`).join('\n\n');
        navigator.clipboard.writeText(text);
        setCopyFeedback("Lista copiada!");
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <ShoppingBagIcon /> Lista de Compras: Decoração
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-4 flex-grow overflow-y-auto">
                    <div className="mb-6 p-4 bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg text-sm text-[#6a5f5f] dark:text-[#c7bca9] flex items-start gap-3">
                        <PaletteIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#d4ac6e]" />
                        <div>
                            <p><strong>Estilo Sugerido:</strong> {style}</p>
                            <p>Esta lista contém itens decorativos que complementam seu projeto 3D, criando uma apresentação mais profissional e completa para seu cliente.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <Spinner size="lg" />
                            <p className="mt-3 text-[#8a7e7e] dark:text-[#a89d8d]">A Iara está selecionando os melhores itens...</p>
                        </div>
                    ) : items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#5a4f4f] hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{item.item}</h4>
                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{item.category}</span>
                                        </div>
                                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">{item.estimatedPrice}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">"{item.suggestion}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Nenhum item encontrado.
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <button onClick={loadDecorationList} disabled={isLoading} className="text-sm text-[#d4ac6e] hover:underline">
                        Gerar Novamente
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleCopyList}
                            className="flex items-center gap-2 px-4 py-2 bg-[#e6ddcd] dark:bg-[#5a4f4f] text-[#3e3535] dark:text-white font-bold rounded-lg hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040] transition"
                        >
                            {copyFeedback ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {copyFeedback || 'Copiar Lista'}
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-[#d4ac6e] text-[#3e3535] font-bold rounded-lg hover:bg-[#c89f5e] transition">
                            Fechar
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
