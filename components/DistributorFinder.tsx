import React, { useState, useEffect } from 'react';
import { generateGroundedResponse } from '../services/geminiService';
import type { Distributor } from '../types';
import { Spinner, StoreIcon } from './Shared';

interface DistributorFinderProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (message: string, title?: string) => void;
}

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
                    setError("Não foi possível obter sua localização. Por favor, habilite a permissão de geolocalização no seu navegador.");
                    showAlert("Não foi possível obter sua localização. Por favor, habilite a permissão de geolocalização no seu navegador.", "Erro de Localização");
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [isOpen]);

    const findDistributors = async (userLocation: { latitude: number; longitude: number }) => {
        const prompt = "Encontre distribuidores de chapas de MDF e materiais para marcenaria perto da minha localização atual. Dê prioridade para encontrar filiais dos seguintes grandes fornecedores, incluindo seus sites e endereços: Leo Madeiras (leomadeiras.com.br), GMAD (gmad.com.br), Gasômetro Madeiras (gasometromadeiras.com.br), Duratex, Arauco, Guararapes e Sudati. Liste os principais encontrados.";
        try {
            const { sources } = await generateGroundedResponse(prompt, userLocation);
            const foundDistributors = sources
                .filter(source => source.maps)
                .map(source => ({
                    title: source.maps.title,
                    uri: source.maps.uri,
                }));
            
            if (foundDistributors.length === 0) {
                 setError("Nenhum distribuidor encontrado na sua região com base na busca automática. Tente a pesquisa manual.");
            } else {
                setDistributors(foundDistributors);
            }

        } catch (apiError) {
            console.error("Error finding distributors:", apiError);
            setError("Ocorreu um erro ao buscar por distribuidores.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-gray-900/90 z-50 flex flex-col justify-center items-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-2xl h-[80vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col">
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2"><StoreIcon /> Distribuidores Próximos</h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>
                <main className="p-4 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-[#8a7e7e] dark:text-[#a89d8d]">
                            <Spinner />
                            <p className="mt-4">Buscando distribuidores na sua região...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-red-500 dark:text-red-400">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {distributors.map((distributor, index) => (
                                <a 
                                    key={index}
                                    href={distributor.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-[#f0e9dc] dark:bg-[#4a4040] p-4 rounded-lg hover:bg-[#e6ddcd] dark:hover:bg-[#5a4f4f] hover:border-[#d4ac6e] dark:hover:border-[#d4ac6e] border border-transparent transition-all"
                                >
                                    <h3 className="font-semibold text-[#b99256] dark:text-[#d4ac6e]">{distributor.title}</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-500 hover:underline">Ver no mapa</p>
                                </a>
                            ))}
                        </div>
                    )}
                </main>
                 <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] text-center">
                    <p className="text-xs text-[#a89d8d] dark:text-[#8a7e7e]">Resultados fornecidos pelo Google Maps. A precisão pode variar.</p>
                </footer>
            </div>
        </div>
    );
};