
import React, { useState } from 'react';
import { CameraIcon, Spinner, MagicIcon, CheckIcon } from './Shared';
import { ImageUploader } from './ImageUploader';
import { RoomTypeDetector } from './RoomTypeDetector';
import { DimensionExtractor } from './DimensionExtractor';
import { FloorPlanAnalyzer } from './FloorPlanAnalyzer';
import { FurnitureSuggestionEngine } from './FurnitureSuggestionEngine';
import { AutoLayoutGenerator } from './AutoLayoutGenerator';
import { Project3DGenerator } from './Project3DGenerator';
import { ProjectGallery } from './ProjectGallery';
import { TutorialModal } from './TutorialModal';
import { analyzeRoomImage } from '../services/geminiService';
import { addProjectToHistory } from '../services/historyService';

interface ImageProjectGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (msg: string, title?: string) => void;
}

export const ImageProjectGenerator: React.FC<ImageProjectGeneratorProps> = ({ isOpen, onClose, showAlert }) => {
    const [step, setStep] = useState(1);
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Analysis State
    const [roomType, setRoomType] = useState('');
    const [confidence, setConfidence] = useState('');
    const [dimensions, setDimensions] = useState({ width: 0, depth: 0, height: 0 });
    const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
    
    // User Selections & Intent
    const [userIntent, setUserIntent] = useState('');
    const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
    const [selectedLayout, setSelectedLayout] = useState('');
    const [style, setStyle] = useState('Moderno');
    const [isMirrored, setIsMirrored] = useState(false); // New State for Mirrored Plan
    
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    const handleImageUpload = async (files: { data: string, mimeType: string }[] | null) => {
        if (!files || files.length === 0) return;
        const imgData = `data:${files[0].mimeType};base64,${files[0].data}`;
        setImage(imgData);
        setIsAnalyzing(true);
        
        try {
            const analysis = await analyzeRoomImage(imgData);
            setRoomType(analysis.roomType);
            setConfidence(analysis.confidence);
            setDimensions(analysis.dimensions);
            setDetectedObjects(analysis.detectedObjects);
            setStep(2);
        } catch (e) {
            showAlert("Erro ao analisar imagem. Tente novamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleProjectComplete = async (generatedImgUrl: string) => {
        setResultImage(generatedImgUrl);
        // Save to history
        const projectData = {
            name: `Projeto IA - ${roomType} ${isMirrored ? '(Invertido)' : ''}`,
            description: `Ambiente: ${roomType}. Objetivo: ${userIntent}. Layout: ${selectedLayout}. Móveis: ${selectedFurniture.join(', ')}.${isMirrored ? ' [PLANTA INVERTIDA/ESPELHADA]' : ''}`,
            style: style,
            views3d: [generatedImgUrl],
            image2d: null,
            bom: null,
            uploadedReferenceImageUrls: [image!]
        };
        await addProjectToHistory(projectData);
        setStep(3); // Show Gallery
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-[#fffefb] dark:bg-[#4a4040] rounded-xl w-full max-w-5xl max-h-[95vh] shadow-2xl border border-[#e6ddcd] dark:border-[#4a4040] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center bg-[#f5f1e8] dark:bg-[#2d2424]">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#d4ac6e] rounded-lg text-[#3e3535]"><MagicIcon /></div>
                        <div>
                            <h2 className="font-bold text-lg text-[#3e3535] dark:text-[#f5f1e8]">Criar Projeto com IA</h2>
                            <p className="text-xs text-gray-500">Passo {step} de 3</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowTutorial(true)} className="text-sm text-[#d4ac6e] underline">Ver Tutorial</button>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl px-2">&times;</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-gray-50 dark:bg-[#3e3535]/50">
                    {step === 1 && (
                        <div className="max-w-xl mx-auto text-center py-10">
                            <h3 className="text-2xl font-bold mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Comece com uma foto ou planta</h3>
                            <p className="text-gray-500 mb-8">A IA analisará o ambiente, detectará medidas e sugerirá layouts.</p>
                            <div className="bg-white dark:bg-[#2d2424] p-8 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                                {isAnalyzing ? (
                                    <div className="py-10">
                                        <Spinner size="lg" />
                                        <p className="mt-4 font-bold text-[#d4ac6e]">Analisando ambiente com Gemini Vision...</p>
                                    </div>
                                ) : (
                                    <ImageUploader onImagesChange={handleImageUpload} showAlert={showAlert} />
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Column 1: Analysis */}
                            <div className="space-y-4">
                                <img src={image!} alt="Reference" className="w-full rounded-lg shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]" />
                                <RoomTypeDetector detectedType={roomType} confidence={confidence} onConfirm={setRoomType} />
                                <DimensionExtractor dimensions={dimensions} onUpdate={setDimensions} />
                                <FloorPlanAnalyzer isFloorPlan={roomType === 'Planta Baixa'} detectedFeatures={detectedObjects} />
                            </div>

                            {/* Column 2: Decisions & Intent */}
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                    <h3 className="font-bold mb-2 text-[#3e3535] dark:text-[#f5f1e8]">O que você quer fazer? (Importante)</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Descreva onde e o que quer construir para a IA não "chutar". <br/>Ex: "Quero um armário na parede direita, do chão ao teto, com portas de vidro".</p>
                                    <textarea 
                                        value={userIntent}
                                        onChange={(e) => setUserIntent(e.target.value)}
                                        placeholder="Seja específico: 'Armário na parede do fundo...'"
                                        className="w-full p-3 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] h-24 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition text-[#3e3535] dark:text-[#f5f1e8]"
                                    />
                                    
                                    <div className="mt-3 flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#2d2424] rounded-lg border border-gray-200 dark:border-[#5a4f4f]">
                                        <input 
                                            type="checkbox" 
                                            id="mirror-plan" 
                                            checked={isMirrored} 
                                            onChange={(e) => setIsMirrored(e.target.checked)}
                                            className="w-4 h-4 text-[#d4ac6e] rounded focus:ring-[#d4ac6e]"
                                        />
                                        <label htmlFor="mirror-plan" className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] cursor-pointer select-none">
                                            Planta Invertida (Espelhar Projeto)
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 ml-1">*Marque se a foto/planta for o oposto do que você vai construir (Ex: Apto Tipo A vs Tipo B).</p>
                                </div>

                                <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                    <h3 className="font-bold mb-2 text-[#3e3535] dark:text-[#f5f1e8]">Estilo do Projeto</h3>
                                    <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8]">
                                        {['Moderno', 'Industrial', 'Clássico', 'Minimalista', 'Rústico', 'Escandinavo'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <FurnitureSuggestionEngine roomType={roomType} onSelectionChange={setSelectedFurniture} />
                                <AutoLayoutGenerator roomType={roomType} dimensions={dimensions} userIntent={userIntent} onLayoutSelect={setSelectedLayout} />
                            </div>

                            {/* Column 3: Generate */}
                            <div className="flex flex-col justify-center">
                                <div className="bg-[#d4ac6e]/10 p-6 rounded-xl border border-[#d4ac6e]/30">
                                    <h3 className="font-bold text-lg mb-4 text-[#b99256] dark:text-[#d4ac6e]">Resumo do Projeto</h3>
                                    <ul className="text-sm space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                                        <li><strong>Ambiente:</strong> {roomType}</li>
                                        <li><strong>Estilo:</strong> {style}</li>
                                        <li><strong>Móveis:</strong> {selectedFurniture.length} itens selecionados</li>
                                        <li><strong>Orientação:</strong> {isMirrored ? 'Invertida/Espelhada' : 'Padrão'}</li>
                                    </ul>
                                    <Project3DGenerator 
                                        inputData={{ 
                                            image: image!, 
                                            roomType, 
                                            furniture: selectedFurniture, 
                                            layoutDescription: `${selectedLayout}. Objetivo específico do usuário: ${userIntent}`, 
                                            style 
                                        }}
                                        isMirrored={isMirrored}
                                        onGenerate={handleProjectComplete}
                                        showAlert={showAlert}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && resultImage && image && (
                        <div className="max-w-4xl mx-auto">
                            <ProjectGallery originalImage={image} generatedImage={resultImage} />
                            <div className="flex justify-center gap-4 mt-6">
                                <button onClick={onClose} className="bg-[#d4ac6e] text-[#3e3535] font-bold py-3 px-8 rounded-lg hover:bg-[#c89f5e]">
                                    Finalizar e Salvar
                                </button>
                                <button onClick={() => setStep(2)} className="bg-gray-200 dark:bg-[#4a4040] text-gray-700 dark:text-gray-200 font-bold py-3 px-8 rounded-lg hover:bg-gray-300">
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
        </div>
    );
};
