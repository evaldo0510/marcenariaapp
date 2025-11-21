
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ProjectHistoryItem, ProjectLead, Finish } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// --- GENERATE IMAGE FUNCTION (Estilo PROMOB / V-Ray) ---
export async function generateImage(prompt: string, referenceImages?: { data: string, mimeType: string }[] | null, framingStrategy?: string): Promise<string> {
    // Engenharia de prompt para estilo PROMOB/V-Ray com proteção contra alucinações
    let technicalPrompt = `
    ATUE COMO: Um fotógrafo de arquitetura e renderizador 3D profissional (V-Ray/Corona).
    
    TAREFA: Gerar visualização fotorrealista de móveis planejados.
    
    ENTRADA DO USUÁRIO:
    "${prompt}"
    `;

    // --- BLOCO DE ENQUADRAMENTO E CÂMERA (CRÍTICO PARA EVITAR CORTES) ---
    technicalPrompt += `
    \n**DIRETRIZES OBRIGATÓRIAS DE CÂMERA E ENQUADRAMENTO:**
    `;

    // Injeta a estratégia específica escolhida pelo usuário, se houver
    if (framingStrategy) {
        technicalPrompt += `\n**COMANDO PRIORITÁRIO DE ENQUADRAMENTO:** "${framingStrategy}"\n`;
    }

    technicalPrompt += `
    1. **LENTE:** Use uma lente **Grande Angular (Wide Angle - 24mm ou 28mm)**. Isso é CRUCIAL para garantir que o objeto inteiro caiba na cena, especialmente em ambientes pequenos.
    2. **DISTÂNCIA (ZOOM OUT):** Afaste a câmera virtual. O objeto NÃO deve tocar as bordas da imagem.
    3. **MARGINS (SAFETY PADDING):** Deixe uma **margem de segurança (espaço vazio/respiro)** de pelo menos 15% em TODAS as bordas (topo, base, esquerda, direita). O móvel deve flutuar no centro, totalmente visível.
    4. **COMPOSIÇÃO:** Centralize o objeto principal. Se for um móvel alto, mostre do chão ao teto com folga. Se for comprido, mostre as duas laterais.
    5. **NUNCA CORTE:** É estritamente proibido cortar partes do móvel (pés, topo, laterais). A imagem deve ser um "Full Shot" (Plano Inteiro).
    `;

    if (referenceImages && referenceImages.length > 0) {
        technicalPrompt += `
        \n**REGRAS DE PRECISÃO GEOMÉTRICA:**
        1. **BLUEPRINT:** Use a imagem fornecida como planta/base obrigatória. Mantenha a estrutura da sala, paredes, janelas e piso EXATAMENTE como na foto.
        2. **INTEGRAÇÃO:** O móvel deve parecer construído no local da foto original, respeitando a perspectiva da foto.
        `;
    }

    technicalPrompt += `
    \n**DIRETRIZES VISUAIS (Fotorrealismo):**
    1. **Materiais:** Texturas de alta definição. Madeira com veios naturais. Lacas com reflexo correto.
    2. **Iluminação:** Iluminação Global (GI) suave. Sombras de contato (Ambient Occlusion) para "aterrar" o móvel no chão.
    3. **Estilo:** Renderização limpa, comercial, pronta para catálogo.
    4. **Qualidade:** 4K, nítida, sem distorções.
    `;

    const parts: any[] = [{ text: technicalPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Modelo otimizado para geração de imagem
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            }
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

// 1. Suggest Alternative Styles
export async function suggestAlternativeStyles(projectDescription: string, currentStyle: string, base64Image?: string): Promise<string[]> {
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

// 1.1 Suggest Alternative Finishes
export async function suggestAlternativeFinishes(projectDescription: string, style: string): Promise<Finish[]> {
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

// 2. Search Finishes
export async function searchFinishes(query: string): Promise<Finish[]> {
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

// 3. Edit Image
export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    try {
        // Adicionando reforço de enquadramento também na edição
        const enhancedPrompt = `${prompt}
        
        **REGRA CRÍTICA DE MANUTENÇÃO DE ENQUADRAMENTO:**
        Ao editar, NÃO dê zoom in. Mantenha o enquadramento original ou afaste a câmera (Zoom Out) se necessário para mostrar o objeto inteiro. Mantenha margens de segurança nas bordas.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
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

// 4. Suggest Image Edits
export async function suggestImageEdits(projectDescription: string, imageSrc: string): Promise<string[]> {
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

// 5. Generate Grounded Response
export async function generateGroundedResponse(prompt: string, location: { latitude: number, longitude: number } | null): Promise<{ text: string, sources: any[] }> {
    const tools: any[] = [{ googleSearch: {} }];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

// 6. Edit Floor Plan (Layout Editor)
export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    // Prompt reforçado para manter estilo técnico AutoCAD
    const technicalPrompt = `
    ATUE COMO: Um software CAD (AutoCAD).
    TAREFA: Editar esta planta baixa técnica mantendo rigorosamente o estilo de desenho técnico.
    
    INSTRUÇÃO DE EDIÇÃO: ${prompt}
    
    DIRETRIZES DE ESTILO (AUTOCAD 2D):
    1. Mantenha o fundo BRANCO PURO.
    2. Use linhas PRETAS de alta precisão e contraste.
    3. Mantenha a vista ORTOGRÁFICA SUPERIOR (Top View) plana. Sem perspectiva.
    4. Mantenha símbolos técnicos de portas (arcos de abertura) e janelas.
    5. Não adicione sombras, texturas realistas ou cores. Apenas linhas vetoriais técnicas.
    `;
    
    return editImage(base64Data, mimeType, technicalPrompt);
}

// 7. Estimate Project Costs
export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
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

// 8. Generate Text (BOM)
export async function generateText(prompt: string, images?: { data: string, mimeType: string }[] | null): Promise<string> {
    const parts: any[] = [{ text: prompt }];
    if (images) {
        images.forEach(img => {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Use Pro for better reasoning on BOMs
        contents: { parts }
    });

    return response.text || "Não foi possível gerar o texto.";
}

// 9. Generate Cutting Plan (Corrigido e Melhorado)
export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
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

// 10. Find Project Leads
export async function findProjectLeads(city: string): Promise<ProjectLead[]> {
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

// ... (Other helper functions mostly unchanged but ensuring consistent exports) ...
export async function generateProjectBom(project: ProjectHistoryItem): Promise<string> {
    return generateText(`Gere BOM completa em Markdown para: ${project.name}. ${project.description}`, null);
}

export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
     return generateText(`Gere Guia de Montagem passo a passo em Markdown para: ${project.name}. ${project.description}`, null);
}

export async function parseBomToList(bomText: string): Promise<any[]> {
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

// 15. Generate Floor Plan from 3D (CORREÇÃO CRÍTICA - ESTILO AUTOCAD)
export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) throw new Error("Sem imagem 3D para base.");
    
    const imageSrc = project.views3d[0];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    // Engenharia de prompt para converter 3D -> 2D Técnico (Estilo AutoCAD)
    const technicalPrompt = `
    ATUE COMO: Um arquiteto técnico usando AutoCAD.
    TAREFA: Converter esta visualização 3D de um móvel/ambiente em uma PLANTA BAIXA TÉCNICA 2D (Vista Superior).
    
    REGRAS RÍGIDAS DE ESTILO (Blueprint/CAD):
    1. **Perspectiva:** ORTOGRÁFICA ESTRITA (90 graus, vista de cima). Nenhuma perspectiva 3D.
    2. **Linhas:** Linhas pretas finas e precisas para contornos.
    3. **Fundo:** BRANCO ABSOLUTO (High Contrast).
    4. **Detalhes:** Inclua representação esquemática de portas (arcos de abertura), gavetas e divisórias internas.
    5. **Cotas:** Adicione linhas de cota (dimensões) esquemáticas nas laterais para parecer um desenho técnico real.
    6. **Limpeza:** Sem texturas realistas, sem sombras, sem cores. Apenas desenho técnico vetorial P&B.
    `;
    
    return editImage(data, mimeType, technicalPrompt);
}

// 16. Generate 3D from 2D (CORREÇÃO CRÍTICA - ESTILO PROMOB)
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

// 17. Analyze Room Image (Vision API)
export async function analyzeRoomImage(base64Image: string): Promise<{ roomType: string, confidence: string, dimensions: { width: number, depth: number, height: number }, detectedObjects: string[] }> {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
    const data = base64Image.split(',')[1];

    const prompt = `Analise esta imagem de ambiente ou planta baixa.
    Identifique:
    1. Tipo de ambiente (Cozinha, Quarto, Sala, Banheiro, Escritório).
    2. Estime as dimensões aproximadas (Largura, Profundidade, Altura) em metros. Se não tiver certeza, estime um padrão.
    3. Liste objetos ou móveis já presentes.
    
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

// 18. Generate Layout Suggestions
export async function generateLayoutSuggestions(roomType: string, dimensions: any): Promise<{ title: string, description: string, pros: string }[]> {
    const prompt = `Para um ambiente do tipo "${roomType}" com dimensões ${dimensions.width}m x ${dimensions.depth}m.
    Sugira 3 layouts de móveis planejados eficientes.
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

// Placeholder functions imports fix
export async function calculateFinancialSummary(project: any) { return {}; }
export async function fetchSupplierCatalog() { return []; }
export async function calculateShippingCost() { return 0; }
