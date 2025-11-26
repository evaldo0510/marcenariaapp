
import React, { useState } from 'react';
import { OFFICIAL_NETWORKS, type DistributorNetwork } from '../services/distributorData';
import { LogoIcon, StoreIcon, UserIcon, CheckIcon, Spinner, ShieldIcon } from './Shared';

interface DistributorOnboardingProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (profile: any) => void;
}

export const DistributorOnboarding: React.FC<DistributorOnboardingProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedNetwork, setSelectedNetwork] = useState<DistributorNetwork | null>(null);
    const [branchName, setBranchName] = useState('');
    const [repName, setRepName] = useState('');
    const [repEmail, setRepEmail] = useState('');
    const [repPhone, setRepPhone] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    if (!isOpen) return null;

    const handleNetworkSelect = (network: DistributorNetwork) => {
        setSelectedNetwork(network);
        setStep(2);
    };

    const handleValidation = () => {
        if (!branchName || !repName || !repEmail) return;
        
        setIsValidating(true);
        // Simulação de validação com o servidor central da Rede
        setTimeout(() => {
            setIsValidating(false);
            setStep(3);
        }, 2000);
    };

    const handleFinish = () => {
        const profile = {
            networkId: selectedNetwork?.id,
            networkName: selectedNetwork?.name,
            branch: branchName,
            name: repName,
            email: repEmail,
            phone: repPhone,
            partnerId: `${selectedNetwork?.id.toUpperCase()}-${branchName.toUpperCase().slice(0,3)}-${Math.floor(Math.random()*1000)}`
        };
        
        // Salvar no storage para persistência básica
        localStorage.setItem('distributorProfile', JSON.stringify(profile));
        onComplete(profile);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#3e3535] rounded-xl w-full max-w-2xl shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Progress */}
                <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#d4ac6e] p-1.5 rounded text-[#3e3535]">
                            <StoreIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">Credenciamento de Parceiro</span>
                    </div>
                    <div className="flex gap-2">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-[#d4ac6e]' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-[#d4ac6e]' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-[#d4ac6e]' : 'bg-gray-300'}`}></div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar">
                    
                    {/* STEP 1: SELECT NETWORK */}
                    {step === 1 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-center text-[#3e3535] dark:text-[#f5f1e8] mb-2">Selecione sua Rede</h2>
                            <p className="text-center text-gray-500 mb-8">Identifique a rede de distribuição que você representa.</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {OFFICIAL_NETWORKS.map((network) => (
                                    <button
                                        key={network.id}
                                        onClick={() => handleNetworkSelect(network)}
                                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e] hover:bg-[#f0e9dc] dark:hover:bg-[#4a4040] transition-all group bg-white dark:bg-[#2d2424]"
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 shadow-sm group-hover:scale-110 transition-transform"
                                            style={{ backgroundColor: network.color }}
                                        >
                                            {network.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-[#3e3535] dark:text-[#f5f1e8] text-sm text-center">{network.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: REPRESENTATIVE DETAILS */}
                    {step === 2 && selectedNetwork && (
                        <div className="animate-fadeIn max-w-md mx-auto">
                            <div className="text-center mb-6">
                                <div 
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-2 shadow-md"
                                    style={{ backgroundColor: selectedNetwork.color }}
                                >
                                    {selectedNetwork.name.charAt(0)}
                                </div>
                                <h2 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">Vincular a {selectedNetwork.name}</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Unidade / Loja</label>
                                    <input 
                                        type="text" 
                                        value={branchName}
                                        onChange={e => setBranchName(e.target.value)}
                                        placeholder="Ex: Loja Pinheiros"
                                        className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu Nome (Representante)</label>
                                    <input 
                                        type="text" 
                                        value={repName}
                                        onChange={e => setRepName(e.target.value)}
                                        placeholder="Nome Completo"
                                        className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail Profissional</label>
                                        <input 
                                            type="email" 
                                            value={repEmail}
                                            onChange={e => setRepEmail(e.target.value)}
                                            placeholder="email@loja.com"
                                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                                        <input 
                                            type="tel" 
                                            value={repPhone}
                                            onChange={e => setRepPhone(e.target.value)}
                                            placeholder="(XX) 9..."
                                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleValidation}
                                    disabled={!branchName || !repName || !repEmail || isValidating}
                                    className="w-full mt-6 bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isValidating ? <Spinner size="sm" /> : <ShieldIcon className="w-5 h-5" />}
                                    {isValidating ? 'Validando Vínculo...' : 'Validar Credenciamento'}
                                </button>
                                <button onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-[#d4ac6e]">Voltar</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS / BADGE */}
                    {step === 3 && selectedNetwork && (
                        <div className="animate-scaleIn flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckIcon className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">Cadastro Aprovado!</h2>
                            <p className="text-gray-500 mb-8">Sua conta de parceiro foi vinculada com sucesso.</p>

                            {/* Digital Badge */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-0 overflow-hidden w-full max-w-sm mb-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <div className="h-24 flex items-center justify-center" style={{ backgroundColor: selectedNetwork.color }}>
                                    <h3 className="text-white font-black text-2xl uppercase tracking-widest">{selectedNetwork.name}</h3>
                                </div>
                                <div className="p-6 text-left relative">
                                    <div className="absolute -top-8 left-6 w-16 h-16 bg-white rounded-full border-4 border-white flex items-center justify-center shadow-md">
                                        <UserIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div className="mt-6">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Representante Oficial</p>
                                        <p className="text-xl font-bold text-gray-800">{repName}</p>
                                        <p className="text-sm text-gray-600">{branchName}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase">ID Parceiro</p>
                                            <p className="font-mono text-xs font-bold text-[#d4ac6e]">{selectedNetwork.id.toUpperCase()}-{branchName.toUpperCase().slice(0,3)}-2024</p>
                                        </div>
                                        <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                            Ativo
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleFinish}
                                className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-10 rounded-full hover:bg-[#c89f5e] shadow-lg transition transform hover:scale-105"
                            >
                                Acessar Portal do Parceiro
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
