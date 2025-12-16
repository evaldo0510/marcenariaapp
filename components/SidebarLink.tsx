import React from 'react';

interface SidebarLinkProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${active ? 'bg-[#d4ac6e] text-[#3e3535] font-bold' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}>
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </button>
);