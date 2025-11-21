
import React from 'react';
import { BellIcon, CheckIcon, TrophyIcon, CurrencyDollarIcon, InfoIcon } from './Shared';
import type { Notification } from '../types';

export const NotificationSystem: React.FC = () => {
    const notifications: Notification[] = [
        { id: '1', type: 'sale', title: 'Nova Venda!', message: 'A Marcenaria Silva acabou de assinar o plano Profissional.', date: Date.now(), read: false },
        { id: '2', type: 'commission', title: 'Pagamento Recebido', message: 'Sua comissão de R$ 150,00 foi depositada.', date: Date.now() - 86400000, read: true },
        { id: '3', type: 'system', title: 'Novo Material de Marketing', message: 'Adicionamos novos banners de Black Friday no portal.', date: Date.now() - 172800000, read: true },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return <TrophyIcon className="text-yellow-500 w-5 h-5" />;
            case 'commission': return <CurrencyDollarIcon className="text-green-500 w-5 h-5" />;
            default: return <InfoIcon className="text-blue-500 w-5 h-5" />;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-[#3e3535] rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-lg overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-gray-50 dark:bg-[#2d2424]">
                <h3 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                    <BellIcon /> Notificações
                </h3>
                <button className="text-xs text-[#d4ac6e] hover:underline">Marcar todas como lidas</button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-100 dark:divide-[#4a4040]">
                        {notifications.map(notif => (
                            <li key={notif.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-[#4a4040] transition ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                <div className="flex gap-3">
                                    <div className="mt-1">{getIcon(notif.type)}</div>
                                    <div>
                                        <h4 className={`text-sm font-semibold ${!notif.read ? 'text-[#3e3535] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.date).toLocaleDateString()} às {new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma notificação nova.
                    </div>
                )}
            </div>
        </div>
    );
};
