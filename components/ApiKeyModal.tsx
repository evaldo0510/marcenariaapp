
import React, { useState, useEffect } from 'react';
import { KeyIcon, SaveIcon, CheckIcon, TrashIcon, ShieldIcon } from './Shared';
import { hasSystemApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, showAlert }) => {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [systemKeyActive, setSystemKeyActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('gemini_api_key');
            setSavedKey(stored);
            setApiKey(stored || '');
            setSystemKeyActive(hasSystemApiKey());
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!apiKey.trim()) {
            showAlert('Por favor, insira uma chave válida.', 'Erro');
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey.trim());
        setSavedKey(apiKey.trim());
        showAlert('Chave de API salva com sucesso!', 'Configuração');
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setSavedKey(null);
        setApiKey('');
        showAlert('Chave de API removida.', 'Configuração');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-md p-6 shadow-xl border border-[#e6ddcd] dark:border-[#4a4040]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4 text-[#b99256] dark:text-[#d4ac6e]">
                    <KeyIcon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">Configurar API Gemini</h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Para usar a inteligência artificial fora do ambiente de desenvolvimento do Google, você precisa fornecer sua própria chave de API do Gemini.
                </p>

                {systemKeyActive && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800 flex items-start gap-3">
                        <ShieldIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-green-800 dark:text-green-300">Chave do Sistema Ativa</p>
                            <p className="text-xs text-green-700 dark:text-green-400">
                                O aplicativo detectou uma chave de API configurada no servidor (Vercel). Você não precisa inserir uma chave pessoal, a menos que queira usar sua própria cota.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    <strong>Nota:</strong> A chave inserida aqui é salva apenas no seu navegador (Local Storage) e nunca é enviada para nossos servidores.
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sua Chave de API (AIza...)</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-[#f0e9dc] dark:bg-[#2d2424] border-[#dcd6c8] dark:border-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e]"
                            placeholder={systemKeyActive ? "Opcional (Sobrescreve a chave do sistema)" : "Cole sua chave aqui"}
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        {savedKey && (
                            <button 
                                onClick={handleClear}
                                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                            >
                                <TrashIcon className="w-4 h-4" /> Remover
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-[#d4ac6e] text-[#3e3535] font-bold py-2 px-4 rounded-lg hover:bg-[#c89f5e] transition flex items-center justify-center gap-2"
                        >
                            <SaveIcon /> Salvar Configuração
                        </button>
                    </div>
                    
                    <div className="text-center mt-4">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-[#d4ac6e] hover:underline">
                            Obter chave no Google AI Studio &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
