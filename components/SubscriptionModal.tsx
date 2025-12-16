import React from 'react';
import { X } from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';

export const SubscriptionModal = ({ isOpen, onClose, onUpgrade }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><X size={24}/></button>
                <SubscriptionPlans />
                <div className="mt-6 flex justify-end">
                    <button onClick={onUpgrade} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-6 rounded-xl hover:bg-[#c89f5e]">Atualizar Plano</button>
                </div>
            </div>
        </div>
    )
};