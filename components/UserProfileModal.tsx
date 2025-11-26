import React, { useState, useEffect } from 'react';
import { UserIcon, CheckIcon, Spinner } from './Shared';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userEmail }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        whatsapp: '',
        companyName: '',
        document: '', // CPF or CNPJ
        address: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [referrerCode, setReferrerCode] = useState<string | null>(null);

    useEffect(() => {
        // Load existing data if any
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            setFormData(JSON.parse(savedProfile));
        }
        
        // Check for referrer
        const ref = sessionStorage.getItem('referrerCode');
        if (ref) {
            setReferrerCode(ref);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Simulate API save
        setTimeout(() => {
            localStorage.setItem('userProfile', JSON.stringify(formData));
            // If there is a referrer, we would send this data to backend linking user -> partner
            if (referrerCode) {
                console.log(`Linking user ${userEmail} to partner ${referrerCode}`);
            }
            
            setIsSaving(false);
            onClose();
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[70] flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl w-full max-w-lg p-8 shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040]" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#d4ac6e] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                        <UserIcon className="w-8 h-8 text-[#3e3535]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">Complete seu Cadastro</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        Para liberar todas as funcionalidades e emitir orçamentos profissionais, precisamos de alguns dados da sua marcenaria.
                    </p>
                    {referrerCode && (
                        <div className="mt-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full inline-block font-bold border border-green-200 dark:border-green-800">
                            <CheckIcon className="w-3 h-3 inline mr-1" /> Cadastro vinculado ao parceiro oficial
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                        <input 
                            type="text" 
                            name="fullName" 
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            placeholder="Seu nome"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                            <input 
                                type="tel" 
                                name="whatsapp" 
                                required
                                value={formData.whatsapp}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                placeholder="(XX) 99999-9999"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF ou CNPJ</label>
                            <input 
                                type="text" 
                                name="document" 
                                value={formData.document}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                                placeholder="Documento"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Marcenaria (Fantasia)</label>
                        <input 
                            type="text" 
                            name="companyName" 
                            value={formData.companyName}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            placeholder="Ex: Marcenaria Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço / Cidade</label>
                        <input 
                            type="text" 
                            name="address" 
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            placeholder="Cidade - UF"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full mt-6 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSaving ? <Spinner size="sm" /> : <CheckIcon />}
                        {isSaving ? 'Salvando...' : 'Concluir Cadastro'}
                    </button>
                </form>
            </div>
        </div>
    );
};