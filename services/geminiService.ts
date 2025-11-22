
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ProjectHistoryItem, ProjectLead, Finish } from '../types';

// Helper to get a fresh AI client instance
const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to create GenerativePart from base64
export const fileToGenerativePart = (data: string, mimeType: string) => {
    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

// Helper to clean and parse JSON from response text
export function cleanAndParseJson<T>(text: string): T {
    let cleaned = text.trim();
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    try {
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", cleaned);
        throw new Error("Falha ao processar resposta da IA.");
    }
}

// --- GENERATE IMAGE FUNCTION (Gemini 2.5 Flash & Gemini 3 Pro) ---
export async function generateImage(
    prompt: string, 
    referenceImages?: { data: string, mimeType: string }[] | null, 
    framingStrategy?: string,
    useProModel: boolean = true, // Changed default to true
    imageResolution: '1K' | '2K' | '4K' = '2K', // Changed default to 2K
    decorationLevel: 'minimal' | 'standard' | 'rich' = 'standard',
    isMirrored: boolean = false
): Promise<string> {
    
    const ai = getAiClient();
    // Select Model
    // Standard: gemini-2.5-flash-image (Nano Banana)
    // Pro: gemini-3-pro-image-preview (Nano Banana Pro)
    const modelName = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    // Engenharia de prompt para estilo PROMOB/V-Ray com proteção contra alucinações
    let technicalPrompt = `
    ATUE COMO: Um Arquiteto Sênior e Renderizador 3D Técnico.
    
    MISSÃO CRÍTICA:
    Gerar uma representação visual EXATA e PRECISA baseada na descrição fornecida.
    Você NÃO deve ser "criativo" com a estrutura. Você deve ser um "tradutor visual" rigoroso do texto.
    
    DESCRIÇÃO DO PROJETO (LEI ABSOLUTA):
    "${prompt}"
    
    DIRETRIZES DE INTEGRIDADE ARQUITETÔNICA (MUITO IMPORTANTE):
    1. **TOPOLOGIA E CONTAGEM:** Se o texto menciona "3 quartos" e "2 banheiros", a imagem DEVE mostrar essa distribuição ou sugerir fortemente essa escala. Se a descrição for de uma casa inteira (planta completa), gere uma vista **ISOMÉTRICA DE CORTE (3D FLOOR PLAN / CUTAWAY)** ou uma vista aérea angular para que todos os cômodos descritos sejam visíveis. NÃO gere apenas uma sala se o usuário descreveu a casa toda.
    2. **RESPEITO ÀS MEDIDAS:** Se o texto cita medidas específicas (ex: "21,77m²"), mantenha a proporção visual correta. Não faça o ambiente parecer um salão de baile se ele tem 20m², nem um cubículo.
    3. **ELEMENTOS ESTRUTURAIS:** Se o texto diz "cozinha aberta" ou "integrada", NÃO coloque paredes dividindo. Se diz "garagem frontal", posicione-a corretamente.
    
    DIRETRIZES DE ESTILO E RENDERIZAÇÃO:
    1. **Estilo Visual:** Fotorrealismo estilo V-Ray / Corona Render. Iluminação natural suave.
    2. **Materiais:** Texturas PBR de alta fidelidade (madeira, concreto, tecido).
    3. **Decoração:** ${decorationLevel === 'minimal' ? 'Minimalista, apenas o essencial.' : decorationLevel === 'rich' ? 'Rica em detalhes, humanizada (livros, plantas, objetos de uso diário).' : 'Padrão de mercado imobiliário, equilibrada.'}
    `;

    // --- BLOCO DE ENQUADRAMENTO E CÂMERA (CRÍTICO PARA EVITAR CORTES) ---
    technicalPrompt += `
    \n**DIRETRIZES DE CÂMERA:**
    `;

    // Injeta a estratégia específica escolhida pelo usuário, se houver
    if (framingStrategy) {
        technicalPrompt += `\n**COMANDO PRIORITÁRIO DE ENQUADRAMENTO:** "${framingStrategy}"\n`;
    } else {
        // Estratégia padrão inteligente baseada no texto
        technicalPrompt += `
        Se o texto descreve UM ÚNICO MÓVEL: Use câmera frontal ou 3/4, com margem de segurança (padding) ao redor.
        Se o texto descreve UM CÔMODO: Use lente Grande Angular (24mm) para mostrar o máximo possível.
        Se o texto descreve UMA CASA INTEIRA/PLANTA: Use vista Isométrica Aérea (Bird's Eye View) ou Corte de Perspectiva para mostrar a distribuição dos cômodos (Quartos, Banheiros, Sala) conforme descrito.
        `;
    }

    if (referenceImages && referenceImages.length > 0) {
        technicalPrompt += `
        \n**PROTOCOLO DE ANÁLISE DE IMAGEM (GEMINI VISION):**
        Use a imagem anexa como a VERDADE ABSOLUTA para a geometria (paredes, portas, janelas).
        1. **Fidelidade:** Mantenha exatamente a posição das paredes e aberturas da imagem.
        2. **Preenchimento:** Apenas "vista" e "core" o layout existente com os materiais e móveis solicitados no texto.
        3. **Escala:** Respeite a proporção visual da imagem fornecida.
        
        ${isMirrored ? 
        `**⚠️ ALERTA DE ESPELHAMENTO (PLANTA INVERTIDA) ⚠️**
        O usuário indicou que esta é uma planta invertida.
        VOCÊ DEVE INVERTER A LÓGICA ESPACIAL HORIZONTALMENTE da imagem de referência.
        O que está na direita, renderize na esquerda.` 
        : ''}
        `;
    }

    // --- BLOCO ESPECÍFICO PARA MODO PRO ---
    if (useProModel) {
        technicalPrompt += `
        \n**💎 QUALIDADE DE REVISTA (MODO PRO):**
        - Iluminação Global (GI) perfeita.
        - Sombras de contato (Ambient Occlusion) profundas.
        - Reflexos e refrações realistas nos vidros e metais.
        `;
    }

    const parts: any[] = [{ text: technicalPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    try {
        // Configure based on model capabilities
        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        // Only Gemini 3 Pro supports explicit imageSize configuration
        if (useProModel) {
            config.imageConfig = {
                imageSize: imageResolution // '1K', '2K', '4K'
            };
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: config
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        
        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        }
        
        throw new Error("A IA não retornou uma imagem válida.");
    } catch (error) {
        console.error("Generate Image Error:", error);
        throw error;
    }
}

// ... (Existing functions suggestAlternativeStyles, suggestAlternativeFinishes, searchFinishes, editImage, suggestImageEdits, generateGroundedResponse, editFloorPlan, estimateProjectCosts, generateText, generateCuttingPlan, findProjectLeads, generateProjectBom, generateAssemblyDetails, parseBomToList, findSupplierPrice, generateFloorPlanFrom3D, generate3Dfrom2D) ...

export async function analyzeRoomImage(base64Image: string): Promise<{ roomType: string, confidence: string, dimensions: { width: number, depth: number, height: number }, detectedObjects: string[] }> {
    const ai = getAiClient();
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
    const data = base64Image.split(',')[1];

    const prompt = `Analise esta imagem de ambiente ou planta baixa como um Arquiteto Sênior.
    
    TAREFAS:
    1. Identifique o tipo de ambiente (Cozinha, Quarto, Sala, Planta Baixa Completa, etc).
    2. Estime as dimensões (Largura, Profundidade, Altura) baseando-se em padrões arquitetônicos (portas 80cm, janelas 120cm).
    3. Liste os elementos estruturais (paredes, portas, janelas).
    4. **ANÁLISE DE FLUXO:** Identifique mentalmente onde seria o local IDEAL para móveis planejados neste layout.
    
    Retorne JSON: { roomType: string, confidence: string, dimensions: { width: number, depth: number, height: number }, detectedObjects: string[] }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                fileToGenerativePart(data, mimeType),
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    roomType: { type: Type.STRING },
                    confidence: { type: Type.STRING },
                    dimensions: {
                        type: Type.OBJECT,
                        properties: {
                            width: { type: Type.NUMBER },
                            depth: { type: Type.NUMBER },
                            height: { type: Type.NUMBER }
                        }
                    },
                    detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson(response.text);
    }
    return { roomType: 'Desconhecido', confidence: 'Baixa', dimensions: { width: 3, depth: 3, height: 2.6 }, detectedObjects: [] };
}

export async function generateLayoutSuggestions(roomType: string, dimensions: any, userIntent?: string): Promise<{ title: string, description: string, pros: string }[]> {
    const ai = getAiClient();
    let prompt = `ATUE COMO: Arquiteto Especialista em Otimização de Espaços.
    AMBIENTE: "${roomType}"
    DIMENSÕES APROXIMADAS: ${dimensions.width}m x ${dimensions.depth}m.
    
    SOLICITAÇÃO DO CLIENTE (PRIORIDADE MÁXIMA):
    "${userIntent || 'Otimizar o espaço para melhor fluxo e funcionalidade.'}"
    
    TAREFA:
    Com base ESTRITAMENTE na solicitação do cliente acima, sugira 3 layouts de móveis planejados.
    Se o cliente descreveu uma casa inteira (ex: 3 quartos), sugira distribuições que caibam nessa descrição.
    Se o cliente descreveu um móvel específico, foque nos detalhes desse móvel.
    
    Retorne JSON Array: [{ title, description, pros }]`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        pros: { type: Type.STRING }
                    }
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson(response.text);
    }
    return [];
}

// 19. Generate Decoration List (Shopping List)
export async function generateDecorationList(projectDescription: string, style: string): Promise<{ item: string, category: string, estimatedPrice: string, suggestion: string }[]> {
    const ai = getAiClient();
    const prompt = `Atue como um Designer de Interiores.
    Baseado neste projeto: "${projectDescription}"
    Estilo: "${style}"
    
    Sugira 5 a 7 itens de decoração REAIS que completariam este ambiente (ex: tapetes, luminárias, vasos, quadros).
    Para cada item, dê uma estimativa de preço em Reais (R$) e uma breve sugestão de onde usar.
    
    Retorne APENAS um JSON Array com objetos: { item, category, estimatedPrice, suggestion }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING },
                        category: { type: Type.STRING },
                        estimatedPrice: { type: Type.STRING },
                        suggestion: { type: Type.STRING }
                    },
                    required: ['item', 'category', 'estimatedPrice', 'suggestion']
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson(response.text);
    }
    return [];
}

// Placeholder functions imports fix
export async function calculateFinancialSummary(project: any) { return {}; }
export async function fetchSupplierCatalog() { return []; }
export async function calculateShippingCost() { return 0; }
export async function suggestAlternativeStyles(projectDescription: string, currentStyle: string, base64Image?: string): Promise<string[]> {
    const ai = getAiClient();
    const prompt = `Atue como um Diretor de Arte de Interiores.
    Projeto: "${projectDescription}"
    Estilo Atual: "${currentStyle}"
    
    Sugira 3 estilos visualmente distintos (ex: Industrial, Japandi, Clássico, Minimalista).
    Retorne APENAS um array JSON de strings. Ex: ["Industrial", "Japandi", "Clássico"]`;
    
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
        const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
        const data = base64Image.split(',')[1];
        parts.push(fileToGenerativePart(data, mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    if (response.text) {
        return cleanAndParseJson<string[]>(response.text);
    }
    return [];
}

export async function suggestAlternativeFinishes(projectDescription: string, style: string): Promise<Finish[]> {
    const ai = getAiClient();
    const prompt = `Atue como um Especialista em Materiais de Marcenaria.
    Projeto: "${projectDescription}"
    Estilo: "${style}"
    
    Sugira 3 acabamentos REAIS e populares (Madeira, Laca, Metal) que combinem.
    Priorize padrões de MDF comuns no mercado (Duratex, Arauco, Guararapes).
    
    Retorne JSON array com objetos Finish.
    Type deve ser um de: 'wood', 'solid', 'metal', 'stone', 'glass'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['wood', 'solid', 'metal', 'stone', 'concrete', 'ceramic', 'fabric', 'glass', 'laminate', 'veneer'] },
                        manufacturer: { type: Type.STRING },
                        imageUrl: { type: Type.STRING, nullable: true },
                        hexCode: { type: Type.STRING }
                    },
                    required: ['id', 'name', 'description', 'type', 'manufacturer', 'hexCode']
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<Finish[]>(response.text);
    }
    return [];
}

export async function searchFinishes(query: string): Promise<Finish[]> {
    const ai = getAiClient();
    const prompt = `Sugira 4 acabamentos de marcenaria reais (MDF, pedras, metais) para: "${query}".
    Retorne JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['wood', 'solid', 'metal', 'stone', 'concrete', 'ceramic', 'fabric', 'glass', 'laminate', 'veneer'] },
                        manufacturer: { type: Type.STRING },
                        imageUrl: { type: Type.STRING, nullable: true },
                        hexCode: { type: Type.STRING }
                    },
                    required: ['id', 'name', 'description', 'type', 'manufacturer', 'hexCode']
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<Finish[]>(response.text);
    }
    return [];
}

export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const ai = getAiClient();
    try {
        // Adicionando reforço de enquadramento também na edição
        const enhancedPrompt = `${prompt}
        
        **REGRA CRÍTICA DE MANUTENÇÃO DE ENQUADRAMENTO:**
        Ao editar, NÃO dê zoom in. Mantenha o enquadramento original ou afaste a câmera (Zoom Out) se necessário para mostrar o objeto inteiro. Mantenha margens de segurança nas bordas.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Explicitly using Flash Image for editing tasks
            contents: {
                parts: [
                    fileToGenerativePart(base64Data, mimeType),
                    { text: enhancedPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE]
            }
        });

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
            return part.inlineData.data;
        }
        throw new Error("Falha ao gerar imagem editada.");
    } catch (e) {
        console.error("Edit Image Error:", e);
        throw e;
    }
}

export async function suggestImageEdits(projectDescription: string, imageSrc: string): Promise<string[]> {
    const ai = getAiClient();
    const base64Data = imageSrc.split(',')[1];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';

    const prompt = `Analise esta imagem de projeto. Sugira 4 edições visuais (ex: mudar cor, adicionar luz). Retorne JSON array de strings.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                fileToGenerativePart(base64Data, mimeType),
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<string[]>(response.text);
    }
    return [];
}

export async function generateGroundedResponse(prompt: string, location: { latitude: number, longitude: number } | null): Promise<{ text: string, sources: any[] }> {
    const ai = getAiClient();
    const tools: any[] = [{ googleSearch: {} }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Using Pro for better reasoning on grounded tasks
        contents: prompt,
        config: {
            tools: tools,
        }
    });

    const text = response.text || "Não encontrei informações.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks.map((chunk: any) => {
        if (chunk.web) return { web: chunk.web };
        return null;
    }).filter((s: any) => s !== null);

    return { text, sources };
}

export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    // Prompt reforçado para manter estilo técnico AutoCAD com cotas
    const technicalPrompt = `
    ATUE COMO: Um software CAD (AutoCAD) em modo de exportação.
    TAREFA: Editar esta planta baixa técnica mantendo o rigoroso padrão de desenho técnico.
    
    INSTRUÇÃO DE EDIÇÃO: ${prompt}
    
    DIRETRIZES DE ESTILO (AUTOCAD 2D / DWG):
    1. **Fundo:** BRANCO PURO (#FFFFFF).
    2. **Linhas:** PRETO SÓLIDO (#000000). Traço fino e vetorial.
    3. **Vista:** Ortográfica Superior (Top View) estrita. Zero perspectiva.
    4. **Cotas:** Mantenha ou adicione linhas de cota (dimension lines) nas laterais.
    5. **Simbologia:** Use arcos para portas e linhas duplas para paredes.
    6. **Clean:** Sem sombras, sem cores, sem texturas realistas. Apenas geometria técnica.
    `;
    
    return editImage(base64Data, mimeType, technicalPrompt);
}

export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
    const ai = getAiClient();
    const parts: any[] = [];
    const prompt = `Orce este projeto de marcenaria (Material e Mão de Obra) no Brasil.
    Projeto: ${project.name}
    Descrição: ${project.description}
    BOM: ${project.bom || "Deduza da imagem"}
    
    Retorne JSON: { "materialCost": number, "laborCost": number }`;

    parts.push({ text: prompt });

    if (project.views3d && project.views3d.length > 0) {
        const imageSrc = project.views3d[0];
        const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
        const data = imageSrc.split(',')[1];
        parts.push(fileToGenerativePart(data, mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    materialCost: { type: Type.NUMBER },
                    laborCost: { type: Type.NUMBER }
                },
                required: ['materialCost', 'laborCost']
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<{ materialCost: number, laborCost: number }>(response.text);
    }
    return { materialCost: 0, laborCost: 0 };
}

export async function generateText(prompt: string, images?: { data: string, mimeType: string }[] | null): Promise<string> {
    const ai = getAiClient();
    const parts: any[] = [{ text: prompt }];
    if (images) {
        images.forEach(img => {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Use Pro for better reasoning on BOMS
        contents: { parts }
    });

    return response.text || "Não foi possível gerar o texto.";
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    const ai = getAiClient();
    const parts: any[] = [];
    
    // 1. Texto e Otimização
    const textPrompt = `Gere um plano de corte otimizado para chapas de ${sheetWidth}x${sheetHeight}mm.
    Projeto: ${project.name}
    BOM/Descrição: ${project.bom || project.description}
    
    Forneça:
    1. Lista de cortes detalhada.
    2. Dicas de otimização (nesting) para economizar chapas.`;

    const textResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: textPrompt
    });
    
    const textPlan = textResponse.text || "Plano não gerado.";

    // 2. Imagem do Diagrama (Baseado na imagem do projeto se existir, ou apenas texto)
    const imagePrompt = `
    ATUE COMO: Software de Otimização de Corte (Cutlist).
    TAREFA: Gerar um diagrama esquemático 2D de Nesting (plano de corte) para chapas de MDF.
    
    ESTILO TÉCNICO:
    - Fundo BRANCO.
    - Retângulos representando a chapa de ${sheetWidth}x${sheetHeight}mm.
    - Peças internas desenhadas com linhas pretas finas.
    - Numeração ou rótulos simples nas peças maiores.
    - Visual limpo, técnico, sem 3D, apenas 2D vetorial.
    `;

    const imgParts: any[] = [{ text: imagePrompt }];
    
    // Se tiver imagem 3D, usa como contexto para entender a complexidade
    if (project.views3d && project.views3d.length > 0) {
         const imageSrc = project.views3d[0];
         const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
         const data = imageSrc.split(',')[1];
         imgParts.push(fileToGenerativePart(data, mimeType));
    }

    let imageBase64 = "";
    try {
        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: imgParts },
            config: { responseModalities: [Modality.IMAGE] }
        });
        
        const imgPart = imgResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imgPart && imgPart.inlineData) {
            imageBase64 = imgPart.inlineData.data;
        }
    } catch (e) {
        console.warn("Could not generate cutting plan diagram", e);
    }

    return {
        text: textPlan,
        image: imageBase64,
        optimization: "Verifique o alinhamento dos veios da madeira antes do corte."
    };
}

export async function findProjectLeads(city: string): Promise<ProjectLead[]> {
    const ai = getAiClient();
    const prompt = `Gere 3 leads fictícios de marcenaria em ${city}. JSON Array.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        location: { type: Type.STRING },
                        budget: { type: Type.STRING }
                    }
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<ProjectLead[]>(response.text);
    }
    return [];
}

export async function generateProjectBom(project: ProjectHistoryItem): Promise<string> {
    return generateText(`Gere BOM completa em Markdown para: ${project.name}. ${project.description}`, null);
}

export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
     return generateText(`Gere Guia de Montagem passo a passo em Markdown para: ${project.name}. ${project.description}`, null);
}

export async function parseBomToList(bomText: string): Promise<any[]> {
    const ai = getAiClient();
    // Simplified logic for brevity, assuming same functionality as before
    const prompt = `Extraia itens da BOM para JSON Array [{item, qty, dimensions}]. BOM: ${bomText}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson<any[]>(response.text);
    return [];
}

export async function findSupplierPrice(itemDescription: string) {
    return { price: 100, supplier: "Genérico", url: "" }; // Placeholder
}

export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) throw new Error("Sem imagem 3D para base.");
    
    const imageSrc = project.views3d[0];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    // Engenharia de prompt para converter 3D -> 2D Técnico (Estilo AutoCAD)
    const technicalPrompt = `
    ATUE COMO: Um software CAD (AutoCAD/Revit) exportando para PDF/PNG.
    TAREFA: Converter esta visualização 3D em uma PLANTA BAIXA TÉCNICA 2D (Vista Superior/Top View) de Alta Precisão.

    ESTILO VISUAL OBRIGATÓRIO (DWG/CAD):
    1. **TIPO DE IMAGEM:** Desenho técnico linear (Line Art). NÃO gere uma imagem renderizada ou fotográfica.
    2. **Fundo:** BRANCO PURO (#FFFFFF) uniforme.
    3. **Linhas:** PRETO SÓLIDO (#000000). Traço fino e nítido. Alto contraste.
    4. **Perspectiva:** ORTOGRÁFICA PERFEITA (2D Flat). A câmera deve estar a 90 graus (Top-Down). Nenhuma parede deve ter altura visível (apenas a espessura do corte).
    5. **Elementos Arquitetônicos:**
       - Portas: Desenhe o arco de abertura da porta (90 graus).
       - Janelas: Linhas duplas ou triplas finas na parede.
       - Paredes: Linhas duplas paralelas (espessura 15cm).
    6. **Mobiliário:** Representação esquemática 2D simples (retângulos e formas geométricas).
    7. **Cotas (Dimensões):** ADICIONE linhas de chamada e cotas numéricas externas indicando largura e profundidade aproximadas.
    8. **Limpeza:** A imagem deve parecer um arquivo .DWG impresso em PDF. Sem ruído, sem sombras, sem cores.
    `;
    
    return editImage(data, mimeType, technicalPrompt);
}

export async function generate3Dfrom2D(project: ProjectHistoryItem, style: string, finish: string): Promise<string> {
    if (!project.image2d) throw new Error("Sem planta baixa 2D.");
    
    const imageSrc = project.image2d;
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    // Engenharia de prompt para converter 2D -> 3D (Estilo Promob)
    const renderPrompt = `
    ATUE COMO: Renderizador V-Ray para Promob.
    TAREFA: Converter esta planta baixa técnica 2D em uma visualização 3D Fotorrealista.
    
    CONFIGURAÇÃO DO RENDER:
    - **Estilo de Design:** ${style}.
    - **Acabamento Principal:** ${finish} (Aplique texturas realistas de alta resolução).
    - **Câmera:** Perspectiva isométrica ou frontal de estúdio (Wide Angle 24mm), mostrando profundidade e volume baseados na planta.
    - **Enquadramento:** NÃO corte o móvel. Mostre o objeto inteiro com margem de segurança.
    - **Iluminação:** Iluminação de estúdio suave, realçando os materiais.
    - **Fundo:** Neutro/Branco infinito.
    
    A imagem deve parecer uma foto de catálogo de móveis planejados de alto padrão.
    `;
    
    return editImage(data, mimeType, renderPrompt);
}
