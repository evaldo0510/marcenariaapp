
import React, { useState, useEffect, useMemo } from 'react';
import type { Client, ProjectHistoryItem } from '../types';
import { UsersIcon, SearchIcon, WandIcon, TrashIcon, ConfirmationModal, CalendarIcon, ClockIcon, HistoryIcon, Button } from './Shared';

interface ClientPanelProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    projects: ProjectHistoryItem[];
    onSaveClient: (client: Omit<Client, 'id' | 'timestamp'> & { id?: string }) => void;
    onDeleteClient: (id: string) => void;
    onViewProject: (project: ProjectHistoryItem) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const emptyForm: Omit<Client, 'id' | 'timestamp'> & { id?: string } = { 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    notes: '', 
    status: 'lead',
    lastContactDate: '',
    followUpStatus: 'no-action'
};

const statusOptions: { value: Client['status']; label: string; color: string }[] = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-500' },
    { value: 'active', label: 'Ativo', color: 'bg-green-500' },
    { value: 'completed', label: 'Concluído', color: 'bg-purple-500' },
    { value: 'on-hold', label: 'Em Pausa', color: 'bg-yellow-500' },
];

const followUpOptions: { value: Client['followUpStatus']; label: string }[] = [
    { value: 'no-action', label: 'Sem Ação' },
    { value: 'pending', label: 'Pendente' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'completed', label: 'Realizado' },
];

export const ClientPanel: React.FC<ClientPanelProps> = ({
    isOpen,
    onClose,
    clients,
    projects,
    onSaveClient,
    onDeleteClient,
    onViewProject,
    showToast
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
            setClientToDelete(null);
            setErrors({});
        }
    }, [isOpen]);

    const validateField = (name: string, value: string) => {
        let error = '';
        if (name === 'name' && !value.trim()) {
            error = 'O nome é obrigatório.';
        } else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'E-mail inválido.';
        } else if (name === 'phone' && value && value.length < 10) {
            error = 'Telefone inválido.';
        }
        return error;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Real-time validation
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final validation check
        const nameError = validateField('name', formData.name);
        const emailError = validateField('email', formData.email || '');
        
        if (nameError || emailError) {
            setErrors({ name: nameError, email: emailError });
            return;
        }

        onSaveClient(formData);
        setFormData(emptyForm);
        setIsEditing(false);
        setErrors({});
    };

    const handleEdit = (client: Client) => {
        setFormData({
            ...client,
            lastContactDate: client.lastContactDate || '',
            followUpStatus: client.followUpStatus || 'no-action'
        });
        setIsEditing(true);
        setErrors({});
        document.getElementById('client-panel-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData(emptyForm);
        setIsEditing(false);
        setErrors({});
    };

    const toggleExpand = (clientId: string) => {
        setExpandedClientId(prev => (prev === clientId ? null : clientId));
    };

    const getInputClass = (error?: string) => {
        const base = "w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border transition focus:outline-none focus:ring-2";
        if (error) {
            return `${base} border-red-500 focus:ring-red-500 focus:border-red-500`;
        }
        return `${base} border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]`;
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
                                    <input id="client-name" type="text" name="name" placeholder="Nome Completo" value={formData.name} onChange={handleInputChange} required className={getInputClass(errors.name)} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                                    <input id="client-email" type="email" name="email" placeholder="email@cliente.com" value={formData.email} onChange={handleInputChange} className={getInputClass(errors.email)} />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label htmlFor="client-phone" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Telefone</label>
                                    <input id="client-phone" type="tel" name="phone" placeholder="(XX) XXXXX-XXXX" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="client-lastContact" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Último Contato</label>
                                    <input id="client-lastContact" type="date" name="lastContactDate" value={formData.lastContactDate} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]" />
                                </div>
                                <div>
                                    <label htmlFor="client-followUp" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-1">Acompanhamento (Follow-up)</label>
                                    <select id="client-followUp" name="followUpStatus" value={formData.followUpStatus} onChange={handleInputChange} className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] p-2 rounded-lg border border-[#dcd6c8] dark:border-[#5a4f4f] focus:ring-[#d4ac6e] focus:border-[#d4ac6e]">
                                        {followUpOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
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
                                {isEditing && <Button type="button" onClick={handleCancelEdit} label="Cancelar" variant="secondary" />}
                                <Button type="submit" label={isEditing ? 'Salvar Alterações' : 'Adicionar Cliente'} disabled={Object.keys(errors).some(k => !!errors[k])} />
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
                                    const followUpLabel = followUpOptions.find(f => f.value === client.followUpStatus)?.label || 'Sem Ação';

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
                                                <div className="flex items-center gap-3">
                                                    {client.followUpStatus === 'pending' && (
                                                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" /> Pendente
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }} className="p-2 rounded-full text-[#8a7e7e] hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 transition" title="Editar Cliente">
                                                            <WandIcon />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setClientToDelete(client.id); }} className="p-2 rounded-full text-[#8a7e7e] hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition" title="Excluir Cliente">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424]/50 animate-fadeIn">
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            {client.phone && <p><strong className="text-[#6a5f5f] dark:text-[#c7bca9]">Telefone:</strong> {client.phone}</p>}
                                                            {client.lastContactDate && <p className="flex items-center gap-1"><strong className="text-[#6a5f5f] dark:text-[#c7bca9]"><CalendarIcon className="w-3 h-3 inline" /> Último Contato:</strong> {new Date(client.lastContactDate).toLocaleDateString()}</p>}
                                                            <p><strong className="text-[#6a5f5f] dark:text-[#c7bca9]">Status Follow-up:</strong> {followUpLabel}</p>
                                                        </div>
                                                        {client.address && <p className="text-sm"><strong className="text-[#6a5f5f] dark:text-[#c7bca9]">Endereço:</strong> {client.address}</p>}
                                                        {client.notes && <div className="p-2 bg-[#f5f1e8] dark:bg-[#3e3535] rounded-md"><p className="text-sm whitespace-pre-wrap">{client.notes}</p></div>}
                                                        
                                                        <div className="mt-4 pt-3 border-t border-[#dcd6c8] dark:border-[#5a4f4f]">
                                                            <h4 className="text-sm font-bold text-[#6a5f5f] dark:text-[#c7bca9] flex items-center gap-2 mb-2">
                                                                <HistoryIcon className="w-4 h-4"/> Histórico de Projetos ({clientProjects.length})
                                                            </h4>
                                                            {clientProjects.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {clientProjects.map(p => (
                                                                        <li key={p.id} className="flex justify-between items-center bg-[#fffefb] dark:bg-[#4a4040] p-2 rounded border border-[#e6ddcd] dark:border-[#5a4f4f]">
                                                                            <span className="text-sm font-medium text-[#3e3535] dark:text-[#f5f1e8]">{p.name}</span>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-xs text-[#8a7e7e]">{new Date(p.timestamp).toLocaleDateString()}</span>
                                                                                <button onClick={(e) => { e.stopPropagation(); onViewProject(p); }} className="text-xs text-amber-700 dark:text-amber-500 hover:underline font-bold">Ver</button>
                                                                            </div>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm italic text-[#8a7e7e] dark:text-[#a89d8d]">Nenhum projeto associado.</p>
                                                            )}
                                                        </div>
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
                <ConfirmationModal
                    isOpen={!!clientToDelete}
                    onClose={() => setClientToDelete(null)}
                    onConfirm={() => { if (clientToDelete) onDeleteClient(clientToDelete); }}
                    title="Excluir Cliente"
                    message="Tem certeza que deseja remover este cliente? O histórico de projetos será mantido, mas desvinculado."
                    confirmText="Excluir"
                    isDangerous={true}
                />
            </div>
        </div>
    );
};
