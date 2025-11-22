
import React, { useState, useEffect, useMemo } from 'react';
import type { Client, ProjectHistoryItem } from '../types';
import { UsersIcon, SearchIcon, WandIcon, TrashIcon, ConfirmationModal } from './Shared';

interface ClientPanelProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    projects: ProjectHistoryItem[];
    onSaveClient: (client: Omit<Client, 'id' | 'timestamp'> & { id?: string }) => void;
    onDeleteClient: (id: string) => void;
    onViewProject: (project: ProjectHistoryItem) => void;
}

const emptyForm: Omit<Client, 'id' | 'timestamp'> & { id?: string } = { name: '', email: '', phone: '', address: '', notes: '', status: 'lead' };

const statusOptions: { value: Client['status']; label: string; color: string }[] = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-500' },
    { value: 'active', label: 'Ativo', color: 'bg-green-500' },
    { value: 'completed', label: 'Concluído', color: 'bg-purple-500' },
    { value: 'on-hold', label: 'Em Pausa', color: 'bg-yellow-500' },
];

export const ClientPanel: React.FC<ClientPanelProps> = ({
    isOpen,
    onClose,
    clients,
    projects,
    onSaveClient,
    onDeleteClient,
    onViewProject
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);
    
    useEffect(() => {
        if (!isOpen) {
            // Reset form when panel is closed
            setFormData(emptyForm);
            setIsEditing(false);
            setSearchTerm('');
            setExpandedClientId(null);
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSaveClient(formData);
        setFormData(emptyForm);
        setIsEditing(false);
    };

    const handleEdit = (client: Client) => {
        setFormData(client);
        setIsEditing(true);
        document.getElementById('client-panel-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData(emptyForm);
        setIsEditing(false);
    };

    const toggleExpand = (clientId: string) => {
        setExpandedClientId(prev => (prev === clientId ? null : clientId));
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black bg-opacity-60' : 'pointer-events-none'}`} onClick={onClose}>
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-[#f5f1e8] dark:bg-[#3e3535] text-[#3e3535] dark:text-[#f5f1e8] shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#fffefb] dark:bg-[#3e3535]">
                        <h2 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2"><UsersIcon /> Clientes</h2>
                        <button onClick={onClose} className="text-[#8a7e7e] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                    </header>
                    
                    {/* Form Section */}
                    <div id="client-panel-form" className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] bg-[#fffefb] dark:bg-[#3e3535]">
                         <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-3">{isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
                         <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="client-name" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Nome do Cliente *</label>
                                    <input id="client-name" type="text" name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} required className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                                </div>
                                <div>
                                    <label htmlFor="client-status" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Status</label>
                                    <select id="client-status" name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]">
                                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="client-email" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">E-mail</label>
                                    <input id="client-email" type="email" name="email" placeholder="email@cliente.com" value={formData.email} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                                </div>
                                <div>
                                    <label htmlFor="client-phone" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Telefone</label>
                                    <input id="client-phone" type="tel" name="phone" placeholder="(XX) XXXXX-XXXX" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="client-address" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Endereço</label>
                                <textarea id="client-address" name="address" placeholder="Rua, número, bairro, cidade..." value={formData.address} onChange={handleInputChange} rows={2} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                            </div>
                            <div>
                                <label htmlFor="client-notes" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Notas</label>
                                <textarea id="client-notes" name="notes" placeholder="Preferências, histórico de contatos, etc." value={formData.notes} onChange={handleInputChange} rows={3} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                            </div>
                            <div className="flex justify-end gap-3">
                                {isEditing && <button type="button" onClick={handleCancelEdit} className="bg-[#8a7e7e] hover:bg-[#6a5f5f] text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>}
                                <button type="submit" className="bg-[#3e3535] dark:bg-[#d4ac6e] hover:bg-[#2d2424] dark:hover:bg-[#c89f5e] text-white dark:text-[#3e3535] font-bold py-2 px-4 rounded-lg">{isEditing ? 'Salvar Alterações' : 'Adicionar Cliente'}</button>
                            </div>
                         </form>
                    </div>

                    {/* List Section */}
                    <div className="p-4 bg-[#f0e9dc] dark:bg-[#3e3535]/50 border-b border-[#e6ddcd] dark:border-[#4a4040]">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#fffefb] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-2 pl-10 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e]"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89d8d] pointer-events-none"><SearchIcon /></div>
                        </div>
                    </div>

                    <main className="flex-grow overflow-y-auto p-4 bg-[#f5f1e8] dark:bg-[#3e3535]">
                        {clients.length === 0 ? (
                            <div className="text-center text-[#8a7e7e] dark:text-[#a89d8d] py-10 h-full flex flex-col justify-center items-center">
                                <p className="font-semibold text-lg">Nenhum cliente cadastrado.</p>
                                <p className="text-sm">Use o formulário acima para começar.</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                             <div className="text-center text-[#8a7e7e] dark:text-[#a89d8d] py-10 h-full flex flex-col justify-center items-center">
                                <p className="font-semibold text-lg">Nenhum cliente encontrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredClients.map(client => {
                                    const clientProjects = projects.filter(p => p.clientId === client.id);
                                    const isExpanded = expandedClientId === client.id;
                                    const statusInfo = statusOptions.find(s => s.value === client.status) || { label: 'Indefinido', color: 'bg-gray-500' };

                                    return (
                                        <div key={client.id} className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm overflow-hidden animate-fadeIn">
                                            <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040]/50 transition" onClick={() => toggleExpand(client.id)}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-3 h-3 rounded-full ${statusInfo.color}`}></span>
                                                        <p className="font-semibold text-[#3e3535] dark:text-[#f5f1e8]">{client.name}</p>
                                                    </div>
                                                    <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] pl-5">{client.email || 'Sem e-mail'}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="p-2 rounded-full text-[#8a7e7e] hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition" title="Editar Cliente">
                                                        <WandIcon />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setConfirmModal({
                                                                isOpen: true,
                                                                title: 'Excluir Cliente',
                                                                message: `Tem certeza que deseja remover o cliente ${client.name}?`,
                                                                onConfirm: () => { onDeleteClient(client.id); setConfirmModal(prev => ({...prev, isOpen: false})); }
                                                            });
                                                        }}
                                                        className="p-2 rounded-full text-[#8a7e7e] hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition" 
                                                        title="Excluir Cliente"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424]/50 animate-fadeIn">
                                                    <div className="space-y-3">
                                                        {client.phone && <p className="text-sm"><strong className="text-[#6a5f5f] dark:text-[#c7bca9]">Telefone:</strong> {client.phone}</p>}
                                                        {client.address && <p className="text-sm"><strong className="text-[#6a5f5f] dark:text-[#c7bca9]">Endereço:</strong> {client.address}</p>}
                                                        {client.notes && <div className="p-2 bg-[#f5f1e8] dark:bg-[#3e3535] rounded-md"><p className="text-sm whitespace-pre-wrap">{client.notes}</p></div>}
                                                        {clientProjects.length > 0 ? (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mt-3 text-[#6a5f5f] dark:text-[#c7bca9]">Projetos:</h4>
                                                                <ul className="list-disc list-inside text-sm mt-1">
                                                                    {clientProjects.map(p => (
                                                                        <li key={p.id}>
                                                                            <button onClick={(e) => { e.stopPropagation(); onViewProject(p); }} className="text-amber-700 dark:text-amber-500 hover:underline">{p.name}</button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm italic text-[#8a7e7e] dark:text-[#a89d8d] mt-2">Nenhum projeto associado.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
            />
        </div>
    );
};
