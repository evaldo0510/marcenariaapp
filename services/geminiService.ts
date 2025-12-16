
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import type { ProjectHistoryItem, ProjectLead, Finish } from '../types';

// --- CONFIGURAÇÃO DE API E PROXY ---

// SE VOCÊ COMPROU O GEMINIGEN OU OUTRO PROXY, ALTERE AQUI:
const USE_PROXY_AS_PRIMARY = false; // Mude para true se quiser usar o proxy como padrão
const CUSTOM_PROXY_URL = 'https://api.geminigen.ai/v1/generate'; // URL do serviço comprado
const CUSTOM_PROXY_KEY = ''; // Coloque a chave do GeminiGen aqui se tiver

// --- API KEY MANAGEMENT ---

// Helper to get the API key from various possible sources
export const getGeminiApiKey = (): string => {
    // 1. Check Local Storage (User's custom key overrides everything)
    if (typeof localStorage !== 'undefined') {
        const localKey = localStorage.getItem('gemini_api_key');
        if (localKey) return localKey;
    }
    
    // 2. Check configured Proxy Key if active
    if (USE_PROXY_AS_PRIMARY && CUSTOM_PROXY_KEY) {
        return CUSTOM_PROXY_KEY;
    }
    
    // 3. Check Environment Variables (Vercel/Vite System Key)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }

    if (typeof process !== 'undefined') {
        if (process.env.API_KEY) return process.env.API_KEY;
        if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY;
    }

    return '';
};

export const hasSystemApiKey = () => {
    const key = getGeminiApiKey();
    const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
    if (localKey) return true;
    return !!key;
}

// Helper to get a fresh AI client instance
const getAiClient = () => {
    const apiKey = getGeminiApiKey();
    return new GoogleGenAI({ apiKey: apiKey || '' });
};

// Unified generation function with resilient error handling
async function generateContentSafe(
    params: { model: string, contents: any, config?: any }
): Promise<GenerateContentResponse> {
    const ai = getAiClient();
    
    try {
        console.log(`[v2.5] Generating content with model: ${params.model}`);
        return await retryOperation(() => ai.models.generateContent(params));
    } catch (error: any) {
        console.error(`[v2.5] API call failed for ${params.model}:`, error.message);
        throw error; 
    }
}

// Helper for retrying operations with smart exponential backoff and rate limit handling
export async function retryOperation<T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Parse error object/string
        let errObj = error;
        let message = '';
        
        if (typeof error.message === 'string') {
            message = error.message.toLowerCase();
            if (message.startsWith('{') || message.includes('{"')) {
                 try {
                     const match = error.message.match(/({.*})/);
                     if (match) {
                        const parsed = JSON.parse(match[1]);
                        if (parsed.error) {
                            errObj = parsed.error;
                            message = (errObj.message || '').toLowerCase();
                        }
                     }
                 } catch (e) {}
            }
        }

        const status = errObj.status || errObj.code;
        
        const isRateLimit = status === 429 || 
                            status === 'RESOURCE_EXHAUSTED' || 
                            message.includes('429') || 
                            message.includes('quota') || 
                            message.includes('resource_exhausted');
                            
        const isNetworkError = message.includes('xhr') || message.includes('fetch') || status === 503;

        if (retries > 0 && (isNetworkError || isRateLimit)) {
            let waitTime = initialDelay;
            
            // Extract precise retry delay from error message: "Please retry in 52.28s"
            const match = message.match(/retry in ([0-9.]+)(s|ms)/);
            if (match) {
                 const val = parseFloat(match[1]);
                 const unit = match[2];
                 waitTime = (unit === 's' ? val * 1000 : val) + 1000; // Add 1s buffer
            } else if (isRateLimit) {
                // If rate limit but no specific time, backoff more aggressively
                waitTime = initialDelay * 2;
            }

            // Cap wait time to prevent UI hanging too long (max 60s)
            if (waitTime > 60000) {
                console.warn(`[Gemini Service] Wait time ${waitTime}ms too long. Aborting retry.`);
                throw error;
            }

            console.warn(`[Gemini Service] Operation failed (${status}). Retrying in ${Math.round(waitTime)}ms... (${retries} attempts left)`);
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return retryOperation(operation, retries - 1, waitTime * 1.5); // Exponential backoff for subsequent retries
        }
        throw error;
    }
}

export const fileToGenerativePart = (data: string, mimeType: string) => {
    return {
        inlineData: {
            data,
            mimeType
        }
    };
};

export function cleanAndParseJson<T>(text: string): T {
    let cleaned = text.trim();
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

// --- CORE AI FUNCTIONS ---

export async function detectEnvironments(imageBase64: { data: string, mimeType: string } | null): Promise<string[]> {
    const prompt = `
      ATUE COMO: Especialista Técnico em Levantamento Arquitetônico.
      TAREFA: Analise visualmente a imagem fornecida com precisão.
      Identifique todos os ambientes visíveis e liste-os.
      FORMATO DE RESPOSTA (JSON): { "ambientes": ["Nome do Ambiente 1", "Nome do Ambiente 2"] }
    `;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
        parts.push(fileToGenerativePart(imageBase64.data, imageBase64.mimeType));
    }

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
        const parsed = cleanAndParseJson<{ ambientes: string[] }>(response.text);
        return parsed.ambientes || [];
    }
    return [];
}

export async function generateArcVisionProject(
    description: string,
    selectedEnvs: string[],
    levelInfo: any,
    collectionInfo: any,
    imageBase64: { data: string, mimeType: string } | null
): Promise<any> {
    const envsList = selectedEnvs.join(", ");
    
    const promptText = `
      ATUE COMO: Mestre Marceneiro e Engenheiro de Projetos.
      
      TAREFA:
      Analise a imagem e o pedido: "${description}".
      Contexto: Ambientes ${envsList}, Nível ${levelInfo.label}, Material ${collectionInfo.label}.
      
      Gere um projeto técnico altamente detalhado.
      
      Gere um JSON com o seguinte schema:
      {
        "resumo_simples": "Resumo técnico executivo do projeto.",
        "ambientes": [
          {
            "nome": "Nome do Ambiente",
            "lista_corte": {
               "movel": "Nome Técnico do Móvel",
               "medidas_totais": "Altura x Largura x Profundidade (mm)",
               "material_corpo": "Especificação Técnica (ex: MDF 15mm Branco TX)",
               "material_frente": "Especificação Técnica (ex: MDF 18mm ${collectionInfo.label})",
               "lista_ferragens": ["Item 1 (Marca/Modelo)", "Item 2"],
               "obs_montagem": "Dica técnica de montagem ou fixação."
            },
            "vistas": [
              { "titulo": "Vista Principal", "prompt_tecnico": "Prompt de render 8k..." }
            ]
          }
        ]
      }
    `;

    const parts: any[] = [{ text: promptText }];
    if (imageBase64) {
        parts.push(fileToGenerativePart(imageBase64.data, imageBase64.mimeType));
    }

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });

    if (response.text) return cleanAndParseJson<any>(response.text);
    throw new Error("Falha ao gerar projeto ArcVision.");
}

export async function generateImage(
    prompt: string, 
    referenceImages?: { data: string, mimeType: string }[] | null, 
    framingStrategy?: string,
    useProModel: boolean = false,
    imageResolution: '1K' | '2K' | '4K' = '1K',
    decorationLevel: 'minimal' | 'standard' | 'rich' = 'standard',
    isMirrored: boolean = false
): Promise<string> {
    
    // Default to 'gemini-2.5-flash-image' (Nano Banana) for speed and cost
    // 'gemini-3-pro-image-preview' (Nano Banana 2) for higher quality if requested
    const modelName = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    let technicalPrompt = `
    ATUE COMO: Um Arquiteto e Renderizador 3D Sênior.
    SUA MISSÃO: Criar uma imagem 3D 100% FOTORREALISTA (estilo V-Ray/Unreal Engine 5).
    
    DETALHES DO PEDIDO: "${prompt}"
    
    DIRETRIZES VISUAIS:
    - Iluminação global (GI) suave e realista.
    - Sombras de contato precisas.
    - Reflexos corretos em materiais (vidros, metais, madeira).
    - Detalhes de marcenaria: Puxadores, rodapés, tamponamentos.
    `;

    if (referenceImages && referenceImages.length > 0) {
        technicalPrompt += `
    SE HOUVER IMAGEM DE REFERÊNCIA:
    1. **GEOMETRIA ESTRITA:** Use a imagem como "mapa de profundidade". Mantenha a composição, ângulo e proporção.
    2. **Rascunho para Realidade:** Converta linhas desenhadas em estruturas 3D reais.
    `;
    }

    if (framingStrategy) technicalPrompt += `\nENQUADRAMENTO: ${framingStrategy}`;
    if (isMirrored) technicalPrompt += `\nATENÇÃO: PLANTA ESPELHADA (INVERTER HORIZONTALMENTE).`;

    const parts: any[] = [{ text: technicalPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    try {
        const config: any = { responseModalities: [Modality.IMAGE] };
        if (useProModel) {
            config.imageConfig = { imageSize: imageResolution };
        }

        const response = await generateContentSafe({
            model: modelName,
            contents: { parts },
            config: config
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) return imagePart.inlineData.data;
        throw new Error("A IA não retornou uma imagem válida.");
        
    } catch (error: any) {
        // Fallback Logic for Quota Exceeded (429/Resource Exhausted) or Permission Denied (403)
        const errorMsg = (error.message || '').toLowerCase();
        const status = error.status || error.code;
        
        const isQuotaError = status === 429 || 
                             status === 'RESOURCE_EXHAUSTED' || 
                             errorMsg.includes('429') || 
                             errorMsg.includes('quota') || 
                             errorMsg.includes('resource_exhausted');
                             
        const isPermissionError = status === 403 || 
                                  status === 'PERMISSION_DENIED' || 
                                  errorMsg.includes('permission_denied') ||
                                  errorMsg.includes('403');

        // If Pro model failed, try Flash model
        if (useProModel && (isQuotaError || isPermissionError)) {
            console.warn(`Pro model failed (${status}). Falling back to Standard (Flash) model.`);
            return generateImage(prompt, referenceImages, framingStrategy, false, '1K', decorationLevel, isMirrored);
        }

        console.error("Generate Image Error:", error);
        throw error;
    }
}

export async function describeImageFor3D(base64Data: string, mimeType: string): Promise<string> {
    const prompt = `ATUE COMO: Especialista Técnico. 
    Analise esta imagem e forneça uma descrição técnica detalhada para reprodução em projeto 3D. 
    Destaque: Dimensões estimadas, materiais exatos, tipo de ferragem visível, estilo de design e funcionalidade.`;

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [fileToGenerativePart(base64Data, mimeType), { text: prompt }]
        }
    });

    return response.text || "Não foi possível descrever a imagem.";
}

export async function enhancePrompt(originalText: string): Promise<string> {
    const prompt = `
    Atue como um Mestre Marceneiro.
    TAREFA: Reescreva o pedido abaixo como uma especificação técnica para renderização 3D.
    ENTRADA: "${originalText}"
    INCLUA: Espessuras de MDF, iluminação LED, acabamentos detalhados e ferragens.
    `;

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text?.trim() || originalText;
}

export async function analyzeRoomImage(base64Image: string): Promise<{ roomType: string, confidence: string, dimensions: { width: number, depth: number, height: number }, detectedObjects: string[] }> {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
    const data = base64Image.split(',')[1];

    const prompt = `
    ATUE COMO: Google Lens / Scanner de Ambientes.
    TAREFA: Leitura métrica e espacial da imagem.
    
    Retorne JSON: { 
        roomType: string, 
        confidence: string ("Alta"/"Baixa"), 
        dimensions: { width: number, depth: number, height: number }, 
        detectedObjects: string[] 
    }`;

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [fileToGenerativePart(data, mimeType), { text: prompt }]
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

    if (response.text) return cleanAndParseJson(response.text);
    return { roomType: 'Desconhecido', confidence: 'Baixa', dimensions: { width: 3, depth: 3, height: 2.6 }, detectedObjects: [] };
}

export async function generateLayoutSuggestions(roomType: string, dimensions: any, userIntent?: string): Promise<{ title: string, description: string, pros: string }[]> {
    let prompt = `Com base no tipo de cômodo (${roomType}) e dimensões detectadas (${dimensions.width}m x ${dimensions.depth}m).`;
    
    if (userIntent) prompt += `\nCONTEXTO DO USUÁRIO (PRIORITÁRIO): "${userIntent}". Adapte o layout para atender este pedido.`;

    prompt += `\nSugira 3 layouts de móveis planejados eficientes. Retorne JSON Array: [{ title, description, pros }]`;

    const response = await generateContentSafe({
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

    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function generateDecorationList(projectDescription: string, style: string): Promise<{ item: string, category: string, estimatedPrice: string, suggestion: string }[]> {
    const prompt = `Atue como Designer de Interiores. Baseado em: "${projectDescription}" (Estilo: ${style}). Sugira 5 itens de decoração. JSON Array: { item, category, estimatedPrice, suggestion }`;
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function suggestAlternativeStyles(projectDescription: string, currentStyle: string, base64Image?: string): Promise<string[]> {
    const prompt = `Sugira 3 estilos visuais diferentes para: "${projectDescription}". JSON Array strings.`;
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
        const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
        const data = base64Image.split(',')[1];
        parts.push(fileToGenerativePart(data, mimeType));
    }
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function suggestAlternativeFinishes(projectDescription: string, style: string): Promise<Finish[]> {
    const prompt = `Sugira 3 acabamentos de MDF reais para: "${projectDescription}" (Estilo ${style}). JSON Array Finish.`;
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING }, manufacturer: { type: Type.STRING }, hexCode: { type: Type.STRING } } } } }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Sugira 4 acabamentos reais para: "${query}". JSON Array Finish objects.`;
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const enhancedPrompt = `${prompt}\nIMPORTANTE: Mantenha o enquadramento original (não faça zoom in).`;
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [fileToGenerativePart(base64Data, mimeType), { text: enhancedPrompt }] },
        config: { responseModalities: [Modality.IMAGE] }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) return part.inlineData.data;
    throw new Error("Falha ao editar imagem.");
}

export async function suggestImageEdits(projectDescription: string, imageSrc: string): Promise<string[]> {
    const base64Data = imageSrc.split(',')[1];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts: [fileToGenerativePart(base64Data, mimeType), { text: "Sugira 4 edições visuais. JSON Array strings." }] },
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function generateGroundedResponse(prompt: string, location: { latitude: number, longitude: number } | null): Promise<{ text: string, sources: any[] }> {
    const response = await generateContentSafe({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "Sem informações.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web ? { web: c.web } : null).filter(Boolean) || [];
    return { text, sources };
}

export async function findLocalSuppliers(location: { latitude: number, longitude: number }): Promise<any[]> {
    const prompt = `Encontre madeireiras próximas a Lat: ${location.latitude}, Long: ${location.longitude}.`;
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleMaps: {} }] }
    });
    const suppliers = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.maps).map((c: any) => ({ title: c.maps.title, uri: c.maps.uri })) || [];
    return suppliers;
}

export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const technicalPrompt = `
    ATUE COMO: Software CAD.
    TAREFA: Converter/Editar para PLANTA BAIXA TÉCNICA 2D.
    INSTRUÇÃO: ${prompt}
    ESTILO: Fundo branco, linhas pretas, ortográfica perfeita.
    `;
    return editImage(base64Data, mimeType, technicalPrompt);
}

export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
    const prompt = `Orce (Material + Mão de Obra) para: ${project.name}. Descrição: ${project.description}. BOM: ${project.bom || "Deduza da imagem"}. JSON {materialCost, laborCost}`;
    const parts: any[] = [{ text: prompt }];
    if (project.views3d && project.views3d.length > 0) {
        const imageSrc = project.views3d[0];
        parts.push(fileToGenerativePart(imageSrc.split(',')[1], imageSrc.match(/data:(.*);/)?.[1] || 'image/png'));
    }
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return { materialCost: 0, laborCost: 0 };
}

export async function generateText(prompt: string, images?: { data: string, mimeType: string }[] | null): Promise<string> {
    const parts: any[] = [{ text: prompt }];
    if (images) images.forEach(img => parts.push(fileToGenerativePart(img.data, img.mimeType)));
    const response = await generateContentSafe({ model: 'gemini-3-pro-preview', contents: { parts } });
    return response.text || "";
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    const textPrompt = `Plano de corte otimizado para ${project.name} em chapas ${sheetWidth}x${sheetHeight}mm. BOM: ${project.bom}`;
    const textResponse = await generateContentSafe({ model: 'gemini-3-pro-preview', contents: textPrompt });
    
    let imageBase64 = "";
    try {
        const imgResponse = await generateContentSafe({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: "Diagrama esquemático 2D de Nesting (plano de corte). Fundo branco, linhas técnicas." }] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        const imgPart = imgResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imgPart) imageBase64 = imgPart.inlineData.data;
    } catch (e) {}

    return { text: textResponse.text || "", image: imageBase64, optimization: "Verifique o veio da madeira." };
}

export async function findProjectLeads(city: string): Promise<ProjectLead[]> {
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: `3 leads de marcenaria em ${city}. JSON Array ProjectLead.`,
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function generateProjectBom(project: ProjectHistoryItem): Promise<string> {
    return generateText(`BOM técnica completa para: ${project.name}.`, null);
}

export async function parseBomToList(bomText: string): Promise<any[]> {
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: `Extraia itens da BOM para JSON Array [{item, qty, dimensions}]. BOM: ${bomText}`,
        config: { responseMimeType: 'application/json' }
    });
    if (response.text) return cleanAndParseJson(response.text);
    return [];
}

export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) throw new Error("Sem imagem 3D.");
    const src = project.views3d[0];
    const technicalPrompt = `
    ATUE COMO: Software CAD.
    TAREFA: Converter para PLANTA BAIXA 2D.
    ESTILO: Fundo branco, linhas pretas, ortográfica.
    `;
    return editImage(src.split(',')[1], src.match(/data:(.*);/)?.[1] || 'image/png', technicalPrompt);
}
