
import React, { useState } from 'react';
import { CameraIcon, Spinner, MagicIcon, CheckIcon, GridIcon, LayoutIcon, WandIcon } from './Shared'; // Import LayoutIcon and WandIcon
import { ImageUploader } from './ImageUploader';
import { RoomTypeDetector } from './RoomTypeDetector';
import { DimensionExtractor } from './DimensionExtractor';
import { FloorPlanAnalyzer } from './FloorPlanAnalyzer';
import { FurnitureSuggestionEngine } from './FurnitureSuggestionEngine';
import { AutoLayoutGenerator } from './AutoLayoutGenerator';
import { Project3DGenerator } from './Project3DGenerator';
import { ProjectGallery } from './ProjectGallery';
import { TutorialModal } from './TutorialModal';
import { Smart2DEditor } from './Smart2DEditor';
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
    const [imageType, setImageType] = useState<'room' | 'sketch' | null>(null); // New State
    const [roomType, setRoomType] = useState('');
    const [confidence, setConfidence] = useState('');
    const [dimensions, setDimensions] = useState({ width: 0, depth: 0, height: 0 });
    const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
    
    // User Selections & Intent
    const [userIntent, setUserIntent] = useState('');
    const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
    const [selectedLayout, setSelectedLayout] = useState('');
    const [style, setStyle] = useState('Moderno');
    const [isMirrored, setIsMirrored] = useState(false); 
    
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [show2DEditor, setShow2DEditor] = useState(false);

    const handleImageUpload = async (files: { data: string, mimeType: string }[] | null) => {
        if (!files || files.length === 0) return;
        const imgData = `data:${files[0].mimeType};base64,${files[0].data}`;
        setImage(imgData);
        // Don't auto-analyze immediately, wait for type selection
        setStep(1.5); // Intermediate step
    };

    const handleImageTypeSelect = async (type: 'room' | 'sketch') => {
        setImageType(type);
        setIsAnalyzing(true);
        setStep(2); // Move to analysis view immediately for better UX while loading

        try {
            // We use the same service but will interpret results differently in UI
            const analysis = await analyzeRoomImage(image!); 
            setRoomType(analysis.roomType);
            setConfidence(analysis.confidence);
            setDimensions(analysis.dimensions);
            setDetectedObjects(analysis.detectedObjects);
        } catch (e) {
            showAlert("Erro ao analisar imagem. Tente novamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleProjectComplete = async (generatedImgUrl: string) => {
        setResultImage(generatedImgUrl);
        const projectData = {
            name: `Projeto ${imageType === 'sketch' ? 'Rascunho' : 'Ambiente'} - ${roomType} ${isMirrored ? '(Invertido)' : ''}`,
            description: `Tipo: ${imageType}. Objetivo: ${userIntent}. Layout: ${selectedLayout}. Móveis: ${selectedFurniture.join(', ')}.${isMirrored ? ' [PLANTA INVERTIDA/ESPELHADA]' : ''}`,
            style: style,
            views3d: [generatedImgUrl],
            image2d: null,
            bom: null,
            uploadedReferenceImageUrls: [image!]
        };
        await addProjectToHistory(projectData);
        setStep(3); 
    };

    const open2DEditor = () => {
        setShow2DEditor(true);
    }

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
                            <p className="text-xs text-gray-500">Passo {Math.floor(step)} de 3</p>
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
                            <h3 className="text-2xl font-bold mb-4 text-[#3e3535] dark:text-[#f5f1e8]">Comece com uma foto</h3>
                            <p className="text-gray-500 mb-8">Tire uma foto do ambiente, um rascunho de papel ou uma planta baixa.</p>
                            <div className="bg-white dark:bg-[#2d2424] p-8 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                                <ImageUploader onImagesChange={handleImageUpload} showAlert={showAlert} />
                            </div>
                        </div>
                    )}

                    {step === 1.5 && (
                        <div className="max-w-xl mx-auto text-center py-10 animate-fadeIn">
                            <h3 className="text-2xl font-bold mb-6 text-[#3e3535] dark:text-[#f5f1e8]">O que você enviou?</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleImageTypeSelect('room')}
                                    className="p-6 bg-white dark:bg-[#2d2424] rounded-xl border-2 border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e] transition-all group flex flex-col items-center gap-3"
                                >
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <CameraIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Foto do Ambiente / Planta</h4>
                                        <p className="text-xs text-gray-500">Quero mobiliar um espaço vazio ou renovar um cômodo.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleImageTypeSelect('sketch')}
                                    className="p-6 bg-white dark:bg-[#2d2424] rounded-xl border-2 border-gray-200 dark:border-[#5a4f4f] hover:border-[#d4ac6e] transition-all group flex flex-col items-center gap-3"
                                >
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                        <WandIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Rascunho de Móvel</h4>
                                        <p className="text-xs text-gray-500">Desenhei um móvel no papel e quero ver em 3D/Realista.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Column 1: Analysis */}
                            <div className="space-y-4">
                                <img src={image!} alt="Reference" className="w-full rounded-lg shadow-sm border border-[#e6ddcd] dark:border-[#4a4040]" />
                                
                                {isAnalyzing ? (
                                    <div className="p-4 bg-white dark:bg-[#3e3535] rounded-lg text-center">
                                        <Spinner size="md" />
                                        <p className="text-xs mt-2 text-[#d4ac6e]">Analisando geometria...</p>
                                    </div>
                                ) : (
                                    <>
                                        <RoomTypeDetector detectedType={roomType} confidence={confidence} onConfirm={setRoomType} />
                                        {/* Show dimensions only if it makes sense (mostly rooms) */}
                                        {imageType === 'room' && <DimensionExtractor dimensions={dimensions} onUpdate={setDimensions} />}
                                        <FloorPlanAnalyzer isFloorPlan={imageType === 'room' && roomType === 'Planta Baixa'} detectedFeatures={detectedObjects} imageSrc={image} />
                                    </>
                                )}
                                
                                {/* Button to open 2D Editor with appropriate mode */}
                                <button 
                                    onClick={open2DEditor}
                                    className="w-full py-3 bg-[#3e3535] dark:bg-[#f5f1e8] text-white dark:text-[#3e3535] font-bold rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
                                >
                                    {imageType === 'sketch' ? <LayoutIcon className="w-5 h-5"/> : <GridIcon className="w-5 h-5"/>} 
                                    {imageType === 'sketch' ? 'Traçar Rascunho (Frente)' : 'Editar Planta (Topo)'}
                                </button>
                            </div>

                            {/* Column 2: Decisions & Intent */}
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                    <h3 className="font-bold mb-2 text-[#3e3535] dark:text-[#f5f1e8]">
                                        {imageType === 'sketch' ? 'Detalhes do Móvel' : 'O que você quer fazer?'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        {imageType === 'sketch' 
                                            ? 'Descreva materiais e ferragens. Ex: "Guarda-roupa em MDF Freijó com portas de espelho e puxadores perfil."' 
                                            : 'Descreva onde e o que quer construir. Ex: "Quero um armário na parede direita..."'}
                                    </p>
                                    <textarea 
                                        value={userIntent}
                                        onChange={(e) => setUserIntent(e.target.value)}
                                        placeholder={imageType === 'sketch' ? "Ex: 4 portas, puxador cava..." : "Seja específico..."}
                                        className="w-full p-3 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] h-24 focus:ring-[#d4ac6e] focus:border-[#d4ac6e] transition text-[#3e3535] dark:text-[#f5f1e8]"
                                    />
                                    
                                    {imageType === 'room' && (
                                        <div className="mt-3 flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#2d2424] rounded-lg border border-gray-200 dark:border-[#5a4f4f]">
                                            <input 
                                                type="checkbox" 
                                                id="mirror-plan" 
                                                checked={isMirrored} 
                                                onChange={(e) => setIsMirrored(e.target.checked)}
                                                className="w-4 h-4 text-[#d4ac6e] rounded focus:ring-[#d4ac6e]"
                                            />
                                            <label htmlFor="mirror-plan" className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] cursor-pointer select-none">
                                                Planta Invertida (Espelhar)
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040]">
                                    <h3 className="font-bold mb-2 text-[#3e3535] dark:text-[#f5f1e8]">Estilo do Projeto</h3>
                                    <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-2 rounded border bg-gray-50 dark:bg-[#2d2424] border-gray-300 dark:border-[#5a4f4f] text-[#3e3535] dark:text-[#f5f1e8]">
                                        {['Moderno', 'Industrial', 'Clássico', 'Minimalista', 'Rústico', 'Escandinavo'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <FurnitureSuggestionEngine roomType={roomType} onSelectionChange={setSelectedFurniture} />
                                {/* Only show layout suggestions for rooms, sketches imply a specific layout already */}
                                {imageType === 'room' && <AutoLayoutGenerator roomType={roomType} dimensions={dimensions} userIntent={userIntent} onLayoutSelect={setSelectedLayout} />}
                            </div>

                            {/* Column 3: Generate */}
                            <div className="flex flex-col justify-center">
                                <div className="bg-[#d4ac6e]/10 p-6 rounded-xl border border-[#d4ac6e]/30">
                                    <h3 className="font-bold text-lg mb-4 text-[#b99256] dark:text-[#d4ac6e]">Resumo do Projeto</h3>
                                    <ul className="text-sm space-y-2 mb-6 text-gray-700 dark:text-gray-300">
                                        <li><strong>Tipo:</strong> {imageType === 'sketch' ? 'Rascunho de Móvel' : 'Ambiente Completo'}</li>
                                        <li><strong>Estilo:</strong> {style}</li>
                                        <li><strong>Itens:</strong> {selectedFurniture.length} selecionados</li>
                                        <li><strong>Orientação:</strong> {isMirrored ? 'Invertida/Espelhada' : 'Padrão'}</li>
                                    </ul>
                                    <Project3DGenerator 
                                        inputData={{ 
                                            image: image!, 
                                            roomType, 
                                            furniture: selectedFurniture, 
                                            layoutDescription: imageType === 'sketch' ? `Móvel específico baseado no rascunho. Detalhes: ${userIntent}` : `${selectedLayout}. Objetivo específico: ${userIntent}`, 
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
            
            {/* Modal do Editor 2D (Filho) */}
            <Smart2DEditor 
                isOpen={show2DEditor} 
                onClose={() => setShow2DEditor(false)} 
                showAlert={showAlert}
                initialBackgroundImage={image}
                initialMode={imageType === 'sketch' ? 'elevation' : 'plan'}
            />
        </div>
    );
};
