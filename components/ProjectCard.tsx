import React from 'react';
import { Trash2, Box } from 'lucide-react';

const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Hoje';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    return 'Data desconhecida';
};

export const ProjectCard = ({ project, onClick, onDelete }: any) => (
  <div onClick={() => onClick(project)} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 hover:shadow-md transition cursor-pointer group relative">
     <div className="aspect-video bg-stone-100 rounded-xl mb-4 overflow-hidden relative">
        {project.views3d && project.views3d[0] ? (
            <img src={project.views3d[0]} className="w-full h-full object-cover" />
        ) : (
            <div className="flex items-center justify-center h-full text-stone-300"><Box size={32}/></div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"><Trash2 size={14}/></button>
        </div>
     </div>
     <h3 className="font-bold text-stone-800 truncate">{project.name}</h3>
     <p className="text-xs text-stone-500 mt-1 line-clamp-2">{project.description}</p>
     <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full">{formatDate(project.timestamp)}</span>
     </div>
  </div>
);