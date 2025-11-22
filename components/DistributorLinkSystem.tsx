
import React, { useState } from 'react';
import { LinkIcon, CopyIcon, CheckIcon, QRCodeIcon, ChartBarIcon } from './Shared';

export const DistributorLinkSystem: React.FC = () => {
    // In a real app, this ID would come from the authenticated user's context
    const partnerId = "PARCEIRO123";
    const referralLink = `https://marcenapp.com/ref/${partnerId}`;
    
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [stats, setStats] = useState({
        clicks: 145,
        signups: 12,
        conversions: 8
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-[#3e3535] p-6 rounded-xl border border-[#e6ddcd] dark:border-[#4a4040] shadow-sm">
                <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4 flex items-center gap-2">
                    <LinkIcon /> Seu Link de Indicação
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Compartilhe este link com marcenarias. Quando elas se cadastrarem, você será automaticamente vinculado como parceiro e receberá comissões.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex-grow relative">
                        <input 
                            type="text" 
                            value={referralLink} 
                            readOnly 
                            className="w-full p-3 pr-12 bg-gray-50 dark:bg-[#2d2424] border border-gray-300 dark:border-[#5a4f4f] rounded-lg text-gray-700 dark:text-gray-200 font-mono text-sm"
                        />
                        <button 
                            onClick={handleCopy}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#d4ac6e] transition"
                            title="Copiar Link"
                        >
                            {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <button onClick={() => setShowQR(true)} className="flex items-center justify-center gap-2 bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] font-bold py-3 px-6 rounded-lg hover:opacity-90 transition">
                        <QRCodeIcon /> Gerar QR Code
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-[#4a4040] pt-6">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase mb-1">Cliques no Link</p>
                        <p className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{stats.clicks}</p>
                    </div>
                    <div className="text-center border-l border-gray-200 dark:border-[#4a4040]">
                        <p className="text-xs text-gray-500 uppercase mb-1">Cadastros</p>
                        <p className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8]">{stats.signups}</p>
                    </div>
                    <div className="text-center border-l border-gray-200 dark:border-[#4a4040]">
                        <p className="text-xs text-gray-500 uppercase mb-1">Vendas (Conversão)</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.conversions}</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Dica de Performance</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Parceiros que compartilham o link via WhatsApp direto para o dono da marcenaria têm 3x mais conversão do que posts genéricos. Use os scripts disponíveis na aba de Marketing!
                    </p>
                </div>
            </div>

            {showQR && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={() => setShowQR(false)}>
                    <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Seu QR Code de Parceiro</h3>
                        <div className="bg-white p-2 rounded border border-gray-200 mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralLink)}`} 
                                alt="QR Code" 
                                className="w-64 h-64"
                            />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Mostre este código para o cliente escanear com a câmera do celular.</p>
                        <button onClick={() => setShowQR(false)} className="w-full bg-[#3e3535] text-white font-bold py-2 rounded-lg hover:bg-black transition">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
