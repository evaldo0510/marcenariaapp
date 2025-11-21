
import React, { useState } from 'react';
import { ReceiptIcon, PlusIcon, TrashIcon, DownloadIcon, CurrencyDollarIcon } from './Shared';

interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Quote {
    id: string;
    clientName: string;
    date: number;
    status: 'draft' | 'sent' | 'approved' | 'rejected';
    items: QuoteItem[];
    discount: number;
}

export const QuotationSystem: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([
        { id: '1', clientName: 'João Silva', date: Date.now(), status: 'sent', items: [{ id: 'a', description: 'Armário Cozinha', quantity: 1, unitPrice: 2500 }], discount: 0 }
    ]);
    const [isCreating, setIsCreating] = useState(false);
    const [currentQuote, setCurrentQuote] = useState<Partial<Quote>>({ items: [] });

    const addItem = () => {
        const newItem = { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 };
        setCurrentQuote({ ...currentQuote, items: [...(currentQuote.items || []), newItem] });
    };

    const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
        const items = currentQuote.items?.map(item => item.id === id ? { ...item, [field]: value } : item);
        setCurrentQuote({ ...currentQuote, items });
    };

    const removeItem = (id: string) => {
        const items = currentQuote.items?.filter(item => item.id !== id);
        setCurrentQuote({ ...currentQuote, items });
    };

    const calculateTotal = (items: QuoteItem[] = []) => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const handleSave = () => {
        if (!currentQuote.clientName) return;
        const newQuote: Quote = {
            id: currentQuote.id || Date.now().toString(),
            clientName: currentQuote.clientName,
            date: currentQuote.date || Date.now(),
            status: currentQuote.status || 'draft',
            items: currentQuote.items || [],
            discount: currentQuote.discount || 0
        };
        
        if (currentQuote.id) {
            setQuotes(quotes.map(q => q.id === currentQuote.id ? newQuote : q));
        } else {
            setQuotes([...quotes, newQuote]);
        }
        setIsCreating(false);
        setCurrentQuote({ items: [] });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-200 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        const labels: Record<string, string> = {
            draft: 'Rascunho',
            sent: 'Enviado',
            approved: 'Aprovado',
            rejected: 'Rejeitado'
        };
        return <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status]}`}>{labels[status]}</span>;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {!isCreating ? (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-[#b99256] flex items-center gap-2"><ReceiptIcon /> Cotações e Orçamentos</h2>
                        <button onClick={() => { setIsCreating(true); setCurrentQuote({ items: [] }); }} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] flex items-center gap-2">
                            <PlusIcon /> Nova Cotação
                        </button>
                    </div>
                    <div className="overflow-x-auto bg-white dark:bg-[#3e3535] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-[#2d2424] text-gray-500">
                                <tr>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                                {quotes.map(quote => (
                                    <tr key={quote.id}>
                                        <td className="p-4 font-medium">{quote.clientName}</td>
                                        <td className="p-4">{new Date(quote.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold">R$ {(calculateTotal(quote.items) - quote.discount).toFixed(2)}</td>
                                        <td className="p-4">{getStatusBadge(quote.status)}</td>
                                        <td className="p-4 flex gap-2">
                                            <button onClick={() => { setCurrentQuote(quote); setIsCreating(true); }} className="text-blue-600 hover:underline">Editar</button>
                                            <button className="text-gray-600 hover:text-gray-800"><DownloadIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-[#3e3535] p-6 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Nova Cotação</h3>
                        <span className="text-sm text-gray-500">#{currentQuote.id || 'NOVO'}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Cliente</label>
                            <input type="text" value={currentQuote.clientName || ''} onChange={e => setCurrentQuote({...currentQuote, clientName: e.target.value})} placeholder="Nome do Cliente" className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select value={currentQuote.status || 'draft'} onChange={e => setCurrentQuote({...currentQuote, status: e.target.value as any})} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f]">
                                <option value="draft">Rascunho</option>
                                <option value="sent">Enviado</option>
                                <option value="approved">Aprovado</option>
                                <option value="rejected">Rejeitado</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="font-bold mb-2">Itens</h4>
                        <table className="w-full text-sm mb-2">
                            <thead className="bg-gray-100 dark:bg-[#2d2424]">
                                <tr>
                                    <th className="p-2 text-left">Descrição</th>
                                    <th className="p-2 w-20">Qtd</th>
                                    <th className="p-2 w-32">Preço Unit.</th>
                                    <th className="p-2 w-32">Total</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentQuote.items?.map(item => (
                                    <tr key={item.id} className="border-b dark:border-[#4a4040]">
                                        <td className="p-2"><input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="w-full bg-transparent" /></td>
                                        <td className="p-2"><input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent" /></td>
                                        <td className="p-2"><input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))} className="w-full bg-transparent" /></td>
                                        <td className="p-2">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                                        <td className="p-2"><button onClick={() => removeItem(item.id)} className="text-red-500"><TrashIcon /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addItem} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">+ Adicionar Item</button>
                    </div>

                    <div className="flex justify-end mb-6">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-bold">R$ {calculateTotal(currentQuote.items).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Desconto:</span>
                                <input type="number" value={currentQuote.discount || 0} onChange={e => setCurrentQuote({...currentQuote, discount: parseFloat(e.target.value)})} className="w-20 p-1 text-right rounded border bg-gray-50 dark:bg-[#2d2424]" />
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span>Total:</span>
                                <span className="text-[#d4ac6e]">R$ {(calculateTotal(currentQuote.items) - (currentQuote.discount || 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded bg-[#d4ac6e] text-[#3e3535] font-bold hover:bg-[#c89f5e]">Salvar Cotação</button>
                    </div>
                </div>
            )}
        </div>
    );
};
