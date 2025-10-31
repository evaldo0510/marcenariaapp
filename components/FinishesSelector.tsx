import React, { useState, useEffect, useRef } from 'react';
import type { Finish } from '../types';
import { searchFinishes } from '../services/geminiService';
import { Spinner, SearchIcon, MicIcon, StarIcon } from './Shared';

interface FinishesSelectorProps {
  onFinishSelect: (selection: { manufacturer: string; finish: Finish; handleDetails?: string } | null) => void;
  value: { manufacturer: string; finish: Finish; handleDetails?: string } | null;
  showAlert: (message: string, title?: string) => void;
  favoriteFinishes: Finish[];
  onToggleFavorite: (finish: Finish) => void;
}

export const FinishesSelector: React.FC<FinishesSelectorProps> = ({ onFinishSelect, value, showAlert, favoriteFinishes, onToggleFavorite }) => {
    const [handleDetails, setHandleDetails] = useState('');
    const [iaraSearchState, setIaraSearchState] = useState({
        query: '',
        isSearching: false,
        results: [] as Finish[],
        attempted: false,
    });
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (value) {
            setHandleDetails(value.handleDetails || '');
        } else {
            setHandleDetails('');
        }
    }, [value]);
    
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim();
                setIaraSearchState(prev => ({...prev, query: (prev.query ? prev.query.trim() + ' ' : '') + transcript }));
            };
            
            recognition.onstart = () => setIsRecording(true);
            recognition.onend = () => setIsRecording(false);

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                let errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    errorMessage = "A permissão para usar o microfone foi negada.";
                } else if (event.error === 'no-speech') {
                    errorMessage = "Nenhuma fala foi detectada.";
                }
                showAlert(errorMessage, "Erro de Gravação");
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [showAlert]);

    const handleRecord = () => {
        if (!recognitionRef.current) {
            showAlert("O reconhecimento de voz não é suportado pelo seu navegador.", "Funcionalidade Indisponível");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'InvalidStateError')) {
                     console.error("Could not start speech recognition:", error);
                    showAlert("Não foi possível iniciar a gravação. Tente novamente.", "Erro");
                }
            }
        }
    };
    
    const handleSearch = async () => {
        if (!iaraSearchState.query.trim()) {
            showAlert('Por favor, digite uma descrição para a busca.');
            return;
        }
        setIaraSearchState(prev => ({ ...prev, attempted: true, isSearching: true, results: [] }));
        try {
            const results = await searchFinishes(iaraSearchState.query);
            setIaraSearchState(prev => ({ ...prev, results }));
        } catch (error) {
            showAlert(error instanceof Error ? error.message : "Erro na busca", "Erro");
        } finally {
            setIaraSearchState(prev => ({ ...prev, isSearching: false }));
        }
    };

    const handleSelectFinish = (finish: Finish) => {
        const newHandleDetails = finish.type === 'solid' ? 'Puxador Cava' : '';
        setHandleDetails(newHandleDetails);
        onFinishSelect({
            manufacturer: finish.manufacturer,
            finish,
            handleDetails: newHandleDetails ? newHandleDetails : undefined,
        });
    };

    const handleDetailChange = (newDetails: string) => {
        setHandleDetails(newDetails);
        if (value) {
            onFinishSelect({ ...value, handleDetails: newDetails || undefined });
        }
    };
    
    const renderFinishesGrid = (finishes: Finish[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {finishes.map(finish => {
                const isFavorite = favoriteFinishes.some(fav => fav.id === finish.id);
                return (
                    <button
                        key={finish.id}
                        onClick={() => handleSelectFinish(finish)}
                        className={`relative bg-[#fffefb] dark:bg-[#4a4040] rounded-lg text-left border-2 transition-all duration-200 h-full flex flex-col overflow-hidden group ${value?.finish.id === finish.id ? 'border-[#d4ac6e] scale-105' : 'border-[#e6ddcd] dark:border-[#4a4040] hover:border-[#c7bca9] dark:hover:border-[#5a4f4f]'}`}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(finish);
                            }}
                            className="absolute top-2 right-2 z-10 p-1.5 bg-black/40 rounded-full text-yellow-400 hover:bg-black/60 transition"
                            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                            <StarIcon isFavorite={isFavorite} />
                        </button>

                        <div className="w-full h-24 bg-[#e6ddcd] dark:bg-[#2d2424] overflow-hidden">
                            {finish.imageUrl && (
                                <img 
                                    src={finish.imageUrl} 
                                    alt={finish.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const textDiv = document.createElement('div');
                                            textDiv.className = 'w-full h-full flex items-center justify-center text-xs text-[#8a7e7e] dark:text-[#a89d8d] p-2 text-center';
                                            textDiv.innerText = finish.name;
                                            parent.appendChild(textDiv);
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div className="p-3 flex flex-col justify-between flex-grow">
                            <div>
                                <div className="font-semibold text-[#3e3535] dark:text-[#f5f1e8] text-sm truncate">{finish.name}</div>
                                <div className="text-xs text-[#6a5f5f] dark:text-[#c7bca9] mt-1 h-8 line-clamp-2">{finish.description}</div>
                            </div>
                            <div className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] mt-2 font-medium self-end">{finish.manufacturer}</div>
                        </div>
                    </button>
                )
            })}
        </div>
    );
    
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Passo 2: Escolha o Acabamento</h2>

            {favoriteFinishes.length > 0 && (
                <div className="mb-6 p-4 bg-[#f0e9dc] dark:bg-[#2d2424]/50 rounded-lg animate-fadeIn">
                    <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-4">Seus Favoritos:</h3>
                    {renderFinishesGrid(favoriteFinishes)}
                </div>
            )}
            
            <div className="bg-[#f0e9dc] dark:bg-[#2d2424]/50 p-4 rounded-lg">
                <p className="text-[#6a5f5f] dark:text-[#c7bca9] mb-3 text-center">
                    Não sabe o nome do acabamento? Descreva-o para a Iara ou use o microfone para falar. <br/>
                    <span className="text-sm text-[#8a7e7e] dark:text-[#a89d8d]">Ex: "MDF amadeirado claro com veios suaves" ou "laminado cinza fosco".</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <input 
                            type="text"
                            value={iaraSearchState.query}
                            onChange={(e) => setIaraSearchState(prev => ({ ...prev, query: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Descreva o acabamento ou use o microfone"
                            className="w-full bg-[#fffefb] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 pr-12 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                        <button onClick={handleRecord} className={`absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse-scale' : 'bg-[#e6ddcd] dark:bg-[#4a4040] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'}`}>
                            <MicIcon isRecording={isRecording} />
                        </button>
                    </div>

                    <button onClick={handleSearch} disabled={iaraSearchState.isSearching} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {iaraSearchState.isSearching ? <Spinner size="sm" /> : <SearchIcon />}
                        <span>{iaraSearchState.isSearching ? 'Buscando...' : 'Buscar'}</span>
                    </button>
                </div>
                <div className="mt-6">
                    {iaraSearchState.isSearching ? (
                        <div className="text-center p-8 animate-fadeIn">
                            <Spinner />
                            <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">Consultando assistente Iara... Isso pode levar alguns segundos.</p>
                        </div>
                    ) : iaraSearchState.attempted ? (
                        iaraSearchState.results.length > 0 ? (
                            <div className="animate-fadeIn">
                                <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-4">Resultados da Busca:</h3>
                                {renderFinishesGrid(iaraSearchState.results)}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-[#8a7e7e] dark:text-[#a89d8d] animate-fadeIn bg-[#e6ddcd] dark:bg-[#2d2424] rounded-lg">
                                <p className="font-semibold text-[#6a5f5f] dark:text-[#c7bca9]">Nenhum acabamento encontrado para "{iaraSearchState.query}"</p>
                                <p className="text-sm mt-2">Tente usar termos diferentes, como "madeira de demolição" ou "MDF cinza fosco".</p>
                            </div>
                        )
                    ) : null}
                </div>
            </div>
            
            {value?.finish.type === 'solid' && (
                <div className="mt-4 pt-4 border-t border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
                    <label className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9] mb-2">Detalhes do Puxador (para cores sólidas):</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            onClick={() => handleDetailChange('Puxador Cava')}
                            className={`py-1 px-3 rounded-full text-sm font-medium transition-colors ${handleDetails === 'Puxador Cava' ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'}`}
                        >
                            Puxador Cava
                        </button>
                        {['Perfil Dourado', 'Sem Puxador (Toque)'].map(detail => (
                            <button
                                key={detail}
                                onClick={() => handleDetailChange(detail)}
                                className={`py-1 px-3 rounded-full text-sm font-medium transition-colors ${handleDetails === detail ? 'bg-[#d4ac6e] text-[#3e3535]' : 'bg-[#e6ddcd] dark:bg-[#4a4040] text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f]'}`}
                            >
                                {detail}
                            </button>
                        ))}
                    </div>
                    <input 
                        type="text"
                        value={handleDetails}
                        onChange={(e) => handleDetailChange(e.target.value)}
                        placeholder="Ou descreva um puxador customizado"
                        className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                    />
                </div>
            )}
        </div>
    );
};