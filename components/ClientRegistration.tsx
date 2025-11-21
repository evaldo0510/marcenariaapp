
import React, { useState } from 'react';
import { UserAddIcon, Spinner, CheckIcon } from './Shared';

export const ClientRegistration: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        plan: 'pro'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setSuccess(true);
            // Reset form after success
            setTimeout(() => {
                setSuccess(false);
                setFormData({ name: '', email: '', phone: '', companyName: '', plan: 'pro' });
            }, 3000);
        }, 1500);
    };

    return (
        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm animate-fadeIn">
            <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-6 flex items-center gap-2">
                <UserAddIcon /> Cadastrar Cliente Manualmente
            </h3>
            
            {success ? (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center animate-scaleIn">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckIcon className="text-white w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Cadastro Realizado!</h4>
                    <p className="text-gray-600 dark:text-gray-300">Um e-mail de boas-vindas com os dados de acesso foi enviado para o cliente. Ele já está vinculado à sua conta.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Responsável</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Marcenaria</label>
                            <input 
                                type="text" 
                                name="companyName" 
                                value={formData.companyName} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Interesse</label>
                        <select 
                            name="plan" 
                            value={formData.plan} 
                            onChange={handleChange} 
                            className="w-full p-3 rounded-lg border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] focus:ring-2 focus:ring-[#d4ac6e] outline-none"
                        >
                            <option value="pro">Plano Profissional (R$ 49,90/mês)</option>
                            <option value="business">Plano Oficina (R$ 149,90/mês)</option>
                            <option value="trial">Trial Gratuito (7 dias)</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-6 rounded-lg transition-all shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Spinner size="sm" /> : <UserAddIcon />}
                            {isLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Ao cadastrar, você confirma que tem permissão para compartilhar os dados deste contato.
                    </p>
                </form>
            )}
        </div>
    );
};
