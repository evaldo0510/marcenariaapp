
import React, { useState } from 'react';
import { CheckIcon, CreditCardIcon, Spinner } from './Shared';

interface ActivationSystemProps {
    clientName?: string;
    planName?: string;
}

export const ActivationSystem: React.FC<ActivationSystemProps> = ({ clientName = "Marcenaria Exemplo", planName = "Profissional" }) => {
    const [status, setStatus] = useState<'pending' | 'checking' | 'active'>('pending');

    const checkPayment = () => {
        setStatus('checking');
        // Simulate API check
        setTimeout(() => {
            setStatus('active');
        }, 2500);
    };

    if (status === 'active') {
        return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg text-center animate-scaleIn">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckIcon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">Assinatura Ativada!</h3>
                <p className="text-green-700 dark:text-green-400 mb-4">
                    O pagamento foi confirmado. O acesso ao plano <strong>{planName}</strong> foi liberado para <strong>{clientName}</strong>.
                </p>
                <div className="text-xs text-gray-500">
                    ID da Transação: TX-{Math.floor(Math.random() * 1000000)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
            <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                <CreditCardIcon /> Status da Ativação
            </h3>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#2d2424] rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cliente:</span>
                    <span className="font-medium text-[#3e3535] dark:text-[#f5f1e8]">{clientName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#2d2424] rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Plano Selecionado:</span>
                    <span className="font-medium text-[#3e3535] dark:text-[#f5f1e8]">{planName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#2d2424] rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">Aguardando Pagamento</span>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={checkPayment}
                        disabled={status === 'checking'}
                        className="w-full bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-3 rounded-lg hover:opacity-90 transition flex justify-center items-center gap-2"
                    >
                        {status === 'checking' ? <Spinner size="sm" /> : 'Verificar Pagamento Manualmente'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        O sistema verifica pagamentos automaticamente a cada 15 minutos.
                    </p>
                </div>
            </div>
        </div>
    );
};
