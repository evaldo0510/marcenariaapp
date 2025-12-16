import React, { useState, useEffect } from 'react';
import { ClientPanel } from './ClientPanel';
import { getClients, saveClient, removeClient, getHistory } from '../services/historyService';

export const ClientManager = ({ user, onClose }: any) => {
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const c = await getClients();
            const h = await getHistory();
            setClients(c);
            setProjects(h);
        };
        load();
    }, []);

    const handleSave = async (client: any) => {
        await saveClient(client);
        setClients(await getClients());
    };
    const handleDelete = async (id: string) => {
        if (confirm('Excluir?')) {
            await removeClient(id);
            setClients(await getClients());
        }
    };

    return (
        <ClientPanel 
            isOpen={true} 
            onClose={onClose} 
            clients={clients} 
            projects={projects}
            onSaveClient={handleSave}
            onDeleteClient={handleDelete}
            onViewProject={() => {}} 
        />
    );
}