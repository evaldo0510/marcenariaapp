import React, { useState, useEffect } from 'react';
import { findLocalSuppliers } from '../services/geminiService';
import type { Distributor } from '../types';
import { Spinner, StoreIcon, MapPinIcon, LinkIcon, StarIcon } from './Shared';

interface DistributorFinderProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

// Lista estática de parceiros nacionais para acesso imediato
const NATIONAL_PARTNERS = [
    { 
        title: 'Leo Madeiras', 
        uri: 'https://www.leomadeiras.com.br/nossas-lojas', 
        desc: 'Maior rede de insumos para marcenaria do Brasil.',
        badge: 'Diamante'
    },
    { 
        title: 'GMAD', 
        uri: 'https://gmad.com.br/nossas-lojas/', 
        desc: 'Soluções completas em madeira e ferragens.',
        badge: 'Ouro'
    },
    { 
        title: 'Gasômetro Madeiras', 
        uri: 'https://www.gasometromadeiras.com.br/institucional/nossas-lojas', 
        desc: 'Tradição e variedade em ferramentas e chapas.',
        badge: 'Prata'
    },
    { 
        title: 'Rede Pró', 
        uri: 'https://www.redepro.com.br/encontre-uma-loja', 
        desc: 'Rede associativa de revendas especializadas.',
        badge: 'Prata'
    },
];

type LocationState = { latitude: number; longitude: number } | null;

export const DistributorFinder: React.FC<DistributorFinderProps> = ({ isOpen, onClose, showAlert }) => {
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<LocationState>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null);
            setDistributors([]);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setLocation(userLocation);
                    findDistributors(userLocation);
                },
                (geoError) => {
                    console.error("Geolocation error:", geoError);
                    setError("Não foi possível obter sua localização. Por favor, habilite a permissão de geolocalização no seu navegador para busca local.");
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [isOpen]);

    const findDistributors = async (userLocation: { latitude: number; longitude: number }) => {
        try {
            const foundDistributors = await findLocalSuppliers(userLocation);
            
            if (foundDistributors.length === 0) {
                 setError("Nenhuma madeireira encontrada próxima à sua região com base na busca automática.");
            } else {
                setDistributors(foundDistributors);
            }

        } catch (apiError) {
            console.error("Error finding distributors:", apiError);
            setError("Ocorreu um erro ao buscar madeireiras locais. Verifique sua conexão.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-gray-900/90 z-50 flex flex-col justify-center items-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-3xl h-[85vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col">
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f0e9dc] dark:bg-[#2d2424]">
                    <h2 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                        <StoreIcon className="text-[#d4ac6e]" /> Central de Fornecedores
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                
                <main className="p-6 flex-grow overflow-y-auto">
                    {/* Seção 1: Parceiros Nacionais (Sempre visível) */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2">
                            <StarIcon className="w-5 h-5" /> Redes Parceiras Nacionais
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {NATIONAL_PARTNERS.map((partner, index) => (
                                <a 
                                    key={index}
                                    href={partner.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col bg-white dark:bg-[#3e3535] p-4 rounded-xl border border-[#e6ddcd] dark:border-[#5a4f4f] hover:border-[#d4ac6e] hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] text-lg group-hover:text-[#d4ac6e] transition-colors">{partner.title}</h4>
                                        <span className="bg-[#d4ac6e] text-[#3e3535] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{partner.badge}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow">{partner.desc}</p>
                                    <div className="text-xs font-bold text-[#d4ac6e] flex items-center gap-1 mt-auto">
                                        <LinkIcon className="w-3 h-3" /> Acessar Loja Online / Localizador
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-[#e6ddcd] dark:border-[#4a4040] my-6"></div>

                    {/* Seção 2: Busca Local Dinâmica */}
                    <div>
                        <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5 text-[#d4ac6e]" /> Na Sua Região
                        </h3>
                        
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-[#8a7e7e] dark:text-[#a89d8d] bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-xl">
                                <Spinner size="lg" />
                                <p className="mt-4 font-medium">Localizando madeireiras próximas...</p>
                                <p className="text-xs opacity-70">Utilizando Google Maps Intelligence</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800">
                                <p>{error}</p>
                                <button 
                                    onClick={() => location && findDistributors(location)} 
                                    className="mt-2 text-sm font-bold underline hover:text-red-700"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {distributors.length > 0 ? distributors.map((distributor, index) => (
                                    <a 
                                        key={index}
                                        href={distributor.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#3e3535] border border-transparent hover:border-[#d4ac6e] transition-all"
                                    >
                                        <div>
                                            <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{distributor.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3" /> Resultado Local Google Maps
                                            </p>
                                        </div>
                                        <span className="text-sm text-[#d4ac6e] font-bold hover:underline flex items-center gap-1">
                                            Ver Mapa <span className="text-lg">→</span>
                                        </span>
                                    </a>
                                )) : (
                                    <p className="text-center text-gray-500 py-8">Nenhum resultado local encontrado. Tente as redes nacionais acima.</p>
                                )}
                            </div>
                        )}
                    </div>
                </main>
                 <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] text-center bg-[#fffefb] dark:bg-[#3e3535] rounded-b-lg">
                    <p className="text-xs text-[#a89d8d] dark:text-[#8a7e7e]">Resultados locais fornecidos pelo Google Maps. As redes parceiras são sugestões verificadas.</p>
                </footer>
            </div>
        </div>
    );
};