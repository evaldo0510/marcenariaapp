
import React, { useState, useMemo, useEffect } from 'react';
import type { ProjectHistoryItem } from '../types';
import { Spinner, BookIcon, WandIcon, TrashIcon, CheckIcon, SearchIcon, DocumentTextIcon, ToolsIcon, ConfirmationModal, Button } from './Shared';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: ProjectHistoryItem[];
    onViewProject: (project: ProjectHistoryItem) => void;
    onAddNewView: (projectId: string) => void;
    onDeleteProject: (id: string) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ITEMS_PER_PAGE = 6;

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    isOpen,
    onClose,
    history,
    onViewProject,
    onAddNewView,
    onDeleteProject,
    showToast
}) => {
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'alpha-asc'>('date-desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOrder, history.length]);

    const filteredSortedHistory = useMemo(() => {
        return history
            .filter(project =>
                project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'date-asc':
                        return a.timestamp - b.timestamp;
                    case 'alpha-asc':
                        return a.name.localeCompare(b.name);
                    case 'date-desc':
                    default:
                        return b.timestamp - a.timestamp;
                }
            });
    }, [history, searchTerm, sortOrder]);

    const totalPages = Math.ceil(filteredSortedHistory.length / ITEMS_PER_PAGE);
    
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSortedHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredSortedHistory]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Optional: Scroll to top of list
            document.getElementById('history-list-top')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black bg-opacity-60' : 'pointer-events-none'}`} onClick={onClose}>
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-[#f5f1e8] dark:bg-[#3e3535] shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    <header className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex justify-between items-center">
                        <h2 className="text-xl font-bold text-[#b99256] dark:text-[#d4ac6e]">Histórico de Projetos</h2>
                        <button onClick={onClose} className="text-[#a89d8d] hover:text-[#3e3535] dark:hover:text-white text-2xl">&times;</button>
                    </header>
                    
                    <div className="p-4 border-b border-[#e6ddcd] dark:border-[#4a4040] flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Filtrar por nome ou descrição..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#fffefb] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-2 pl-10 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e]"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89d8d] pointer-events-none">
                                <SearchIcon />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="sort-order" className="text-sm text-[#8a7e7e] dark:text-[#a89d8d] mr-2 flex-shrink-0">Ordenar por:</label>
                            <select
                                id="sort-order"
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as any)}
                                className="w-full md:w-auto bg-[#fffefb] dark:bg-[#2d2424] border border-[#dcd6c8] dark:border-[#5a4f4f] rounded-lg p-2 text-[#3e3535] dark:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#d4ac6e]"
                            >
                                <option value="date-desc">Mais Recentes</option>
                                <option value="date-asc">Mais Antigos</option>
                                <option value="alpha-asc">Ordem Alfabética (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    <main className="flex-grow overflow-y-auto p-4">
                        <div id="history-list-top"></div>
                        {history.length === 0 ? (
                            <div className="text-center text-[#8a7e7e] dark:text-[#a89d8d] py-10 h-full flex flex-col justify-center items-center">
                                <p className="font-semibold text-lg">Nenhum projeto no histórico.</p>
                                <p className="text-sm">Comece a criar para ver seus projetos aqui.</p>
                            </div>
                        ) : filteredSortedHistory.length === 0 ? (
                             <div className="text-center text-[#8a7e7e] dark:text-[#a89d8d] py-10 h-full flex flex-col justify-center items-center">
                                <p className="font-semibold text-lg">Nenhum resultado encontrado.</p>
                                <p className="text-sm">Tente ajustar seus filtros de busca.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentItems.map((project, index) => {
                                        const isDraft = project.views3d.length === 0 && !project.image2d;

                                        return (
                                        <div key={project.id} className="bg-[#fffefb] dark:bg-[#4a4040]/50 rounded-lg border border-[#e6ddcd] dark:border-[#4a4040] overflow-hidden flex flex-col animate-fadeInUp" style={{animationDelay: `${index * 50}ms`}}>
                                            {/* Image Area */}
                                            <div onClick={() => onViewProject(project)} className="relative cursor-pointer group">
                                                {isDraft ? (
                                                    <div className="w-full h-48 bg-[#e6ddcd] dark:bg-[#2d2424] flex flex-col items-center justify-center text-[#8a7e7e] dark:text-[#a89d8d]">
                                                        <DocumentTextIcon />
                                                        <span className="text-sm mt-2 font-semibold">RASCUNHO</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <img 
                                                            src={project.views3d[0]} 
                                                            alt="Thumbnail 3D" 
                                                            loading="lazy"
                                                            className="w-full h-48 object-cover bg-[#e6ddcd] dark:bg-[#2d2424] group-hover:scale-105 transition-transform duration-300" 
                                                        />
                                                        {project.image2d && (
                                                            <img 
                                                                src={project.image2d} 
                                                                alt="Thumbnail 2D"
                                                                loading="lazy"
                                                                className="absolute bottom-2 right-2 w-20 h-20 object-cover bg-white rounded-md border-2 border-[#dcd6c8] dark:border-[#4a4040] shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Content Area */}
                                            <div className="p-3 flex-grow flex flex-col">
                                                <h3 onClick={() => onViewProject(project)} className="cursor-pointer font-semibold text-[#3e3535] dark:text-[#f5f1e8] hover:text-[#b99256] dark:hover:text-[#d4ac6e] transition line-clamp-2" title={project.name}>
                                                    {project.name}
                                                </h3>
                                                <p className="text-xs text-[#8a7e7e] dark:text-[#a89d8d] mt-1 line-clamp-2 flex-grow">{project.description}</p>
                                                <p className="text-xs text-[#a89d8d] dark:text-[#8a7e7e] mt-2">{new Date(project.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            {/* Actions Area */}
                                            <div className="p-3 bg-[#f0e9dc] dark:bg-[#2d2424] border-t border-[#e6ddcd] dark:border-[#4a4040] space-y-2">
                                                <Button 
                                                    onClick={() => onViewProject(project)} 
                                                    label="Visualizar / Editar" 
                                                    variant="primary" 
                                                    className="w-full text-xs"
                                                />
                                                <div className="flex gap-2">
                                                     <Button 
                                                        onClick={(e) => { e.stopPropagation(); onAddNewView(project.id); }}
                                                        disabled={isDraft}
                                                        title={isDraft ? "Gere o projeto primeiro" : "Gerar nova vista 3D do projeto"}
                                                        variant="secondary"
                                                        label="Nova Vista"
                                                        icon={<WandIcon />}
                                                        className="flex-1 text-xs"
                                                     />
                                                    <Button 
                                                        onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}
                                                        variant="danger"
                                                        label="Excluir"
                                                        icon={<TrashIcon />}
                                                        className="flex-1 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-6 py-2">
                                        <button 
                                            onClick={() => goToPage(currentPage - 1)} 
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded bg-[#e6ddcd] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] disabled:opacity-50 hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition"
                                        >
                                            &lt;
                                        </button>
                                        <span className="text-sm text-[#3e3535] dark:text-[#f5f1e8] font-medium">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <button 
                                            onClick={() => goToPage(currentPage + 1)} 
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded bg-[#e6ddcd] dark:bg-[#4a4040] text-[#3e3535] dark:text-[#f5f1e8] disabled:opacity-50 hover:bg-[#dcd6c8] dark:hover:bg-[#5a4f4f] transition"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
                <ConfirmationModal
                    isOpen={!!projectToDelete}
                    onClose={() => setProjectToDelete(null)}
                    onConfirm={() => { if (projectToDelete) onDeleteProject(projectToDelete); }}
                    title="Excluir Projeto"
                    message="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
                    confirmText="Excluir"
                    isDangerous={true}
                />
            </div>
        </div>
    );
};
