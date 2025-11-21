
import React, { useState, useEffect } from 'react';
import { getHistory, updateProjectInHistory } from '../services/historyService';
import type { ProjectHistoryItem, ProjectStatus } from '../types';
import { Spinner } from './Shared';

const COLUMNS: { id: ProjectStatus; title: string; color: string }[] = [
    { id: 'orcamento', title: 'Em Orçamento', color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'aprovado', title: 'Aprovado', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'producao', title: 'Em Produção', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'montagem', title: 'Montagem', color: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'finalizado', title: 'Finalizado', color: 'bg-green-50 dark:bg-green-900/20' },
];

export const KanbanBoard: React.FC = () => {
    const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await getHistory();
            setProjects(data);
        } catch (e) {
            console.error("Failed to load projects", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleMove = async (projectId: string, direction: 'next' | 'prev') => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const currentIndex = COLUMNS.findIndex(c => c.id === (project.status || 'orcamento'));
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (newIndex < 0 || newIndex >= COLUMNS.length) return;

        const newStatus = COLUMNS[newIndex].id;
        
        // Optimistic update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

        await updateProjectInHistory(projectId, { status: newStatus });
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1000px]">
                {COLUMNS.map(col => (
                    <div key={col.id} className={`flex-1 min-w-[280px] rounded-xl p-3 ${col.color} border border-gray-200 dark:border-gray-700`}>
                        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-700 dark:text-gray-300 flex justify-between">
                            {col.title}
                            <span className="bg-white dark:bg-gray-700 px-2 rounded-full text-xs py-0.5">{projects.filter(p => (p.status || 'orcamento') === col.id).length}</span>
                        </h3>
                        
                        <div className="space-y-3">
                            {projects.filter(p => (p.status || 'orcamento') === col.id).map(project => (
                                <div key={project.id} className="bg-white dark:bg-[#3e3535] p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer">
                                    {project.views3d && project.views3d[0] && (
                                        <img src={project.views3d[0]} alt="" className="w-full h-24 object-cover rounded mb-2" />
                                    )}
                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">{project.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                                    <p className="text-xs text-gray-400 mb-3">{new Date(project.timestamp).toLocaleDateString()}</p>
                                    
                                    <div className="flex justify-between gap-2">
                                        <button 
                                            onClick={() => handleMove(project.id, 'prev')}
                                            disabled={col.id === 'orcamento'}
                                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            &larr;
                                        </button>
                                        <button 
                                            onClick={() => handleMove(project.id, 'next')}
                                            disabled={col.id === 'finalizado'}
                                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
