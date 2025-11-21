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

// --- GENERATE IMAGE FUNCTION ---
export async function generateImage(prompt: string, referenceImages?: { data: string, mimeType: string }[] | null): Promise<string> {
    const parts: any[] = [{ text: prompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
        // Instrução reforçada para fidelidade geométrica
        parts.push({ text: "IMPORTANTE: As imagens fornecidas são a REFERÊNCIA ESTRUTURAL ABSOLUTA. O render 3D deve manter EXATAMENTE o mesmo layout, geometria, quantidade de portas/gavetas e proporções do desenho/foto original. Use a descrição de texto APENAS para definir materiais, cores, texturas e iluminação. NÃO adicione, remova ou modifique a estrutura do móvel mostrado na referência." });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        // Iterate parts to find inlineData image
        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        
        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        }
        
        throw new Error("A IA não retornou uma imagem válida. Tente simplificar a descrição.");
    } catch (error) {
        console.error("Generate Image Error:", error);
        throw error;
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

// 1.1 Suggest Alternative Finishes
export async function suggestAlternativeFinishes(projectDescription: string, style: string): Promise<Finish[]> {
    const prompt = `Atue como um Especialista em Materiais e Acabamentos de Marcenaria.
    
    **Contexto:**
    - Projeto: "${projectDescription}"
    - Estilo de Design: "${style}"
    
    **Tarefa:**
    Sugira exatamente 3 acabamentos que combinem com o estilo do projeto, sendo OBRIGATORIAMENTE:
    1. Uma opção de **Madeira** (MDF madeirado ou lâmina natural).
    2. Uma opção de **Laca** (Pintura sólida fosca, brilho ou MDF unicolor).
    3. Uma opção de **Metal** (Serralheria, alumínio ou acabamento metalizado).
    
    As sugestões devem ser de produtos disponíveis no mercado brasileiro (Duratex, Arauco, Guararapes, Sudati, Sayyerlack, etc).
    
    Para cada sugestão, forneça:
    - id: string única (ex: 'sug_1')
    - name: Nome comercial e cor (ex: "MDF Carvalho Hannover", "Laca Cinza Grafite", "Aço Corten")
    - description: Por que este acabamento combina com o estilo ${style}?
    - type: 'wood' | 'solid' | 'metal' | 'stone' | 'concrete' | 'ceramic' | 'fabric' | 'glass' | 'laminate' | 'veneer'
    - manufacturer: Fabricante real sugerido (Duratex, Arauco, Guararapes, Sudati, Sayyerlack, etc.)
    - hexCode: Código HEX aproximado da cor para visualização.
    - imageUrl: deixe null.
    
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


// 2. Search Finishes (for FinishesSelector)
export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Procure ou gere sugestões de acabamentos de marcenaria (MDF, pedras, metais, vidros) do mercado brasileiro que correspondam à descrição: "${query}".
    Retorne 4 opções variadas e realistas.
    
    Para cada opção, forneça:
    - id: string única
    - name: nome comercial comum (ex: MDF Carvalho Hannover, MDF Branco Diamante)
    - description: breve descrição visual (cor, textura, acabamento)
    - type: 'wood' | 'solid' | 'metal' | 'stone' | 'concrete' | 'ceramic' | 'fabric' | 'glass' | 'laminate' | 'veneer'
    - manufacturer: fabricante sugerido real (ex: Duratex, Arauco, Guararapes, Sudati, Eucatex) ou 'Genérico' se não aplicável.
    - imageUrl: deixe null.
    - hexCode: código HEX aproximado da cor predominante (ex: #8B4513 para madeira escura).
    
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
                        imageUrl: { type: Type.STRING, nullable: true },
                        hexCode: { type: Type.STRING, description: "Código HEX aproximado da cor" }
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

// 6. Edit Floor Plan (for LayoutEditor)
export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    return editImage(base64Data, mimeType, `Aja como um arquiteto. Edite esta planta baixa: ${prompt}. Mantenha o estilo técnico.`);
}

// 7. Estimate Project Costs (for CostEstimatorModal and ProposalModal)
export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
    const parts: any[] = [];

    const prompt = `Atue como um Orçamentista Técnico Sênior de Marcenaria no Brasil.
    
    Sua tarefa é realizar uma estimativa precisa de custos de **Material** e **Mão de Obra** para o projeto, realizando uma auditoria cruzada entre a Lista de Materiais (BOM) e a complexidade visual do projeto 3D.

    **Dados do Projeto:**
    - Nome: ${project.name}
    - Descrição: ${project.description}
    - BOM (Lista de Materiais): ${project.bom || "Não fornecida, deduza da imagem e descrição."}

    **Instruções de Cálculo:**
    1. **Materiais:** Considere preços médios de mercado (São Paulo/BR) para MDF (chapas de 15mm, 18mm, 6mm), fitas de borda, ferragens (dobradiças com amortecedor, corrediças telescópicas) e insumos.
    2. **Mão de Obra:** Analise as **IMAGENS 3D fornecidas** (se houver) para determinar a **Complexidade de Montagem**.
       - Projetos simples (caixaria reta, portas de abrir): Mão de obra padrão (aprox. 80-100% do material).
       - Projetos complexos (muitos nichos, gavetas internas, recortes, fitas de LED, ripados, laca): Aumente significativamente o valor da mão de obra (pode chegar a 150-200% do material).
       - Considere todas as etapas: Corte, Fitação, Pré-montagem, Transporte e Instalação no cliente.

    **Saída:**
    Retorne APENAS um JSON com os valores estimados em Reais (BRL):
    { "materialCost": number, "laborCost": number }`;

    parts.push({ text: prompt });

    if (project.views3d && project.views3d.length > 0) {
        // Use up to 3 views for better context on complexity
        const viewsToUse = project.views3d.slice(0, 3);
        viewsToUse.forEach(imageSrc => {
            const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
            const data = imageSrc.split(',')[1];
            parts.push(fileToGenerativePart(data, mimeType));
        });
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

// 8. Generate Text (for BomGeneratorModal)
export async function generateText(prompt: string, images?: { data: string, mimeType: string }[] | null): Promise<string> {
    const parts: any[] = [{ text: prompt }];
    if (images) {
        images.forEach(img => {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts }
    });

    return response.text || "Não foi possível gerar o texto.";
}

// 9. Generate Cutting Plan
export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    const prompt = `Gere um plano de corte otimizado para chapas de ${sheetWidth}x${sheetHeight}mm.
    Baseado na seguinte BOM ou Descrição:
    ${project.bom || project.description}
    
    1. Retorne o plano de corte textual detalhado.
    2. Retorne dicas de otimização.
    
    Para a imagem do diagrama, não é possível gerar diretamente aqui em texto, então forneça uma descrição detalhada visual do layout das peças na chapa para que eu possa visualizar mentalmente.`;

    const responseText = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    
    const textPlan = responseText.text || "Plano não gerado.";

    const imagePrompt = `Um diagrama técnico esquemático 2D de um plano de corte de marcenaria (nesting) em uma chapa de MDF retangular. 
    Mostrar peças retangulares organizadas para otimizar espaço. Fundo branco, linhas pretas. Estilo vetorial técnico.
    Contexto: ${project.name}`;
    
    let imageBase64 = "";
    try {
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
    }

    return {
        text: textPlan,
        image: imageBase64,
        optimization: "Dicas de otimização incluídas no texto principal."
    };
}

// 10. Find Project Leads
export async function findProjectLeads(city: string): Promise<ProjectLead[]> {
    const prompt = `Gere uma lista fictícia (simulação para demonstração) de 3 oportunidades de projetos de marcenaria (leads) na cidade de ${city}.
    Retorne JSON array com objetos:
    - id
    - title
    - description
    - location
    - budget
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

// 11. Generate Project BOM (Automated)
export async function generateProjectBom(project: ProjectHistoryItem): Promise<string> {
    const parts: any[] = [];
    
    const prompt = `Atue como um **Orçamentista Técnico Sênior**.
    Crie uma **Lista de Materiais (BOM)** completa para o seguinte projeto.
    
    **Projeto:** ${project.name}
    **Descrição:** ${project.description}
    
    **Regras:**
    1. Adicione 10% de margem de perda.
    2. Use milímetros (mm).
    3. Inclua chapas, ferragens e acabamentos.
    
    Gere a resposta em **Markdown** com tabelas claras.`;
    
    parts.push({ text: prompt });

    if (project.views3d && project.views3d.length > 0) {
        const imageSrc = project.views3d[0];
        const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
        const data = imageSrc.split(',')[1];
        parts.push(fileToGenerativePart(data, mimeType));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts }
    });

    return response.text || "Não foi possível gerar a BOM.";
}

// 12. Generate Assembly Details
export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
    const parts: any[] = [];
    
    const prompt = `Atue como um **Instrutor de Marcenaria Sênior**.
    Crie um **Guia de Montagem Passo a Passo** profissional e detalhado para o projeto abaixo.
    
    **Projeto:** ${project.name}
    **Descrição:** ${project.description}
    
    **Estrutura Obrigatória do Guia (Markdown):**
    
    ## 1. 🧰 Preparação
    *   **Ferramentas Necessárias:** Liste furadeiras, brocas (diâmetros), chaves, martelo, nível, etc.
    *   **Ferragens:** Liste os parafusos (tamanhos), cavilhas, dobradiças e corrediças que serão usados.
    *   **Segurança:** Itens de EPI recomendados.
    
    ## 2. 🏗️ Sequência de Montagem (Passo a Passo)
    *Divida em etapas lógicas (ex: Estrutura Externa, Gavetas, Portas, Instalação).*
    *   **Passo 1:** ...
    *   **Passo 2:** ...
    
    ## 3. 🔧 Dicas de Mestre (Regulagem e Acabamento)
    *   Como regular as dobradiças para alinhar as portas perfeitamente.
    *   Como instalar as corrediças niveladas.
    *   Dicas para fixação na parede (se aéreo).
    
    Use linguagem técnica mas acessível.`;
    
    parts.push({ text: prompt });

    if (project.views3d && project.views3d.length > 0) {
        const imageSrc = project.views3d[0];
        const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
        const data = imageSrc.split(',')[1];
        parts.push(fileToGenerativePart(data, mimeType));
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts }
    });

    return response.text || "Guia não gerado.";
}

// 13. Parse BOM to List
export async function parseBomToList(bomText: string): Promise<any[]> {
    const prompt = `Extraia os itens da seguinte Lista de Materiais (BOM) e retorne um array JSON estruturado.
    
    BOM:
    ${bomText}
    
    Retorne JSON array: [{ "item": "nome", "qty": "quantidade", "dimensions": "dimensões ou detalhes" }]`;

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
                        qty: { type: Type.STRING },
                        dimensions: { type: Type.STRING }
                    }
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<any[]>(response.text);
    }
    return [];
}

// 14. Find Supplier Price
export async function findSupplierPrice(itemDescription: string): Promise<{ price: number, supplier: string, url: string }> {
    // Simulation or grounding search
    // For now, simulated estimate
    const prompt = `Estime o preço médio unitário (BRL) para: "${itemDescription}" no mercado brasileiro de marcenaria (ex: Leo Madeiras, GMAD).
    Retorne JSON: { "price": number, "supplier": "Nome do Fornecedor Exemplo", "url": "url_exemplo" }`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    price: { type: Type.NUMBER },
                    supplier: { type: Type.STRING },
                    url: { type: Type.STRING }
                }
            }
        }
    });

    if (response.text) {
        return cleanAndParseJson<{ price: number, supplier: string, url: string }>(response.text);
    }
    return { price: 0, supplier: "N/A", url: "" };
}

// 15. Generate Floor Plan from 3D
export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) throw new Error("Sem imagem 3D para base.");
    
    const imageSrc = project.views3d[0];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    const prompt = `Gere uma planta baixa técnica 2D (vista superior) esquemática baseada neste móvel 3D.
    Estilo: Desenho técnico arquitetônico, linhas pretas, fundo branco.
    Mostre as dimensões gerais e layout interno se visível.`;
    
    return editImage(data, mimeType, prompt); // Reusing editImage logic which uses gemini-2.5-flash-image
}

// 16. Generate 3D from 2D
export async function generate3Dfrom2D(project: ProjectHistoryItem, style: string, finish: string): Promise<string> {
    if (!project.image2d) throw new Error("Sem planta baixa 2D.");
    
    const imageSrc = project.image2d;
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
    const data = imageSrc.split(',')[1];
    
    const prompt = `Renderize uma visualização 3D fotorrealista baseada nesta planta baixa 2D.
    Estilo de Design: ${style}.
    Acabamento: ${finish}.
    Perspectiva: Vista frontal ou isométrica atraente.
    Iluminação: Estúdio suave.`;
    
    return editImage(data, mimeType, prompt);
}

// Placeholder functions for missing exports referenced in App.tsx imports
export async function calculateFinancialSummary(project: any) { return {}; }
export async function fetchSupplierCatalog() { return []; }
export async function calculateShippingCost() { return 0; }