
import React, { useState } from 'react';
import { GalleryIcon } from './Shared';

interface ProjectGalleryProps {
    originalImage: string;
    generatedImage: string;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ originalImage, generatedImage }) => {
    const [view, setView] = useState<'split' | 'original' | 'generated'>('generated');

    return (
        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                    <GalleryIcon /> Resultado
                </h3>
                <div className="flex bg-gray-100 dark:bg-[#2d2424] rounded-lg p-1">
                    <button onClick={() => setView('original')} className={`px-3 py-1 text-xs rounded ${view === 'original' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Original</button>
                    <button onClick={() => setView('generated')} className={`px-3 py-1 text-xs rounded ${view === 'generated' ? 'bg-white dark:bg-[#4a4040] shadow text-[#3e3535] dark:text-white' : 'text-gray-500'}`}>Projeto 3D</button>
                </div>
            </div>

            <div className="relative aspect-video bg-gray-200 dark:bg-[#2d2424] rounded-lg overflow-hidden">
                {view === 'original' && <img src={originalImage} className="w-full h-full object-contain" alt="Original" />}
                {view === 'generated' && <img src={generatedImage} className="w-full h-full object-cover" alt="Gerado" />}
            </div>
        </div>
    );
};
