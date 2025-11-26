
import React, { useState } from 'react';
import { MapPinIcon, StoreIcon, CheckIcon, SearchIcon, GlobeIcon, ArrowRightIcon } from './Shared';

interface PartnerLocatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Simulação de banco de dados de unidades GMAD baseado em faixas de CEP (primeiro dígito)
const GMAD_UNITS: Record<string, { name: string; url: string; city: string }> = {
    '0': { name: 'GMAD Placenter', url: 'https://gmad.com.br/placenter', city: 'São Paulo - SP' },
    '1': { name: 'GMAD Americana', url: 'https://gmad.com.br/americana', city: 'Americana - SP' },
    '2': { name: 'GMAD Rio', url: 'https://gmad.com.br/rio', city: 'Rio de Janeiro - RJ' },
    '3': { name: 'GMAD Minas', url: 'https://gmad.com.br/minas', city: 'Belo Horizonte - MG' },
    '4': { name: 'GMAD Bahia', url: 'https://gmad.com.br/bahia', city: 'Salvador - BA' },
    '5': { name: 'GMAD Nordeste', url: 'https://gmad.com.br/recife', city: 'Recife - PE' },
    '6': { name: 'GMAD Norte', url: 'https://gmad.com.br/belem', city: 'Belém - PA' },
    '7': { name: 'GMAD Centro-Oeste', url: 'https://gmad.com.br/goiania', city: 'Goiânia - GO' },
    '8': { name: 'GMAD Madville', url: 'https://gmad.com.br/madville', city: 'Joinville - SC' },
    '9': { name: 'GMAD Ponto do Marceneiro', url: 'https://gmad.com.br/ponto', city: 'Porto Alegre - RS' },
};

export const PartnerLocatorModal: React.FC<PartnerLocatorModalProps> = ({ isOpen, onClose }) => {
    const [cep, setCep] = useState('');
    const [step, setStep] = useState<'input' | 'searching' | 'found'>('input');
    const [foundUnit, setFoundUnit] = useState<{ name: string; url: string; city: string } | null>(null);

    if (!isOpen) return null;

    const handleSearch = () => {
        if (cep.length < 5) return;
        
        setStep('searching');
        
        // Simula tempo de busca
        setTimeout(() => {
            const firstDigit = cep.charAt(0);
            // Fallback para ecommerce geral se não encontrar região específica
            const unit = GMAD_UNITS[firstDigit] || { name: 'GMAD Ecommerce Nacional', url: 'https://gmad.com.br', city: 'Atendimento Online' };
            
            setFoundUnit(unit);
            setStep('found');
        }, 1500);
    };

    const handleReset = () => {
        setCep('');
        setStep('input');
        setFoundUnit(null);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#3e3535] rounded-xl w-full max-w-md overflow-hidden shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] relative" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header Personalizado GMAD */}
                <div className="bg-[#005c98] p-6 text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl">&times;</button>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                        {/* Placeholder para Logo da GMAD */}
                        <span className="text-[#005c98] font-black text-xl tracking-tighter">GMAD</span>
                    </div>
                    <h2 className="text-white font-bold text-xl">Parceiro Oficial</h2>
                    <p className="text-blue-100 text-sm">O maior mix de produtos para móveis.</p>
                </div>

                <div className="p-6">
                    {step === 'input' && (
                        <div className="animate-fadeIn">
                            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 text-sm">
                                Digite o CEP da sua marcenaria ou do local da obra para encontrarmos a unidade GMAD mais próxima com estoque disponível.
                            </p>
                            
                            <div className="relative mb-4">
                                <input 
                                    type="text" 
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="Digite o CEP (ex: 01000-000)"
                                    className="w-full pl-10 p-4 rounded-lg border-2 border-gray-200 dark:border-[#5a4f4f] bg-gray-50 dark:bg-[#2d2424] text-lg font-bold text-center tracking-widest focus:border-[#005c98] focus:outline-none transition-colors"
                                />
                                <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            </div>

                            <button 
                                onClick={handleSearch}
                                disabled={cep.length < 8}
                                className="w-full bg-[#005c98] hover:bg-[#004a7c] text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <SearchIcon className="w-5 h-5" /> Localizar Unidade
                            </button>
                        </div>
                    )}

                    {step === 'searching' && (
                        <div className="text-center py-8 animate-fadeIn">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#005c98] border-t-transparent mb-4"></div>
                            <p className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">Analisando estoque regional...</p>
                            <p className="text-xs text-gray-500 mt-2">Conectando aos servidores da GMAD</p>
                        </div>
                    )}

                    {step === 'found' && foundUnit && (
                        <div className="animate-scaleIn text-center">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold mb-1">
                                    <CheckIcon className="w-5 h-5" /> Unidade Encontrada!
                                </div>
                                <h3 className="text-xl font-black text-[#3e3535] dark:text-[#f5f1e8]">{foundUnit.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{foundUnit.city}</p>
                            </div>

                            <div className="space-y-3">
                                <a 
                                    href={foundUnit.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full bg-[#005c98] hover:bg-[#004a7c] text-white font-bold py-4 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    <StoreIcon className="w-5 h-5" /> Acessar Loja Desta Unidade
                                </a>
                                
                                <button 
                                    onClick={handleReset}
                                    className="text-xs text-gray-400 hover:text-[#005c98] underline"
                                >
                                    Buscar outro CEP
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 dark:bg-[#2d2424] p-3 text-center border-t border-[#e6ddcd] dark:border-[#4a4040]">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        <GlobeIcon className="w-3 h-3" /> Integração Segura MarcenApp & GMAD
                    </p>
                </div>
            </div>
        </div>
    );
};
