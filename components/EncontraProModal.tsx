import React, { useState } from 'react';
import type { ProjectLead } from '../types';
import { findProjectLeads } from '../services/geminiService';
import { Spinner, ProIcon, SearchIcon, CurrencyDollarIcon } from './Shared';

interface EncontraProModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const EncontraProModal: React.FC<EncontraProModalProps> = ({ isOpen, onClose, showAlert }) => {
    const [city, setCity] = useState('');
    const [leads, setLeads] = useState<ProjectLead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!city.trim()) {
            showAlert('Por favor, digite o nome de uma cidade para buscar.', 'Atenção');
            return;
        }
        setIsLoading(true);
        setHasSearched(true);
        setLeads([]);
        try {
            const results = await findProjectLeads(city);
            setLeads(results);
        } catch (error) {
            showAlert(error instanceof Error ? error.message : 'Erro ao buscar por projetos.', 'Erro');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInterest = (lead: ProjectLead) => {
        showAlert(`Simulação: Interesse demonstrado no projeto "${lead.title}". Em um ambiente real, o cliente seria notificado.`, 'Interesse Registrado');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <ProIcon /> Marketplace EncontraPro
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Digite uma cidade para buscar projetos (Ex: São Paulo)"
                            className="flex-grow bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Spinner size="sm" /> : <SearchIcon />}
                            <span>{isLoading ? 'Buscando...' : 'Buscar Projetos'}</span>
                        </button>
                    </div>
                </div>

                <main className="p-4 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center p-16">
                            <Spinner />
                            <p className="mt-4 text-[#8a7e7e] dark:text-[#a89d8d]">Buscando novos projetos para você...</p>
                        </div>
                    ) : leads.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {leads.map((lead, index) => (
                                <div key={lead.id} className="bg-[#f0e9dc] dark:bg-[#3e3535] rounded-lg p-4 border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col justify-between animate-fadeInUp" style={{ animationDelay: `${index * 100}ms`}}>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">{lead.title}</h3>
                                        <p className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] font-semibold">{lead.location}</p>
                                        <p className="text-sm my-2 text-[#6a5f5f] dark:text-[#c7bca9]">{lead.description}</p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                                         <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold">
                                            <CurrencyDollarIcon />
                                            <span>{lead.budget}</span>
                                        </div>
                                        <button onClick={() => handleInterest(lead)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition">
                                            Demonstrar Interesse
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : hasSearched ? (
                        <div className="text-center p-16 text-[#8a7e7e] dark:text-[#a89d8d]">
                            <h3 className="text-xl font-semibold">Nenhum projeto encontrado</h3>
                            <p>Não encontramos nenhum projeto em "{city}" no momento. Tente outra cidade ou verifique novamente mais tarde.</p>
                        </div>
                    ) : (
                         <div className="text-center p-16 text-[#8a7e7e] dark:text-[#a89d8d]">
                            <h3 className="text-xl font-semibold">Encontre seu Próximo Projeto</h3>
                            <p>Digite o nome de uma cidade acima para ver os projetos disponíveis na sua região.</p>
                        </div>
                    )}
                </main>

                <footer className="p-3 border-t border-[#e6ddcd] dark:border-[#4a4040] flex-shrink-0 text-center">
                    <p className="text-xs text-[#a89d8d]">O EncontraPro é um marketplace para conectar clientes e marceneiros. A negociação é feita diretamente entre as partes.</p>
                </footer>
            </div>
        </div>
    );
};
