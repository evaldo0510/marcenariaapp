
import React from 'react';
import { WandIcon, PaletteIcon, VideoCameraIcon, HighQualityIcon, RefreshIcon, SparklesIcon } from './Shared';
import type { Finish } from '../types';
import { initialStylePresets } from '../services/presetService';

interface RefinementPanelProps {
    currentStyle: string;
    onStyleChange: (style: string) => void;
    currentFinish: { manufacturer: string; finish: Finish } | null;
    onFinishClick: () => void;
    qualityMode: 'standard' | 'pro';
    onQualityChange: (mode: 'standard' | 'pro') => void;
    framingStrategy: string;
    onFramingChange: (strategy: string) => void;
    onRegenerate: () => void;
    isGenerating: boolean;
    framingOptions: { label: string; value: string }[];
}

export const RefinementPanel: React.FC<RefinementPanelProps> = ({
    currentStyle,
    onStyleChange,
    currentFinish,
    onFinishClick,
    qualityMode,
    onQualityChange,
    framingStrategy,
    onFramingChange,
    onRegenerate,
    isGenerating,
    framingOptions
}) => {
    return (
        <div className="bg-[#fffefb] dark:bg-[#3e3535] border-t border-[#e6ddcd] dark:border-[#4a4040] p-4 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                    <WandIcon className="w-4 h-4 text-[#d4ac6e]" /> Refinar Resultado
                </h3>
                <span className="text-[10px] text-gray-400">Ajuste e gere novamente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Estilo */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Estilo Visual</label>
                    <select
                        value={currentStyle}
                        onChange={(e) => onStyleChange(e.target.value)}
                        className="w-full p-2 text-sm bg-[#f0e9dc] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg focus:ring-1 focus:ring-[#d4ac6e] outline-none text-[#3e3535] dark:text-[#f5f1e8]"
                    >
                        {initialStylePresets.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Acabamento */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Acabamento</label>
                    <button
                        onClick={onFinishClick}
                        className="w-full p-2 text-sm bg-[#f0e9dc] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg flex items-center justify-between hover:bg-[#e6ddcd] dark:hover:bg-[#4a4040] transition text-[#3e3535] dark:text-[#f5f1e8]"
                    >
                        <div className="flex items-center gap-2 truncate">
                            {currentFinish ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: currentFinish.finish.hexCode || '#ccc' }}></div>
                                    <span className="truncate">{currentFinish.finish.name}</span>
                                </>
                            ) : (
                                <>
                                    <PaletteIcon className="w-4 h-4 text-gray-400" />
                                    <span>Escolher Cor...</span>
                                </>
                            )}
                        </div>
                    </button>
                </div>

                {/* Enquadramento */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Enquadramento</label>
                    <select
                        value={framingStrategy}
                        onChange={(e) => onFramingChange(e.target.value)}
                        className="w-full p-2 text-sm bg-[#f0e9dc] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg focus:ring-1 focus:ring-[#d4ac6e] outline-none text-[#3e3535] dark:text-[#f5f1e8]"
                    >
                        {framingOptions.map((opt, i) => (
                            <option key={i} value={opt.value}>{opt.label.split('(')[0]}</option>
                        ))}
                    </select>
                </div>

                {/* Qualidade */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Qualidade</label>
                    <div className="flex bg-[#f0e9dc] dark:bg-[#2d2424] rounded-lg p-1 border border-[#dcd6c8] dark:border-[#5a4f4f]">
                        <button
                            onClick={() => onQualityChange('standard')}
                            className={`flex-1 py-1 text-xs font-bold rounded ${qualityMode === 'standard' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}
                        >
                            Rápido
                        </button>
                        <button
                            onClick={() => onQualityChange('pro')}
                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${qualityMode === 'pro' ? 'bg-[#d4ac6e] text-[#3e3535] shadow' : 'text-gray-500'}`}
                        >
                            <HighQualityIcon className="w-3 h-3" /> Pro
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                    ${isGenerating ? 'bg-gray-200 dark:bg-[#4a4040] text-gray-500 cursor-not-allowed' : 'bg-[#3e3535] dark:bg-[#d4ac6e] text-white dark:text-[#3e3535] hover:opacity-90 hover:-translate-y-0.5'}`}
            >
                {isGenerating ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                {isGenerating ? 'Atualizando...' : 'Atualizar Projeto'}
            </button>
        </div>
    );
};
