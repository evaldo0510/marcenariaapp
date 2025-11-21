
import React from 'react';
import { CameraIcon, BlueprintIcon, CheckIcon } from './Shared';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-md p-6 shadow-xl border border-[#e6ddcd] dark:border-[#4a4040]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] mb-4">Como tirar as melhores fotos</h3>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2 mb-2">
                            <CameraIcon className="text-blue-500" /> Fotos do Ambiente
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Tire a foto de um canto do cômodo para pegar o máximo de amplitude.</li>
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Certifique-se de que o ambiente esteja bem iluminado.</li>
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Evite objetos bagunçados que possam confundir a IA.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2 mb-2">
                            <BlueprintIcon className="text-purple-500" /> Plantas Baixas (Rascunhos)
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Desenhe em papel branco com caneta escura (preta ou azul).</li>
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Escreva as medidas de forma legível (ex: 3.00m).</li>
                            <li className="flex items-start gap-2"><CheckIcon className="w-4 h-4 text-green-500 mt-0.5"/> Tire a foto de cima, bem perpendicular ao papel.</li>
                        </ul>
                    </div>
                </div>

                <button onClick={onClose} className="mt-6 w-full bg-[#d4ac6e] text-[#3e3535] font-bold py-3 rounded-lg hover:bg-[#c89f5e] transition">
                    Entendi, vamos lá!
                </button>
            </div>
        </div>
    );
};
