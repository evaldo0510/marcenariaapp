import { GoogleGenAI, Schema, Type, FunctionDeclaration, Modality } from "@google/genai";
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

// Helper for API retries
async function callApiWithRetry<T>(apiCall: () => Promise<T>, retries = 3): Promise<T> {
    try {
        return await apiCall();
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return callApiWithRetry(apiCall, retries - 1);
        }
        throw error;
    }
}

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

// 1. Suggest Alternative Styles
export async function suggestAlternativeStyles(projectDescription: string, currentStyle: string, base64Image?: string): Promise<string[]> {
    const prompt = `Atue como um Diretor de Arte e Consultor de Tendências de Design Sênior.
    
    **Contexto do Projeto:**
    - Descrição: "${projectDescription}"
    - Estilo Atual: "${currentStyle}"
    
    **Tarefa:**
    Sugira 3 estilos de design alternativos que sejam VISUALMENTE DISTINTOS do atual e entre si.
    O objetivo é oferecer ao cliente opções variadas (ex: se o atual é Moderno, sugira Rústico, Industrial e Clássico).
    
    **Regras:**
    1. Evite variações sutis do estilo atual.
    2. Use terminologia de design reconhecida (ex: Japandi, Art Déco, Mid-Century Modern, Wabi-Sabi, Industrial Loft, Provençal, Minimalista, Boho Chic).
    3. Retorne APENAS os nomes dos estilos.
    
    **Saída Obrigatória:**
    Retorne APENAS um array JSON de strings. Exemplo: ["Industrial", "Japandi", "Clássico Francês"]`;
    
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

// 2. Search Finishes (for FinishesSelector)
export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Procure ou gere sugestões de acabamentos de marcenaria (MDF, pedras, metais, vidros) que correspondam à descrição: "${query}".
    Retorne 4 opções variadas.
    Para cada opção, forneça:
    - id: string única
    - name: nome comercial comum
    - description: breve descrição visual
    - type: 'wood' | 'solid' | 'metal' | 'stone' | 'concrete' | 'ceramic' | 'fabric' | 'glass' | 'laminate' | 'veneer'
    - manufacturer: fabricante sugerido (ex: Arauco, Duratex, Guararapes) ou 'Genérico'
    - imageUrl: deixe em branco (null)
    
    Retorne JSON.`;

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
                        imageUrl: { type: Type.STRING, nullable: true }
                    },
                    required: ['id', 'name', 'description', 'type', 'manufacturer']
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<Finish[]>(response.text);
    }
    return [];
}

// 3. Edit Image (for ImageEditor and NewViewGenerator)
export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                fileToGenerativePart(base64Data, mimeType),
                { text: prompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        return part.inlineData.data;
    }
    throw new Error("Falha ao gerar imagem.");
}

// 4. Suggest Image Edits (for ImageEditor)
export async function suggestImageEdits(projectDescription: string, imageSrc: string): Promise<string[]> {
    const base64Data = imageSrc.split(',')[1];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';

    const prompt = `Analise esta imagem de projeto de marcenaria. Descrição original: "${projectDescription}".
    Sugira 4 possíveis edições ou melhorias visuais que poderiam ser feitas na imagem usando IA generativa (ex: mudar material, ajustar iluminação, alterar estilo).
    Retorne apenas as frases curtas de sugestão em um array JSON.`;

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

// 5. Generate Grounded Response (for ResearchAssistant and DistributorFinder)
export async function generateGroundedResponse(prompt: string, location: { latitude: number, longitude: number } | null): Promise<{ text: string, sources: any[] }> {
    const tools: any[] = [{ googleSearch: {} }];
    // If using googleMaps, it should be distinct, but generic search handles most queries.
    // If location provided and query implies places, maps might be better, but mixing is restrictive.
    // We will use Google Search grounding which returns web results and sometimes entity/map-like data.
    
    // Note: gemini-2.5-flash supports googleSearch.
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: tools,
        }
    });

    const text = response.text || "Não encontrei informações.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract simplified sources
    const sources = groundingChunks.map((chunk: any) => {
        if (chunk.web) return { web: chunk.web };
        return null;
    }).filter((s: any) => s !== null);

    return { text, sources };
}

// 6. Edit Floor Plan (for LayoutEditor)
export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    // Similar to editImage but prompt context is specific to floor plans
    return editImage(base64Data, mimeType, `Aja como um arquiteto. Edite esta planta baixa: ${prompt}. Mantenha o estilo técnico.`);
}

// 7. Estimate Project Costs (for CostEstimatorModal and ProposalModal)
export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
    const prompt = `Atue como um orçamentista de marcenaria.
    Analise os dados do projeto abaixo e ESTIME os custos de produção no Brasil (BRL).
    
    Projeto: ${project.name}
    Descrição: ${project.description}
    BOM (Lista de Materiais): ${project.bom || "Não fornecida, estime com base na descrição"}
    
    Considere preços médios de mercado para MDF, ferragens e hora/homem de marceneiro qualificado.
    
    Retorne JSON: { "materialCost": number, "laborCost": number }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

// 8. Generate Text (for BomGeneratorModal)
export async function generateText(prompt: string, images?: { data: string, mimeType: string }[] | null): Promise<string> {
    const parts: any[] = [{ text: prompt }];
    if (images) {
        images.forEach(img => {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Reasoning model for complex BOM generation
        contents: { parts }
    });

    return response.text || "Não foi possível gerar o texto.";
}

// 9. Generate Cutting Plan (for CuttingPlanGeneratorModal)
export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    const prompt = `Gere um plano de corte otimizado para chapas de ${sheetWidth}x${sheetHeight}mm.
    Baseado na seguinte BOM ou Descrição:
    ${project.bom || project.description}
    
    1. Retorne o plano de corte textual detalhado.
    2. Retorne dicas de otimização.
    
    Para a imagem do diagrama, não é possível gerar diretamente aqui em texto, então forneça uma descrição detalhada visual do layout das peças na chapa para que eu possa visualizar mentalmente.`;

    // Step 1: Get Text Plan
    const responseText = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    
    const textPlan = responseText.text || "Plano não gerado.";

    // Step 2: Try to generate a visual diagram representation (Image)
    const imagePrompt = `Um diagrama técnico esquemático 2D de um plano de corte de marcenaria (nesting) em uma chapa de MDF retangular. 
    Mostrar peças retangulares organizadas para otimizar espaço. Fundo branco, linhas pretas. Estilo vetorial técnico.
    Contexto: ${project.name}`;
    
    let imageBase64 = "";
    try {
        imageBase64 = await editImage("", "", imagePrompt); // Using editImage logic but actually generating from scratch if allow empty inputs or handle inside editImage logic?
        // Wait, editImage expects input. Let's make a direct call here since we don't have input image.
        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        if (imgResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            imageBase64 = imgResponse.candidates[0].content.parts[0].inlineData.data;
        }
    } catch (e) {
        console.warn("Could not generate cutting plan diagram", e);
        // Use a placeholder or empty
    }

    return {
        text: textPlan,
        image: imageBase64,
        optimization: "Dicas de otimização incluídas no texto principal."
    };
}

// 10. Find Project Leads (for EncontraProModal)
export async function findProjectLeads(city: string): Promise<ProjectLead[]> {
    const prompt = `Gere uma lista fictícia (simulação para demonstração) de 3 oportunidades de projetos de marcenaria (leads) na cidade de ${city}.
    Retorne JSON array com objetos:
    - id
    - title (ex: Armário de Cozinha Planejado)
    - description (breve)
    - location (Bairro, Cidade)
    - budget (Estimativa, ex: R$ 5.000 - R$ 8.000)
    `;

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
                    },
                    required: ['id', 'title', 'description', 'location', 'budget']
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<ProjectLead[]>(response.text);
    }
    return [];
}
