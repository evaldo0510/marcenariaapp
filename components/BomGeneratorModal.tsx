
import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Spinner, SparklesIcon, BookIcon, CopyIcon, CheckIcon, WandIcon } from './Shared';
import { ImageUploader } from './ImageUploader';
import { convertMarkdownToHtml } from '../utils/helpers';

interface BomGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (message: string, title?: string) => void;
}

export const BomGeneratorModal: React.FC<BomGeneratorModalProps> = ({ isOpen, onClose, showAlert }) => {
    const [projectDescription, setProjectDescription] = useState('');
    const [uploadedImages, setUploadedImages] = useState<{ data: string; mimeType: string }[] | null>(null);
    const [generatedBom, setGeneratedBom] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleGenerateBom = async () => {
        if (!projectDescription.trim()) {
            showAlert('Por favor, insira uma descrição do projeto para gerar a Lista de Materiais.', 'Atenção');
            return;
        }

        setIsLoading(true);
        setGeneratedBom(null);
        setCopyFeedback(null);

        try {
            const bomPrompt = `Atue como um **Orçamentista Técnico Sênior de Marcenaria** com foco em produção industrial.
            
            Sua tarefa é criar uma **Lista de Materiais (BOM - Bill of Materials)** completa, precisa e formatada profissionalmente para o seguinte projeto.
            
            **Dados do Projeto:**
            "${projectDescription}"
            ${uploadedImages && uploadedImages.length > 0 ? "(Analise as imagens anexadas para deduzir dimensões e ferragens)" : ""}

            **Regras de Ouro:**
            1.  **Segurança:** Adicione uma margem de quebra/perda de 10% nas chapas.
            2.  **Padronização:** Use milímetros (mm) para todas as medidas.
            3.  **Completo:** Não esqueça itens "invisíveis" (parafusos, cola, tapa-furos).

            Gere a resposta estritamente em **Markdown**, organizada nas seguintes tabelas e seções:

            ### 1. 🪵 Chapas e Painéis (MDF/MDP)
            | Material / Espessura | Peça (Descrição) | Qtd | Dimensões (mm) | Fita de Borda |
            | :--- | :--- | :---: | :--- | :--- |
            | Ex: MDF Branco TX 15mm | Lateral | 2 | 720 x 550 | 1L + 1C (Frente/Baixo) |
            | ... | ... | ... | ... | ... |
            *Estimativa total de chapas:* [Ex: 2 chapas de 15mm, 1 chapa de 6mm (Fundo)]

            ### 2. 🔩 Ferragens e Acessórios
            | Item | Especificação Técnica | Qtd Estimada | Aplicação |
            | :--- | :--- | :---: | :--- |
            | Ex: Dobradiça | 35mm Curva c/ Amortecedor | 8 | Portas |
            | Ex: Corrediça | Telescópica 450mm Light | 4 pares | Gavetas |
            | ... | ... | ... | ... |

            ### 3. 🎗️ Acabamentos e Insumos
            *   **Fita de Borda:** [Ex: 50m de Fita Branca 22mm]
            *   **Fixação:** [Ex: 100 parafusos 4,0x40, 50 parafusos 3,5x14, Cola PVA]
            *   **Outros:** [Ex: Pés reguláveis, Pistões a gás, Perfis de alumínio]

            ---
            *Nota Técnica:* Insira uma breve observação sobre o sentido dos veios da madeira se o material for amadeirado.`;
            
            const bomText = await generateText(bomPrompt, uploadedImages);

            setGeneratedBom(bomText);
        } catch (error) {
            console.error('Error generating BOM:', error);
            showAlert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao gerar a BOM.', 'Erro na Geração da BOM');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyBom = () => {
        if (generatedBom) {
            navigator.clipboard.writeText(generatedBom);
            setCopyFeedback('Copiado!');
            setTimeout(() => setCopyFeedback(null), 2000);
        }
    };

    const fillExample = () => {
        setProjectDescription("Armário com 3 portas verticais em madeira clara, 2 gavetas centrais com puxadores metálicos, acabamento fosco, pés retos e estilo moderno minimalista. Inclua nichos abertos na lateral e prateleiras internas. Medidas aproximadas: 2.20m altura x 1.80m largura x 0.55m profundidade.");
    }

    const handleClose = () => {
        setProjectDescription('');
        setUploadedImages(null);
        setGeneratedBom(null);
        setIsLoading(false);
        setCopyFeedback(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={handleClose}>
            <div 
                className="bg-[#fffefb] dark:bg-[#4a4040] rounded-lg w-full max-w-4xl max-h-[90vh] shadow-xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e] flex items-center gap-2">
                        <BookIcon /> Gerar Lista de Materiais (BOM)
                    </h2>
                    <button onClick={handleClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                </header>

                <main className="p-4 flex-grow overflow-y-auto">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="bom-description" className="block text-sm font-medium text-[#6a5f5f] dark:text-[#c7bca9]">
                                Descreva o projeto para o qual você precisa da BOM:
                            </label>
                            <button onClick={fillExample} className="text-xs flex items-center gap-1 text-[#d4ac6e] hover:underline">
                                <WandIcon className="w-3 h-3" /> Preencher Exemplo (Armário)
                            </button>
                        </div>
                        <textarea
                            id="bom-description"
                            rows={5}
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="Ex: Armário de cozinha em L com 3 portas e 2 gavetas, medidas 2.00x0.80x0.60m, estilo moderno, acabamento em MDF branco fosco."
                            className="w-full bg-[#f0e9dc] dark:bg-[#2d2424] border-2 border-[#e6ddcd] dark:border-[#4a4040] rounded-lg p-3 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition"
                        />
                         <ImageUploader onImagesChange={setUploadedImages} showAlert={showAlert} />
                    </div>

                    <button
                        onClick={handleGenerateBom}
                        disabled={isLoading || !projectDescription.trim()}
                        className="w-full bg-[#d4ac6e] hover:bg-[#c89f5e] text-[#3e3535] font-bold py-3 px-5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
                    >
                        {isLoading ? <Spinner size="sm" /> : <SparklesIcon />}
                        <span>{isLoading ? 'Gerando BOM...' : 'Gerar BOM Técnica'}</span>
                    </button>

                    {generatedBom && (
                        <div className="bg-[#f0e9dc] dark:bg-[#2d2424] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] relative animate-fadeIn">
                             <h3 className="text-lg font-semibold text-[#6a5f5f] dark:text-[#c7bca9] mb-3">Lista de Materiais Gerada:</h3>
                             <button 
                                onClick={handleCopyBom} 
                                className="absolute top-4 right-4 bg-[#e6ddcd] dark:bg-[#5a4f4f] p-2 rounded-md text-[#6a5f5f] dark:text-[#c7bca9] hover:bg-[#dcd6c8] dark:hover:bg-[#4a4040] transition flex items-center gap-1 text-sm"
                                title="Copiar BOM"
                            >
                                {copyFeedback ? <><CheckIcon className="w-4 h-4 text-green-500" /> {copyFeedback}</> : <><CopyIcon /> Copiar</>}
                            </button>
                            <div className="prose prose-sm dark:prose-invert max-w-none mt-10" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(generatedBom) }} />
                        </div>
                    )}
                     {isLoading && (
                        <div className="text-center p-8">
                            <Spinner />
                            <p className="mt-2 text-[#8a7e7e] dark:text-[#a89d8d]">A Iara está calculando medidas e ferragens...</p>
                        </div>
                    )}
                </main>
                <footer className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] flex justify-end flex-shrink-0">
                    <button onClick={handleClose} className="bg-[#8a7e7e] dark:bg-[#5a4f4f] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6a5f5f] dark:hover:bg-[#4a4040] transition">
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};
