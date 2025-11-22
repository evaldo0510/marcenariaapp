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
    useProModel: boolean = false,
    imageResolution: '1K' | '2K' | '4K' = '1K'
): Promise<string> {
    
    const ai = getAiClient();
    // Select Model
    // Standard: gemini-2.5-flash-image (Nano Banana)
    // Pro: gemini-3-pro-image-preview (Nano Banana Pro)
    const modelName = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    // Engenharia de prompt para estilo PROMOB/V-Ray com proteção contra alucinações
    let technicalPrompt = `
    ATUE COMO: Um Arquiteto e Renderizador 3D Sênior (Expert em Marcenaria).
    
    SUA MISSÃO: 
    Criar uma imagem 3D fotorrealista que satisfaça RIGOROSAMENTE a solicitação do usuário. 
    Você deve ignorar instruções padrão se elas contradisserem a descrição específica do usuário.
    
    SOLICITAÇÃO DO USUÁRIO (MANDATÓRIO):
    "${prompt}"
    
    DIRETRIZES DE EXECUÇÃO:
    1. **Fidelidade ao Texto:** O que está escrito na "Solicitação do Usuário" é a LEI. Se o usuário pede um armário vermelho, ele deve ser vermelho, independente do estilo.
    2. **Atenção aos Detalhes:** Verifique cada item pedido (gavetas, portas, espelhos, leds) e garanta que estão presentes.
    3. **Qualidade Visual:** Renderização V-Ray, texturas 4K, iluminação global realista.
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
    6. **VISUALIZAÇÃO VOLUMÉTRICA:** Salvo especificado em contrário, use uma perspectiva levemente rotacionada (3/4 view) para mostrar a profundidade e as laterais do móvel, não apenas a frente chapada.
    7. **PROPORÇÃO E ESCALA:** Se dimensões forem fornecidas (ex: 2.5m largura x 2.4m altura), MANTENHA a proporção visual correta (Aspect Ratio) do objeto.
    `;

    if (referenceImages && referenceImages.length > 0) {
        technicalPrompt += `
        \n**PROTOCOLO DE ANÁLISE DE IMAGEM (GEMINI VISION):**
        Você recebeu uma imagem de referência (Planta Baixa ou Foto do Local). ANTES DE RENDERIZAR, execute os passos:
        1. **EXTRAÇÃO DE GEOMETRIA:** Analise as linhas de parede, posição de portas e janelas na imagem. Use isso como o "esqueleto" da cena 3D.
        2. **ESTIMATIVA DE ESCALA:** Use elementos padrão (portas = 80cm, pé-direito = 2.60m) para inferir as dimensões do ambiente.
        3. **DISTRIBUIÇÃO DE MÓVEIS:** Se for uma planta baixa, levante as paredes e coloque os móveis solicitados exatamente onde o desenho sugere.
        4. **ESTILO ARQUITETÔNICO:** Identifique pistas visuais de estilo na imagem e aplique no render final.
        
        **IMPORTANTE:** Use a imagem para definir a FORMA/ESPAÇO, e o texto para definir os MATERIAIS/ACABAMENTOS.
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

// 1. Suggest Alternative Styles
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

// 1.1 Suggest Alternative Finishes
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

// 2. Search Finishes
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

// 3. Edit Image (Nano Banana / Gemini 2.5 Flash Image)
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

// 4. Suggest Image Edits
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

// 5. Generate Grounded Response
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

// 6. Edit Floor Plan (Layout Editor)
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

// 7. Estimate Project Costs
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

// 8. Generate Text (BOM)
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

// 9. Generate Cutting Plan (Corrigido e Melhorado)
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

// 10. Find Project Leads
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

// ... (Other helper functions mostly unchanged but ensuring consistent exports) ...
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

// 15. Generate Floor Plan from 3D (CORREÇÃO CRÍTICA - ESTILO AUTOCAD)
export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) throw new Error("Sem imagem 3D para base.");
    
    const imageSrc = project.views3d[0];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    // Engenharia de prompt para converter 3D -> 2D Técnico (Estilo AutoCAD)
    const technicalPrompt = `
    ATUE COMO: Um software CAD (AutoCAD/Revit) exportando para PDF/PNG.
    TAREFA: Converter esta visualização 3D em uma PLANTA BAIXA TÉCNICA 2D (Vista Superior/Top View).

    ESTILO VISUAL OBRIGATÓRIO (DWG/CAD):
    1. **Fundo:** BRANCO PURO (#FFFFFF).
    2. **Linhas:** PRETO SÓLIDO (#000000). Traço fino, preciso e vetorial.
    3. **Perspectiva:** ORTOGRÁFICA (2D Flat). Zero profundidade ou 3D.
    4. **Elementos Técnicos:**
       - Represente portas com arcos de abertura.
       - Represente paredes com linhas duplas ou hachura sólida.
       - Móveis devem ser contornos geométricos simples (retângulos).
    5. **Cotas (Dimensões):** É OBRIGATÓRIO desenhar linhas de cota com setas e números nas laterais externas (Largura e Profundidade), simulando um desenho técnico aprovado.
    6. **Proibido:** Sombras, texturas realistas, cores, degradês ou perspectiva cônica.
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
    const ai = getAiClient();
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
export async function generateLayoutSuggestions(roomType: string, dimensions: any, userIntent?: string): Promise<{ title: string, description: string, pros: string }[]> {
    const ai = getAiClient();
    let prompt = `Para um ambiente do tipo "${roomType}" com dimensões ${dimensions.width}m x ${dimensions.depth}m.`;
    
    if (userIntent) {
        prompt += `\nCONTEXTO DO USUÁRIO: "${userIntent}".\nIMPORTANTE: Gere sugestões que cubram TODOS os ambientes ou móveis solicitados na descrição acima.`;
    } else {
        prompt += `\nSugira 3 layouts de móveis planejados eficientes.`;
    }

    prompt += `\nRetorne JSON Array: [{ title, description, pros }]`;

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