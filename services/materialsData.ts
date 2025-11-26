
export interface MaterialTexture {
    id: string;
    name: string;
    brand: string;
    type: 'wood' | 'solid' | 'stone' | 'metal';
    hex: string; // Cor base para fallback
    textureUrl?: string; // URL da imagem da textura (opcional para demo)
    tone: 'light' | 'medium' | 'dark';
}

export const MDF_DATABASE: MaterialTexture[] = [
    // Madeirados Claros
    { id: 'mdf-carvalho-hanover', name: 'Carvalho Hanover', brand: 'Duratex', type: 'wood', hex: '#d6c0a3', tone: 'light' },
    { id: 'mdf-freijo', name: 'Freijó Puro', brand: 'Duratex', type: 'wood', hex: '#bfa683', tone: 'medium' },
    { id: 'mdf-carvalho-malva', name: 'Carvalho Malva', brand: 'Duratex', type: 'wood', hex: '#e3dacf', tone: 'light' },
    { id: 'mdf-nogueira-cadiz', name: 'Nogueira Cadiz', brand: 'Duratex', type: 'wood', hex: '#8a6d52', tone: 'medium' },
    
    // Madeirados Escuros
    { id: 'mdf-itapua', name: 'Itapuã', brand: 'Duratex', type: 'wood', hex: '#5e4b35', tone: 'dark' },
    { id: 'mdf-ebano', name: 'Ébano Grigio', brand: 'Duratex', type: 'wood', hex: '#3b3633', tone: 'dark' },
    { id: 'mdf-imbua', name: 'Imbuia Terra', brand: 'Arauco', type: 'wood', hex: '#4a3c31', tone: 'dark' },

    // Unicolores / Sólidos
    { id: 'mdf-branco-tx', name: 'Branco TX', brand: 'Geral', type: 'solid', hex: '#f5f5f5', tone: 'light' },
    { id: 'mdf-cinza-sagrado', name: 'Cinza Sagrado', brand: 'Duratex', type: 'solid', hex: '#9e9e9e', tone: 'medium' },
    { id: 'mdf-grafite', name: 'Grafite Intenso', brand: 'Duratex', type: 'solid', hex: '#383838', tone: 'dark' },
    { id: 'mdf-azul-secreto', name: 'Azul Secreto', brand: 'Duratex', type: 'solid', hex: '#2c3e50', tone: 'dark' },
    { id: 'mdf-verde-real', name: 'Verde Real', brand: 'Duratex', type: 'solid', hex: '#2e4a3d', tone: 'dark' },
    { id: 'mdf-areia', name: 'Areia', brand: 'Guararapes', type: 'solid', hex: '#d9d0c1', tone: 'light' },
    
    // Pedras / Mármores (para bancadas)
    { id: 'pedra-carrara', name: 'Mármore Carrara', brand: 'Pedra', type: 'stone', hex: '#f0f4f8', tone: 'light' },
    { id: 'pedra-preto-via-lactea', name: 'Granito Via Láctea', brand: 'Pedra', type: 'stone', hex: '#1a1a1a', tone: 'dark' },
    { id: 'pedra-concreto', name: 'Concreto Metropolitan', brand: 'Duratex', type: 'stone', hex: '#7a7a7a', tone: 'medium' },
];
