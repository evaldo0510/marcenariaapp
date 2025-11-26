
import React, { useState, useEffect } from 'react';
import { PaletteIcon, WandIcon, RefreshIcon, CheckIcon, SaveIcon, ShareIcon, Spinner } from './Shared';
import { MDF_DATABASE, type MaterialTexture } from '../services/materialsData';
import { generateText } from '../services/geminiService';

interface MaterialCombinationStudioProps {
    isOpen: boolean;
    onClose: () => void;
    showAlert: (msg: string, title?: string) => void;
}

type Zone = 'upper' | 'lower' | 'countertop' | 'wall';

export const MaterialCombinationStudio: React.FC<MaterialCombinationStudioProps> = ({ isOpen, onClose, showAlert }) => {
    const [selection, setSelection] = useState<Record<Zone, MaterialTexture>>({
        upper: MDF_DATABASE.find(m => m.id === 'mdf-freijo')!,
        lower: MDF_DATABASE.find(m => m.id === 'mdf-grafite')!,
        countertop: MDF_DATABASE.find(m => m.id === 'pedra-carrara')!,
        wall: MDF_DATABASE.find(m => m.id === 'mdf-branco-tx')!
    });
    
    const [activeZone, setActiveZone] = useState<Zone>('lower');
    const [aiOpinion, setAiOpinion] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleMaterialSelect = (material: MaterialTexture) => {
        setSelection(prev => ({ ...prev, [activeZone]: material }));
        setAiOpinion(null); // Reset opinion on change
    };

    const handleAnalyzeCombination = async () => {
        setIsAnalyzing(true);
        try {
            const prompt = `
                Atue como um Designer de Interiores Sênior. Analise a seguinte combinação de materiais para uma cozinha/móvel planejado:
                1. Armários Superiores: ${selection.upper.name} (${selection.upper.type} - tom ${selection.upper.tone})
                2. Armários Inferiores: ${selection.lower.name} (${selection.lower.type} - tom ${selection.lower.tone})
                3. Bancada: ${selection.countertop.name}
                4. Parede/Fundo: ${selection.wall.name}

                Diga se a combinação é harmoniosa. Qual o estilo predominante (Industrial, Clássico, Escandinavo, etc)?
                Dê uma nota de 0 a 10 para a harmonia.
                Se houver algum conflito visual (ex: duas madeiras com veios brigando), aponte.
                Responda em um parágrafo curto e direto.
            `;
            
            const analysis = await generateText(prompt, null);
            setAiOpinion(analysis);
        } catch (e) {
            showAlert("Erro ao consultar a Iara.", "Erro");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    // SVG Pattern Generation helper
    const getPatternId = (mat: MaterialTexture) => `pat-${mat.id}`;

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col md:flex-row animate-fadeIn">
            
            {/* --- LEFT SIDE: PREVIEW AREA --- */}
            <div className="flex-1 bg-[#e5e5e5] dark:bg-[#1a1a1a] relative flex flex-col">
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 p-6 w-full flex justify-between items-start z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-[#3e3535] dark:text-[#f5f1e8] bg-white/80 dark:bg-black/50 backdrop-blur px-4 py-2 rounded-lg inline-block">
                            Studio de Combinações
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-white/80 dark:bg-black/50 backdrop-blur px-3 py-1 rounded-lg inline-block">
                            Teste materiais antes de produzir
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-white/80 dark:bg-black/50 p-2 rounded-full hover:bg-white text-[#3e3535] dark:text-white transition">
                        &times;
                    </button>
                </div>

                {/* Interactive Scene (SVG) */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden">
                    <svg viewBox="0 0 800 600" className="w-full h-full max-w-4xl shadow-2xl rounded-lg bg-white">
                        <defs>
                            {MDF_DATABASE.map(mat => (
                                <pattern key={mat.id} id={getPatternId(mat)} patternUnits="userSpaceOnUse" width="100" height="100">
                                    <rect width="100" height="100" fill={mat.hex} />
                                    {/* Texture Simulation using CSS Filters/Opacity */}
                                    {mat.type === 'wood' && (
                                        <path d="M0 0h100v100H0z" fill="none" stroke="black" strokeWidth="0.5" strokeOpacity="0.1" pathLength="10" vectorEffect="non-scaling-stroke" style={{transform: 'scale(1, 20)'}} />
                                    )}
                                    {mat.type === 'stone' && (
                                        <filter id="noise">
                                            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                                        </filter>
                                    )}
                                </pattern>
                            ))}
                        </defs>

                        {/* Wall / Background - Clickable */}
                        <rect 
                            x="0" y="0" width="800" height="600" 
                            fill={`url(#${getPatternId(selection.wall)})`} 
                            className={`cursor-pointer transition-opacity ${activeZone === 'wall' ? 'opacity-100 stroke-[4px] stroke-[#d4ac6e]' : 'opacity-80'}`}
                            onClick={() => setActiveZone('wall')}
                        />

                        {/* Floor (Static) */}
                        <rect x="0" y="500" width="800" height="100" fill="#d1d5db" />

                        {/* Lower Cabinets - Clickable */}
                        <g onClick={() => setActiveZone('lower')} className="cursor-pointer group">
                            <rect 
                                x="100" y="350" width="600" height="150" 
                                fill={`url(#${getPatternId(selection.lower)})`} 
                                className={`transition-all ${activeZone === 'lower' ? 'stroke-[4px] stroke-[#d4ac6e]' : 'stroke-black/10 stroke-1'}`}
                            />
                            {/* Door Lines */}
                            <line x1="250" y1="350" x2="250" y2="500" stroke="black" strokeOpacity="0.2" />
                            <line x1="400" y1="350" x2="400" y2="500" stroke="black" strokeOpacity="0.2" />
                            <line x1="550" y1="350" x2="550" y2="500" stroke="black" strokeOpacity="0.2" />
                            {/* Shadow */}
                            <rect x="100" y="350" width="600" height="10" fill="black" fillOpacity="0.1" />
                        </g>

                        {/* Countertop - Clickable */}
                        <g onClick={() => setActiveZone('countertop')} className="cursor-pointer">
                            <rect 
                                x="90" y="330" width="620" height="20" 
                                fill={`url(#${getPatternId(selection.countertop)})`}
                                className={`transition-all ${activeZone === 'countertop' ? 'stroke-[4px] stroke-[#d4ac6e]' : 'stroke-black/10 stroke-1'}`}
                            />
                        </g>

                        {/* Upper Cabinets - Clickable */}
                        <g onClick={() => setActiveZone('upper')} className="cursor-pointer">
                            <rect 
                                x="100" y="50" width="600" height="180" 
                                fill={`url(#${getPatternId(selection.upper)})`}
                                className={`transition-all ${activeZone === 'upper' ? 'stroke-[4px] stroke-[#d4ac6e]' : 'stroke-black/10 stroke-1'}`}
                            />
                            {/* Door Lines */}
                            <line x1="300" y1="50" x2="300" y2="230" stroke="black" strokeOpacity="0.2" />
                            <line x1="500" y1="50" x2="500" y2="230" stroke="black" strokeOpacity="0.2" />
                            {/* Handle Simulation */}
                            <rect x="280" y="200" width="10" height="20" fill="#333" rx="2" />
                            <rect x="310" y="200" width="10" height="20" fill="#333" rx="2" />
                        </g>

                        {/* Active Zone Indicator Label */}
                        <g transform="translate(350, 550)">
                            <rect x="-60" y="-20" width="120" height="40" rx="20" fill="#2d2424" />
                            <text x="0" y="5" textAnchor="middle" fill="#d4ac6e" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                                {activeZone === 'upper' ? 'Superiores' : activeZone === 'lower' ? 'Inferiores' : activeZone === 'countertop' ? 'Bancada' : 'Parede'}
                            </text>
                        </g>
                    </svg>
                </div>

                {/* AI Opinion Toast */}
                {aiOpinion && (
                    <div className="absolute bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-96 bg-white/95 dark:bg-[#2d2424]/95 backdrop-blur p-4 rounded-xl shadow-2xl border-l-4 border-[#d4ac6e] animate-fadeInUp">
                        <div className="flex items-start gap-3">
                            <div className="bg-[#d4ac6e] p-2 rounded-full shrink-0">
                                <WandIcon className="w-4 h-4 text-[#3e3535]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8] text-sm">Opinião da Iara</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{aiOpinion}</p>
                            </div>
                            <button onClick={() => setAiOpinion(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- RIGHT SIDE: CONTROLS --- */}
            <div className="w-full md:w-96 bg-[#fffefb] dark:bg-[#3e3535] border-l border-[#e6ddcd] dark:border-[#4a4040] flex flex-col shadow-2xl">
                
                {/* Zone Selector Tabs */}
                <div className="flex p-1 border-b border-[#e6ddcd] dark:border-[#4a4040] bg-[#f0e9dc] dark:bg-[#2d2424]">
                    {['upper', 'lower', 'countertop', 'wall'].map((zone) => (
                        <button
                            key={zone}
                            onClick={() => setActiveZone(zone as Zone)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors
                                ${activeZone === zone 
                                    ? 'bg-[#fffefb] dark:bg-[#3e3535] text-[#d4ac6e] border-b-2 border-[#d4ac6e]' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-[#3e3535] dark:hover:text-[#f5f1e8]'}`}
                        >
                            {zone === 'upper' ? 'Sup.' : zone === 'lower' ? 'Inf.' : zone === 'countertop' ? 'Tampo' : 'Parede'}
                        </button>
                    ))}
                </div>

                {/* Material List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <h3 className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] mb-4 flex items-center gap-2">
                        <PaletteIcon className="w-4 h-4" /> Escolha o Material
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {MDF_DATABASE.map(mat => (
                            <button
                                key={mat.id}
                                onClick={() => handleMaterialSelect(mat)}
                                className={`relative p-1 rounded-lg border-2 transition-all group
                                    ${selection[activeZone].id === mat.id 
                                        ? 'border-[#d4ac6e] bg-[#f0e9dc] dark:bg-[#2d2424]' 
                                        : 'border-transparent hover:border-gray-200 dark:hover:border-[#5a4f4f]'}`}
                            >
                                <div 
                                    className="h-20 w-full rounded-md mb-2 shadow-sm" 
                                    style={{ backgroundColor: mat.hex }}
                                ></div>
                                <div className="px-1 text-left">
                                    <p className="text-xs font-bold text-[#3e3535] dark:text-[#f5f1e8] truncate">{mat.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{mat.brand}</p>
                                </div>
                                {selection[activeZone].id === mat.id && (
                                    <div className="absolute top-2 right-2 bg-[#d4ac6e] rounded-full p-0.5">
                                        <CheckIcon className="w-3 h-3 text-[#3e3535]" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 border-t border-[#e6ddcd] dark:border-[#4a4040] bg-[#f5f1e8] dark:bg-[#2d2424] space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Combinação atual:</span>
                        <span className="font-mono font-bold">{selection.upper.name} + {selection.lower.name}</span>
                    </div>
                    
                    <button 
                        onClick={handleAnalyzeCombination}
                        disabled={isAnalyzing}
                        className="w-full py-3 bg-gradient-to-r from-[#d4ac6e] to-[#b99256] text-[#3e3535] font-bold rounded-xl shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isAnalyzing ? <Spinner size="sm" /> : <WandIcon className="w-5 h-5" />}
                        {isAnalyzing ? 'Iara analisando...' : 'IA: Analisar Harmonia'}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-2.5 bg-white dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#5a4f4f] rounded-lg text-xs font-bold text-gray-600 dark:text-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#5a4f4f]">
                            <SaveIcon className="w-4 h-4" /> Salvar
                        </button>
                        <button className="py-2.5 bg-white dark:bg-[#4a4040] border border-[#e6ddcd] dark:border-[#5a4f4f] rounded-lg text-xs font-bold text-gray-600 dark:text-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#5a4f4f]">
                            <ShareIcon className="w-4 h-4" /> Compartilhar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
