
import React from 'react';
import { CheckIcon } from './Shared';

export const SubscriptionPlans: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Planos de Assinatura</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder content */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-bold">Profissional</h3>
                    <p className="text-2xl font-bold my-2">R$ 49,90<span className="text-sm font-normal">/mês</span></p>
                    <ul className="space-y-2 text-sm">
                        <li className="flex gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Projetos Ilimitados</li>
                        <li className="flex gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Render 3D</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
