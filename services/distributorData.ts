
// Lista Oficial de Redes de Distribuição Parceiras
// Isso garante que o cadastro seja padronizado

export interface DistributorNetwork {
    id: string;
    name: string;
    color: string; // Cor principal da marca
    logoUrl?: string; // Em um app real, seriam URLs de imagens. Aqui usaremos placeholders ou ícones.
}

export const OFFICIAL_NETWORKS: DistributorNetwork[] = [
    { 
        id: 'leo', 
        name: 'Leo Madeiras', 
        color: '#e30613' 
    },
    { 
        id: 'gmad', 
        name: 'GMAD', 
        color: '#005c98' 
    },
    { 
        id: 'gasometro', 
        name: 'Gasômetro Madeiras', 
        color: '#f37021' 
    },
    { 
        id: 'madeiravau', 
        name: 'Madeira VAU', 
        color: '#2e7d32' 
    },
    { 
        id: 'barueri', 
        name: 'Barueri Madeiras', 
        color: '#8b4513' 
    },
    { 
        id: 'redepro', 
        name: 'Rede Pró', 
        color: '#000000' 
    },
    {
        id: 'outros',
        name: 'Outra Rede / Independente',
        color: '#666666'
    }
];

export const getNetworkById = (id: string) => OFFICIAL_NETWORKS.find(n => n.id === id);
