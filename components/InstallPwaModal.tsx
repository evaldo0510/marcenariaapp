
import React from 'react';
import { DownloadIcon, ShareIcon, PlusIcon, CheckIcon, LogoIcon } from './Shared';

interface InstallPwaModalProps {
    isOpen: boolean;
    onClose: () => void;
    installPrompt: any;
    isIOS: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose, installPrompt, isIOS }) => {
    if (!isOpen) return null;

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                onClose();
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-6 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#3e3535] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">&times;</button>
                
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-[#d4ac6e] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <LogoIcon className="w-10 h-10 text-[#3e3535]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">Instalar MarcenApp</h3>
                    <p className="text-sm text-[#6a5f5f] dark:text-[#c7bca9] mb-6">
                        Tenha acesso rápido aos seus projetos e ferramentas, mesmo offline. Funciona como um aplicativo nativo.
                    </p>

                    {isIOS ? (
                        <div className="w-full bg-gray-100 dark:bg-[#2d2424] p-4 rounded-xl text-left space-y-3">
                            <p className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-2">Como instalar no iPhone/iPad:</p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="bg-white dark:bg-[#3e3535] p-1.5 rounded shadow-sm"><ShareIcon className="w-4 h-4 text-blue-500" /></span>
                                <span>1. Toque no botão <strong>Compartilhar</strong> na barra inferior.</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="bg-white dark:bg-[#3e3535] p-1.5 rounded shadow-sm"><PlusIcon className="w-4 h-4 text-gray-500" /></span>
                                <span>2. Role e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="bg-white dark:bg-[#3e3535] p-1.5 rounded shadow-sm font-bold text-xs">Adicionar</span>
                                <span>3. Confirme clicando em <strong>Adicionar</strong>.</span>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleInstallClick}
                            className="w-full py-3 bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <DownloadIcon className="w-5 h-5" /> Instalar Agora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
