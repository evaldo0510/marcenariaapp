
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

// --- FALLBACK PROXY LOGIC ---

async function callCustomProxy(model: string, contents: any, config: any): Promise<GenerateContentResponse> {
    const payload = {
        model,
        contents,
        ...config, 
        apiKey: getGeminiApiKey() 
    };

    let url = USE_PROXY_AS_PRIMARY ? CUSTOM_PROXY_URL : 'https://api.geminigen.ai/uapi/v1/generate';
    
    console.log(`[Connection] Usando rota: ${USE_PROXY_AS_PRIMARY ? 'Proxy Primário' : 'Proxy Fallback'}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getGeminiApiKey()}` 
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Proxy] Error:", errText);
        throw new Error(`Proxy Request Failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data as GenerateContentResponse;
}

// Unified generation function with fallback logic
async function generateContentSafe(
    params: { model: string, contents: any, config?: any }
): Promise<GenerateContentResponse> {
    
    if (USE_PROXY_AS_PRIMARY) {
        try {
            return await callCustomProxy(params.model, params.contents, params.config);
        } catch (e: any) {
            console.error("Falha no Proxy Primário:", e);
            throw e; 
        }
    }

    const ai = getAiClient();
    
    try {
        console.log(`[v2.4] Generating content with model: ${params.model}`);
        return await retryOperation(() => ai.models.generateContent(params));
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.warn(`[v2.4] Direct API call failed:`, errorMsg);

        if (errorMsg.includes('fetch') || errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.includes('location')) {
            console.warn(`[v2.4] Attempting proxy fallback...`);
            try {
                return await callCustomProxy(params.model, params.contents, params.config);
            } catch (proxyError) {
                console.error("[v2.4] Proxy fallback also failed:", proxyError);
            }
        }
        throw error; 
    }
}

// Helper for retrying operations with exponential backoff
async function retryOperation<T>(operation: () => Promise<T>, retries = 1, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const status = error.status || error.code;
        const message = error.message || '';
        
        const isRateLimit = status === 429 || status === 'RESOURCE_EXHAUSTED' || message.includes('429') || message.includes('quota');
        const isNetworkError = message.includes('xhr') || message.includes('fetch') || status === 503;

        if (retries > 0 && (isNetworkError || isRateLimit)) {
            let waitTime = delay;
            
            if (isRateLimit) {
                const retryMatch = message.match(/retry in ([0-9.]+)(s|ms)/);
                if (retryMatch) {
                    const val = parseFloat(retryMatch[1]);
                    const unit = retryMatch[2];
                    const parsedWait = unit === 's' ? val * 1000 : val;
                    
                    if (parsedWait < 15000) {
                        waitTime = parsedWait + 1000;
                        console.warn(`Rate limit hit. Retrying automatically in ${waitTime}ms...`);
                    } else {
                        throw error;
                    }
                } else {
                    waitTime = delay * 2;
                }
            } else {
                waitTime = delay * 2;
            }

            await new Promise(resolve => setTimeout(resolve, waitTime));
            return retryOperation(operation, retries - 1, isRateLimit ? waitTime : delay * 2);
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
      ATUE COMO: Especialista Técnico em Levantamento Arquitetônico (Google Lens Vision).
      TAREFA: Analise visualmente a imagem fornecida com extrema precisão.
      Identifique todos os ambientes visíveis e liste-os.
      FORMATO DE RESPOSTA (JSON OBRIGATÓRIO): { "ambientes": ["Nome do Ambiente 1", "Nome do Ambiente 2"] }
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
      ATUE COMO: Mestre Marceneiro e Engenheiro de Projetos (Nível Google Lens).
      
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
    
    const modelName = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    let technicalPrompt = `
    ATUE COMO: Um Arquiteto e Renderizador 3D Sênior (Expert em Visualização de Produtos).
    SUA MISSÃO: Criar uma imagem 3D 100% FOTORREALISTA (estilo V-Ray/Unreal Engine 5) que satisfaça EXATAMENTE a solicitação: "${prompt}"
    
    DIRETRIZES TÉCNICAS ESTRITAS (GOOGLE LENS VISION):
    1. **Fidelidade Geométrica:** Se houver uma imagem de referência, respeite a geometria das paredes, posição de janelas e portas RIGOROSAMENTE. O móvel deve encaixar perfeitamente no espaço.
    2. **Realismo Absoluto:** Iluminação global (GI), sombras de contato suaves, reflexos corretos nos materiais (vidro, laca, madeira).
    3. **Detalhamento:** Puxadores, espessuras de borda (frentes de 18mm/25mm), rodapés e sancas devem ser visíveis e técnicos.
    4. **Enquadramento:** Use um ângulo de câmera profissional (altura dos olhos ou levemente superior).
    `;

    if (framingStrategy) technicalPrompt += `\nENQUADRAMENTO ESPECÍFICO: ${framingStrategy}`;
    if (isMirrored) technicalPrompt += `\nATENÇÃO: PLANTA ESPELHADA (INVERTER HORIZONTALMENTE).`;

    const parts: any[] = [{ text: technicalPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    try {
        const config: any = { responseModalities: [Modality.IMAGE] };
        if (useProModel) config.imageConfig = { imageSize: imageResolution };

        const response = await generateContentSafe({
            model: modelName,
            contents: { parts },
            config: config
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePart && imagePart.inlineData) return imagePart.inlineData.data;
        throw new Error("A IA não retornou uma imagem válida.");
    } catch (error) {
        console.error("Generate Image Error:", error);
        throw error;
    }
}

export async function describeImageFor3D(base64Data: string, mimeType: string): Promise<string> {
    const prompt = `ATUE COMO: Google Lens / Especialista Técnico. 
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
    // Prompt de Engenharia Refinado para Marcenaria Técnica
    const prompt = `
    Atue como um Mestre Marceneiro e Especialista em Projetos 3D.
    
    TAREFA: Interprete o pedido do usuário e reescreva-o como uma especificação técnica completa para renderização realista.
    
    ENTRADA ORIGINAL: "${originalText}"
    
    DIRETRIZES DE REESCRITA (OBRIGATÓRIO INCLUIR):
    1. **Espessuras de MDF:** Especifique (ex: "Caixaria 15mm Branco TX", "Frentes 18mm", "Tamponamento 25mm").
    2. **Iluminação LED:** Detalhe o tipo (ex: "Perfil LED 4000K embutido", "Fita LED COB 3000K", "Spots dicróicos").
    3. **Acabamentos Detalhados:** (ex: "Laca fosca", "Vidro Reflecta Bronze", "Puxador Cava usinado", "Perfil Gola Alumínio").
    4. **Ferragens:** (ex: "Dobradiças soft-close", "Corrediças ocultas").
    
    SAÍDA: Apenas o texto técnico reescrito.
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
    ATUE COMO: Google Lens / Scanner de Ambientes 3D.
    TAREFA: Realizar uma leitura métrica e espacial completa do ambiente na foto.

    1. **Identificação:** Qual é o cômodo?
    2. **Métricas Precisas (Triangulação):** 
       - Use objetos de referência (portas=2.10m, interruptores=1.10m, balcões=90cm) para calcular as dimensões do ambiente.
       - Estime Largura, Profundidade e Pé-direito.
    3. **Detecção Estrutural:** Liste janelas, vigas, colunas, pontos elétricos e hidráulicos visíveis.
    
    Retorne JSON: { 
        roomType: string, 
        confidence: string ("Alta" se a imagem for clara), 
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
    
    if (userIntent) prompt += `\nCONTEXTO DO USUÁRIO: "${userIntent}".`;

    prompt += `\nSugira 3 layouts de móveis planejados eficientes, descrevendo cada um (disposição, ergonomia, circulação).
    Retorne JSON Array: [{ title, description, pros }]`;

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
    const prompt = `Atue como um Designer de Interiores. Baseado em: "${projectDescription}" (Estilo: ${style}). Sugira 5 itens de decoração. JSON Array: { item, category, estimatedPrice, suggestion }`;
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
    const prompt = `Atue como um Especialista em Materiais de Marcenaria e Tendências.
    Projeto: "${projectDescription}"
    Estilo: "${style}" (Moderno/Contemporâneo)
    
    Sugira 3 opções de acabamentos de MDF REAIS e de ALTO PADRÃO que combinem com este projeto.
    
    MANDATÓRIO:
    1. Use nomes comerciais exatos dos fabricantes (ex: "MDF Louro Freijó (Arauco)", "MDF Carvalho Hanover (Duratex)", "MDF Cinza Sagrado (Duratex)").
    2. Na descrição, justifique a escolha esteticamente e sugira uma cor secundária para compor.
    3. Tente oferecer variações (um madeirado claro, um escuro e um unicolor ou pedra).
    
    Retorne JSON Array com objetos Finish.`;

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
    ATUE COMO: Um software CAD (AutoCAD/Revit) exportando para PDF/PNG.
    TAREFA: Converter/Editar para PLANTA BAIXA TÉCNICA 2D (Vista Superior/Top View).
    INSTRUÇÃO: ${prompt}

    ESTILO VISUAL OBRIGATÓRIO (DWG/CAD):
    1. **TIPO DE IMAGEM:** Desenho técnico linear (Line Art). NÃO gere uma imagem renderizada ou fotográfica.
    2. **Fundo:** BRANCO PURO (#FFFFFF) uniforme.
    3. **Linhas:** PRETO SÓLIDO (#000000). Traço fino e nítido. Alto contraste.
    4. **Perspectiva:** ORTOGRÁFICA PERFEITA (2D Flat). Top-Down 90 graus.
    5. **Elementos:** Portas com arco de abertura, paredes com linhas duplas (15cm).
    6. **Cotas (Dimensões):** OBRIGATÓRIO: Insira linhas de cota (dimension lines) com setas e números indicando as medidas.
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
    ATUE COMO: Um software CAD (AutoCAD/Revit) exportando para PDF/PNG.
    TAREFA: Converter esta visualização 3D em uma PLANTA BAIXA TÉCNICA 2D (Vista Superior/Top View).
    
    ESTILO VISUAL OBRIGATÓRIO (DWG/CAD):
    1. **TIPO DE IMAGEM:** Desenho técnico linear (Line Art). NÃO gere uma imagem renderizada ou fotográfica.
    2. **Fundo:** BRANCO PURO (#FFFFFF) uniforme.
    3. **Linhas:** PRETO SÓLIDO (#000000). Traço fino e nítido. Alto contraste.
    4. **Perspectiva:** ORTOGRÁFICA PERFEITA (2D Flat). Top-Down 90 graus.
    5. **Elementos Arquitetônicos:**
       - Portas: Desenhe o arco de abertura da porta (90 graus).
       - Janelas: Linhas duplas ou triplas finas na parede.
       - Paredes: Linhas duplas paralelas (espessura 15cm).
    6. **Cotas (Dimensões):** ADICIONE linhas de chamada e cotas numéricas externas indicando largura e profundidade aproximadas.
    `;
    return editImage(src.split(',')[1], src.match(/data:(.*);/)?.[1] || 'image/png', technicalPrompt);
}
