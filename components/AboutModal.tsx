import React from 'react';
import { LogoIcon } from './Shared';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-3xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center sticky top-0 bg-[#fffefb] dark:bg-[#4a4040]">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-3">
                        <LogoIcon />
                        <span>Sobre o MarcenApp</span>
                    </h2>
                    <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto prose prose-stone dark:prose-invert prose-base max-w-none">
                    <h3 className="text-[#b99256] dark:text-[#d4ac6e]">O que é o MarcenApp?</h3>
                    <p>
                        O MarcenApp é a sua marcenaria digital, uma plataforma completa que une a arte da marcenaria tradicional com o poder da Inteligência Artificial. Com a nossa assistente Iara, transformamos suas ideias — seja uma foto, um rascunho ou uma simples descrição de voz — em projetos 3D fotorrealistas, plantas baixas técnicas e listas de materiais completas.
                    </p>

                    <h3 className="text-[#b99256] dark:text-[#d4ac6e]">Nosso Objetivo</h3>
                    <p>
                        Nossa meta é capacitar marceneiros de todos os níveis com ferramentas de ponta que antes eram inacessíveis. Queremos simplificar o processo de design, planejamento e execução, permitindo que você foque no que faz de melhor: criar móveis incríveis.
                    </p>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                        <div className="bg-[#f0e9dc] dark:bg-[#3e3535]/50 p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                            <h4 className="font-bold text-[#b99256] dark:text-[#d4ac6e]">Missão</h4>
                            <p className="text-sm">Democratizar o acesso a tecnologias de design e planejamento para todos os profissionais da marcenaria, impulsionando a criatividade e a eficiência.</p>
                        </div>
                         <div className="bg-[#f0e9dc] dark:bg-[#3e3535]/50 p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                            <h4 className="font-bold text-[#b99256] dark:text-[#d4ac6e]">Visão</h4>
                            <p className="text-sm">Ser o parceiro digital indispensável para o marceneiro moderno, transformando a maneira como os projetos são concebidos e executados.</p>
                        </div>
                    </div>

                    <h3 className="text-[#b99256] dark:text-[#d4ac6e]">Por que usar o MarcenApp?</h3>
                    <ul>
                        <li><strong>Velocidade e Agilidade:</strong> Crie projetos complexos em minutos, não em dias. Apresente propostas visuais aos seus clientes em tempo recorde.</li>
                        <li><strong>Fotorrealismo que Vende:</strong> Impressione seus clientes com renderizações 3D de alta qualidade que mostram exatamente como o projeto final ficará.</li>
                        <li><strong>Redução de Custos:</strong> Com a lista de materiais automática e o plano de corte otimizado, você minimiza o desperdício de chapas e compra apenas o necessário.</li>
                        <li><strong>Comunicação Clara:</strong> A planta baixa técnica e os detalhes do projeto garantem que todos — cliente, marceneiro e montador — estejam na mesma página.</li>
                        <li><strong>Fluxo de Trabalho Completo:</strong> Do conceito inicial à lista de compras final, o MarcenApp organiza todo o seu processo em um único lugar.</li>
                    </ul>

                    <h3 className="text-[#b99256] dark:text-[#d4ac6e]">Nossos Valores</h3>
                    <p className="flex flex-wrap gap-x-4 gap-y-2">
                        <span className="font-semibold">Inovação</span> |
                        <span className="font-semibold">Precisão</span> |
                        <span className="font-semibold">Parceria com o Marceneiro</span> |
                        <span className="font-semibold">Capacitação</span>
                    </p>
                </main>
                 <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-end sticky bottom-0 bg-[#fffefb] dark:bg-[#4a4040]">
                     <button onClick={onClose} className="bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-2 px-6 rounded-lg transition-all">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};