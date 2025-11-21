
import React, { useState } from 'react';
import { CheckIcon, AlertIcon, ClockIcon, TimelineIcon } from './Shared';

interface Stage {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'delayed';
    date: string;
    responsible: string;
    notes?: string;
}

interface ProjectStages {
    projectId: string;
    clientName: string;
    stages: Stage[];
}

export const ProjectStageTracker: React.FC = () => {
    // Mock data simulating a project's lifecycle
    const [project, setProject] = useState<ProjectStages>({
        projectId: 'PROJ-001',
        clientName: 'Roberto Almeida',
        stages: [
            { id: '1', name: 'Medição', status: 'completed', date: '2023-10-20', responsible: 'Carlos (Técnico)' },
            { id: '2', name: 'Projeto 3D', status: 'completed', date: '2023-10-25', responsible: 'Ana (Designer)' },
            { id: '3', name: 'Aprovação', status: 'completed', date: '2023-10-28', responsible: 'Roberto (Cliente)' },
            { id: '4', name: 'Produção', status: 'in-progress', date: '2023-11-15', responsible: 'Fábrica' },
            { id: '5', name: 'Instalação', status: 'pending', date: '2023-11-20', responsible: 'Equipe A' },
        ]
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500 border-green-500 text-white';
            case 'in-progress': return 'bg-blue-500 border-blue-500 text-white';
            case 'delayed': return 'bg-red-500 border-red-500 text-white';
            default: return 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckIcon className="w-4 h-4" />;
            case 'in-progress': return <ClockIcon />; // Using standard ClockIcon which is defined in Shared without props
            case 'delayed': return <AlertIcon className="w-4 h-4" />;
            default: return <div className="w-3 h-3 rounded-full bg-gray-400" />;
        }
    };

    const handleStatusChange = (stageId: string, newStatus: Stage['status']) => {
        const updatedStages = project.stages.map(stage => 
            stage.id === stageId ? { ...stage, status: newStatus } : stage
        );
        setProject({ ...project, stages: updatedStages });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[#3e3535] dark:text-[#f5f1e8] flex items-center gap-2">
                    <TimelineIcon className="w-6 h-6 text-[#d4ac6e]" /> Tracking do Projeto: {project.clientName}
                </h3>
                <span className="text-xs font-mono bg-gray-100 dark:bg-[#4a4040] px-2 py-1 rounded text-gray-500">#{project.projectId}</span>
            </div>

            {/* Desktop Timeline */}
            <div className="hidden md:flex items-center justify-between relative w-full px-10 py-8">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2" />
                
                {project.stages.map((stage, index) => (
                    <div key={stage.id} className="flex flex-col items-center relative group">
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center z-10 transition-all ${getStatusColor(stage.status)}`}>
                            {getStatusIcon(stage.status)}
                        </div>
                        
                        <div className="absolute top-12 w-32 text-center">
                            <p className="font-bold text-sm text-[#3e3535] dark:text-[#f5f1e8]">{stage.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stage.date}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{stage.responsible}</p>
                            
                            {/* Status Controls (Hover) */}
                            <div className="hidden group-hover:flex flex-col gap-1 mt-2 bg-white dark:bg-[#3e3535] p-2 rounded shadow-lg absolute left-1/2 -translate-x-1/2 border dark:border-[#4a4040] z-20 w-32">
                                <button onClick={() => handleStatusChange(stage.id, 'completed')} className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded text-left">Concluir</button>
                                <button onClick={() => handleStatusChange(stage.id, 'in-progress')} className="text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded text-left">Em Andamento</button>
                                <button onClick={() => handleStatusChange(stage.id, 'delayed')} className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded text-left">Atrasado</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Timeline (Vertical) */}
            <div className="md:hidden space-y-0 relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-4">
                {project.stages.map((stage) => (
                    <div key={stage.id} className="mb-8 relative pl-6">
                        <div className={`absolute -left-[21px] top-0 w-8 h-8 rounded-full border-4 flex items-center justify-center bg-white dark:bg-[#2d2424] ${getStatusColor(stage.status)}`}>
                            {getStatusIcon(stage.status)}
                        </div>
                        <div className="bg-white dark:bg-[#3e3535] p-4 rounded-lg border border-gray-200 dark:border-[#4a4040] shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-[#3e3535] dark:text-[#f5f1e8]">{stage.name}</h4>
                                    <p className="text-xs text-gray-500">{stage.responsible}</p>
                                </div>
                                <span className="text-xs font-mono">{stage.date}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleStatusChange(stage.id, 'completed')} className="flex-1 py-1 text-xs border border-green-500 text-green-500 rounded hover:bg-green-50">Concluir</button>
                                <button onClick={() => handleStatusChange(stage.id, 'delayed')} className="flex-1 py-1 text-xs border border-red-500 text-red-500 rounded hover:bg-red-50">Reportar Atraso</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Alerts Summary */}
            {project.stages.some(s => s.status === 'delayed') && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
                    <AlertIcon className="text-red-600 w-6 h-6 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-300">Atenção: Etapas Atrasadas</h4>
                        <p className="text-sm text-red-700 dark:text-red-400">
                            O cronograma deste projeto está comprometido. Entre em contato com o responsável pela etapa atrasada imediatamente.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
