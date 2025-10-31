import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { Part } from "@google/genai";
import type { Finish, ProjectHistoryItem, LocationState, Marceneiro } from '../types';
import { cleanAndParseJson } from "../utils/helpers";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToGenerativePart(base64Data: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

async function callApiWithRetry<T extends () => Promise<GenerateContentResponse>>(
  apiCall: T,
  maxRetries: number = 3
): Promise<GenerateContentResponse> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("API call failed after multiple retries.");
}

function processImageGenerationResponse(response: GenerateContentResponse, errorContext: string): string {
    // Check for blocking reasons first
    if (response.promptFeedback?.blockReason) {
        const blockReason = response.promptFeedback.blockReason;
        const blockMessage = response.promptFeedback.blockReasonMessage || 'Motivo não especificado.';
        console.error(`${errorContext} bloqueada. Motivo: ${blockReason}. Mensagem: ${blockMessage}`);
        throw new Error(`A ${errorContext} foi bloqueada por motivos de segurança: ${blockReason}. ${blockMessage}`);
    }

    // Check if the model refused to generate an image
    if (response.candidates?.[0]?.finishReason === 'NO_IMAGE') {
        console.error(`A IA se recusou a gerar uma imagem para ${errorContext}. Motivo: NO_IMAGE.`);
        throw new Error(`A IA não conseguiu gerar uma imagem para esta solicitação. Isso pode acontecer por motivos de segurança ou se o pedido for muito complexo. Tente reformular sua solicitação.`);
    }

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
        return imagePart.inlineData.data;
    }

    // If no image, check if there's a text response with an error
    const textPart = response.text;
    if (textPart) {
        console.error(`A IA retornou texto em vez de uma imagem durante ${errorContext}:`, textPart);
        throw new Error(`A IA retornou uma mensagem de texto em vez de uma imagem: "${textPart}"`);
    }

    // Generic error if nothing else matches
    console.error(`Resposta inesperada da IA durante ${errorContext}:`, JSON.stringify(response, null, 2));
    throw new Error(`Não foi possível realizar a ${errorContext}. A resposta da IA não continha dados de imagem ou texto de erro.`);
}


export async function generateImage(
    prompt: string, 
    base64Images: { data: string; mimeType: string }[] | null,
    purpose: '3d-render' | '2d-diagram' = '3d-render'
): Promise<string> {
    const parts: Part[] = [{ text: prompt }];
    if (base64Images) {
        for (const img of base64Images) {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        }
    }

    let systemInstruction = '';
    if (purpose === '3d-render') {
        systemInstruction = `Atue como um diretor de arte e fotógrafo de estúdio, especialista em renderização 3D para marcenaria de luxo. Seu objetivo é criar imagens fotorrealistas com qualidade de catálogo de design, indistinguíveis de uma fotografia profissional.

**FOCO PRINCIPAL: ATMOSFERA E DETALHES**
- **Atmosfera Luxuosa e Convidativa:** A imagem deve evocar uma sensação de conforto, elegância e sofisticação. A iluminação ambiente é a chave para isso. Pense em uma luz suave de fim de tarde entrando pela janela ou uma iluminação de estúdio quente e difusa.
- **Detalhes do Acabamento:** O realismo dos materiais é crucial. A textura da madeira, o brilho do metal, a frieza da pedra – tudo deve ser renderizado com extrema precisão. Dê zoom nos detalhes para garantir que os veios, as juntas e as superfícies sejam perfeitos.

**PRINCÍPIOS TÉCNICOS INEGOCIÁVEIS:**
- **Fotorrealismo Absoluto:** A meta é a perfeição fotográfica. Lute contra a aparência "plástica" ou artificial. Pense como uma câmera: modele a luz, respeite as propriedades físicas dos materiais (PBR), e simule a profundidade de campo (bokeh).
- **Iluminação e Sombra:** Modele a luz de forma cinematográfica para criar profundidade, volume e drama. As sombras devem ser suaves e precisas, com oclusão de ambiente em todas as junções. Os reflexos devem interagir de forma crível com as superfícies e o ambiente.
- **Tato e Materialidade:** A representação dos materiais deve ser tátil. A madeira precisa ter veios visíveis e imperfeições sutis. O metal deve ter reflexos anisotrópos. As pedras devem parecer sólidas e naturais. A textura é fundamental para o realismo.

**DIRETRIZES DE ESTILO:**
- **Composição e Ângulos:** Crie composições visualmente atraentes. Use ângulos de câmera que valorizem o design do móvel e sua funcionalidade no espaço.
- **Ambientação:** O ambiente deve complementar o móvel, não competir com ele. Use decorações minimalistas e realistas (um vaso, um livro, uma manta).

**INSPIRAÇÃO OBRIGATÓRIA:** Seu trabalho deve ser fortemente baseado nos estilos, acabamentos e qualidades de design encontrados nos seguintes portfólios de referência. Use-os como sua principal fonte de inspiração para garantir um resultado alinhado com as tendências de ponta do mercado de luxo:
- Portfólios de design de interiores no Behance e Dribbble.
- Sites de fabricantes de móveis de alto padrão como Dimare, Finger e Casa Brasileira.`;
    } else { // 2d-diagram
        systemInstruction = `Você é um especialista sênior em AutoCAD e design técnico de uma renomada firma de arquitetura internacional. Sua tarefa é criar um conjunto completo de vistas técnicas 2D para projetos de marcenaria, com base na descrição fornecida. O resultado final deve ser uma única imagem (uma prancha técnica), perfeitamente organizada, contendo todas as vistas necessárias para a fabricação e apresentação ao cliente.

**REGRAS E PADRÕES TÉCNICOS INEGOCIÁVEIS:**

1.  **Conjunto de Vistas Obrigatório:** A imagem de saída DEVE conter as seguintes vistas, claramente legendadas em português (ex: "VISTA FRONTAL", "VISTA LATERAL", "PLANTA BAIXA", "VISTA EXPLODIDA"):
    *   **Vista Frontal:** A visão principal do móvel.
    *   **Vistas Laterais:** Pelo menos uma vista lateral (esquerda ou direita) que mostre detalhes importantes. Se ambas forem iguais, uma é suficiente.
    *   **Planta Baixa (Vista Superior):** A visão de cima, mostrando a profundidade e layout.
    *   **Vista Explodida (Isométrica):** Uma vista isométrica mostrando como as peças principais se encaixam. Esta vista é crucial para a montagem.
    *   **(Opcional) Vista em Corte (Seção):** Se o design interno for complexo (ex: gavetas, divisórias especiais), inclua uma vista em corte para clarear a construção.

2.  **Dimensionamento (Cotas) Exaustivo:**
    *   Todas as vistas ortográficas (frontal, lateral, planta) devem ser completamente cotadas em milímetros (mm).
    *   Inclua cotas totais (altura, largura, profundidade) e parciais (vãos, nichos, gavetas, portas, etc.).
    *   As linhas de cota devem ser finas, claras e não sobrepor o desenho principal.

3.  **Estilo Visual Profissional:**
    *   **Padrão CAD:** Use exclusivamente linhas finas e pretas sobre um fundo branco puro (#FFFFFF).
    *   **Proibido:** Sem cores, texturas, sombras ou gradientes. O estilo deve ser 100% técnico (exceto a vista explodida que pode ter um sombreamento sutil para clareza, mas sem cores).
    *   **Layout Limpo:** Organize as vistas de forma lógica e espaçada na prancha de desenho digital. A composição deve ser equilibrada e profissional.

4.  **Anotações e Detalhes:**
    *   **Indicação de Materiais:** Use setas e legendas curtas para indicar materiais e espessuras (ex: "MDF 18mm", "Fundo 6mm", "Espelho 4mm").
    *   **Notas Construtivas:** Adicione notas quando necessário para explicar detalhes de montagem (ex: "Fundo encaixado em rasgo de 5mm", "Fixação com parafusos e cavilhas").
    *   **Escala:** Indique uma escala de referência (ex: "Escala 1:20" ou "Sem Escala").

5.  **Precisão Absoluta:** Siga estritamente as medidas e detalhes fornecidos no prompt do usuário. A precisão é fundamental para a fabricação.

**SAÍDA FINAL:** A imagem gerada deve ser uma prancha técnica coesa e pronta para produção, contendo apenas as vistas, cotas e anotações solicitadas. Não inclua bordas de folha, carimbos ou logotipos.`;
    }

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
            systemInstruction: systemInstruction
        },
    });

    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, "geração da imagem");
}

export async function generateText(prompt: string, base64Images: { data: string; mimeType: string }[] | null): Promise<string> {
    const parts: Part[] = [{ text: prompt }];
    if (base64Images) {
        for (const img of base64Images) {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        }
    }
    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
    });
    const response = await callApiWithRetry(apiCall);
    return response.text;
}

export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const parts: Part[] = [
        fileToGenerativePart(base64Data, mimeType),
        { text: prompt },
    ];
    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, "edição da imagem");
}

export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Você é um especialista em acabamentos de marcenaria. Com base na busca do usuário, retorne uma lista de até 8 acabamentos de MDF, laminados ou outros materiais relevantes de fabricantes brasileiros conhecidos (Duratex, Arauco, Guararapes, etc.).
    Para cada acabamento, forneça as seguintes informações em um objeto JSON: id (string única, pode ser o nome do fabricante e nome do acabamento), name (string), description (string, curta e informativa), type (enum: 'wood', 'solid', 'metal', 'stone', 'concrete', 'ceramic', 'fabric', 'glass', 'laminate', 'veneer'), imageUrl (string, URL pública e acessível da imagem do acabamento), manufacturer (string, nome do fabricante).
    Retorne APENAS um array de objetos JSON, sem nenhum texto adicional.
    Busca do usuário: "${query}"`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
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
                        imageUrl: { type: Type.STRING },
                        manufacturer: { type: Type.STRING },
                    },
                    required: ['id', 'name', 'description', 'type', 'imageUrl', 'manufacturer'],
                },
            }
        }
    });

    const response = await callApiWithRetry(apiCall);
    try {
        return cleanAndParseJson<Finish[]>(response.text);
    } catch (e) {
        console.error("Failed to parse finishes JSON:", response.text, e);
        throw new Error("A IA retornou um formato de dados inesperado. Tente refinar sua busca.");
    }
}

export async function generateGroundedResponse(query: string, location: LocationState): Promise<{ text: string; sources: any[] }> {
    const config: any = {
        tools: [{ googleSearch: {} }],
    };
    if (location) {
        config.tools.push({ googleMaps: {} });
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude
                }
            }
        };
    }

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: config
    });
    const response = await callApiWithRetry(apiCall);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, sources };
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    const bom = project.bom || "Lista de materiais não disponível.";
    const prompt = `Analise a seguinte lista de materiais (BOM) para um projeto de marcenaria. Crie um plano de corte otimizado para chapas de MDF de ${sheetWidth}x${sheetHeight}mm.
    
    BOM:
    ${bom}
    
    Sua resposta DEVE ser um único objeto JSON com as seguintes chaves:
    1. "cuttingPlanMarkdown": Uma string formatada em Markdown com o plano de corte detalhado. Liste as chapas necessárias e, para cada uma, as peças que serão cortadas dela, com suas respectivas medidas.
    2. "cuttingPlanImagePrompt": Uma string que servirá de prompt para uma IA de geração de imagem. Este prompt deve descrever visualmente o diagrama de corte de UMA das chapas, de forma clara, para que a IA possa desenhar um layout 2D mostrando o posicionamento das peças na chapa para minimizar o desperdício. Deve ser um prompt técnico de desenho, não uma descrição artística. Exemplo: "Desenhe um diagrama 2D de um plano de corte em uma chapa retangular. A chapa tem ${sheetWidth}x${sheetHeight}mm. Dentro dela, posicione os seguintes retângulos representando as peças, com suas medidas indicadas: Peça A (600x400mm), Peça B (600x400mm), Peça C (800x300mm)...".
    3. "cuttingPlanOptimization": Uma string em Markdown com dicas e sugestões ACIONÁVEIS para otimizar ainda mais o uso do material. Analise o plano que você acabou de criar e forneça sugestões claras para reduzir o desperdício, como rotação de peças, agrupamentos ou melhor sequência de corte.
    
    Retorne APENAS o objeto JSON.`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    cuttingPlanMarkdown: { type: Type.STRING },
                    cuttingPlanImagePrompt: { type: Type.STRING },
                    cuttingPlanOptimization: { type: Type.STRING }
                },
                required: ['cuttingPlanMarkdown', 'cuttingPlanImagePrompt', 'cuttingPlanOptimization']
            }
        }
    });

    const response = await callApiWithRetry(apiCall);
    try {
        const result = cleanAndParseJson<{ cuttingPlanMarkdown: string, cuttingPlanImagePrompt: string, cuttingPlanOptimization: string }>(response.text);
        const cuttingPlanImage = await generateImage(result.cuttingPlanImagePrompt, null, '2d-diagram');
        return { text: result.cuttingPlanMarkdown, image: cuttingPlanImage, optimization: result.cuttingPlanOptimization };
    } catch (e) {
        console.error("Failed to parse cutting plan JSON or generate image:", response.text, e);
        throw new Error("A IA retornou um formato de dados inesperado para o plano de corte.");
    }
}

export async function optimizeCuttingPlan(project: ProjectHistoryItem): Promise<string> {
    const bom = project.bom || "Lista de materiais não disponível.";
    const cuttingPlan = project.cuttingPlan || "Plano de corte não disponível.";
    const prompt = `Você é um especialista em otimização de marcenaria. Analise a lista de materiais (BOM) e o plano de corte gerado para o projeto a seguir.
    Seu objetivo é fornecer dicas e sugestões ACIONÁVEIS para otimizar ainda mais o uso do material e reduzir o desperdício.

    **BOM do Projeto:**
    ${bom}

    **Plano de Corte Atual:**
    ${cuttingPlan}

    **INSTRUÇÕES DE SAÍDA:**
    1.  **Formato:** Use Markdown.
    2.  **Tom:** Seja direto e prático, como um consultor sênior.
    3.  **Estrutura:** Comece com um resumo geral do aproveitamento. Depois, liste as sugestões em bullet points (usando '-'). Cada sugestão deve ser clara e explicar o benefício (ex: "Considere rotacionar a Peça C para aproveitar a sobra da Chapa 1...").
    4.  **Foco:** Concentre-se em agrupamento de peças, rotação, melhor sequência de corte, ou pequenas alterações de design que não comprometam o resultado final.

    **Sua Análise de Otimização (em Markdown):**`;

    return await generateText(prompt, null);
}

export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const parts: Part[] = [
        fileToGenerativePart(base64Data, mimeType),
        { text: `Sua tarefa é editar esta planta baixa 2D. Mantenha o estilo de desenho técnico (linhas pretas, fundo branco) e as cotas (medidas). Siga a instrução do usuário e retorne APENAS a imagem da nova planta baixa editada.` },
    ];
    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, "edição da planta baixa");
}

// Novo serviço para gerar Detalhes de Montagem
export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
    const finishDescription = project.selectedFinish
        ? `Acabamento principal: '${project.selectedFinish.finish.name}' da ${project.selectedFinish.manufacturer}. ${
            project.selectedFinish.handleDetails ? `Detalhe de puxador: '${project.selectedFinish.handleDetails}'.` : ''
        }`
        : 'Acabamento não especificado.';

    const prompt = `Você é um marceneiro mestre e redator técnico. Com base na descrição, estilo e acabamento do projeto abaixo, elabore um texto detalhado para a seção "Detalhes de Montagem".

**Projeto:** ${project.name}
**Descrição:** ${project.description}
**Estilo:** ${project.style}
**Acabamento Principal:** ${finishDescription}
${project.details ? `**Detalhes Construtivos Prévios:**\n${project.details}` : ''}

**Instruções para o Texto de Detalhes de Montagem:**
1.  **Analise o Contexto:** Utilize todas as informações disponíveis para inferir as técnicas de montagem mais apropriadas para o tipo e estilo do móvel.
2.  **Formato:** Use Markdown.
3.  **Tom:** Profissional, claro e técnico, mas compreensível para uma equipe de produção.
4.  **Estrutura:** Crie seções com cabeçalhos (##) para:
    *   **Preparação das Peças:** Detalhe sobre furação, usinagem e bordas.
    *   **Sistema de Fixação Principal:** Descreva os principais métodos (parafusos, cavilhas, minifix, etc.).
    *   **Encaixes e Ajustes:** Mencione técnicas específicas para portas, gavetas, prateleiras.
    *   **Instalação de Ferragens:** Guia para dobradiças, corrediças, puxadores.
    *   **Acabamentos Finais:** Instruções para limpeza, ajustes finos e inspeção de qualidade.

Seja específico e transmita a sequência lógica e as melhores práticas de montagem, baseando suas conclusões no texto fornecido.`;

    const imagesToPass: { data: string; mimeType: string }[] = [];
    if (project.views3d.length > 0) {
        const view = project.views3d[0];
        // Extract base64 data and mime type from data URI
        const mimeMatch = view.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        imagesToPass.push({ data: view.split(',')[1], mimeType: mimeType });
    }
    if (project.image2d) {
        // Extract base64 data and mime type from data URI
        const mimeMatch = project.image2d.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        imagesToPass.push({ data: project.image2d.split(',')[1], mimeType: mimeType });
    }
    
    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, ...(imagesToPass.length > 0 ? imagesToPass : [])] },
    });
    const response = await callApiWithRetry(apiCall);
    return response.text;
}


export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number, laborCost: number }> {
    const bom = project.bom || "Lista de materiais não disponível.";
    const prompt = `Você é um orçamentista sênior de uma marcenaria de alto padrão no Brasil. Sua tarefa é estimar os custos de material e mão de obra para o projeto a seguir.

**Descrição do Projeto:**
- Nome: ${project.name}
- Detalhes: ${project.description}
- Acabamento: ${project.selectedFinish ? project.selectedFinish.finish.name : 'Não especificado'}

**Lista de Materiais (BOM):**
${bom}

**Instruções:**
1.  **Analise realisticamente** a complexidade do projeto e a lista de materiais.
2.  **Baseie seus custos** em valores médios praticados no mercado brasileiro atual (use o Real - BRL como moeda).
3.  **Custo de Material:** Calcule o custo total dos materiais listados (chapas de MDF, ferragens, fitas de borda, etc.).
4.  **Custo de Mão de Obra:** Estime o valor da mão de obra, considerando o tempo de corte, montagem, acabamento e instalação. Leve em conta a complexidade do design.
5.  **Retorne APENAS um objeto JSON** com as seguintes chaves e valores numéricos (sem R$ ou formatação):
    - "materialCost": (number) Custo total estimado dos materiais.
    - "laborCost": (number) Custo total estimado da mão de obra.

Retorne APENAS o objeto JSON.`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
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

    const response = await callApiWithRetry(apiCall);
    try {
        return cleanAndParseJson<{ materialCost: number, laborCost: number }>(response.text);
    } catch (e) {
        console.error("Failed to parse cost estimation JSON:", response.text, e);
        throw new Error("A IA retornou um formato de dados inesperado para a estimativa de custos.");
    }
}

export async function parseBomToList(bomMarkdown: string): Promise<{ item: string; qty: string; dimensions: string }[]> {
    const prompt = `Analise a seguinte Lista de Materiais (BOM) em Markdown e a converta para um array de objetos JSON.
    Para cada item, extraia o nome do item, a quantidade e as dimensões.

    BOM:
    ${bomMarkdown}

    Retorne APENAS um array de objetos JSON com as chaves "item", "qty" e "dimensions".
    Exemplo de saída: [{ "item": "Lateral", "qty": "2x", "dimensions": "700x500x18mm" }]`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item: { type: Type.STRING },
                        qty: { type: Type.STRING },
                        dimensions: { type: Type.STRING },
                    },
                    required: ['item', 'qty', 'dimensions'],
                },
            }
        }
    });

    const response = await callApiWithRetry(apiCall);
    try {
        return cleanAndParseJson<{ item: string; qty: string; dimensions: string }[]>(response.text);
    } catch (e) {
        console.error("Failed to parse BOM list JSON:", response.text, e);
        throw new Error("A IA retornou um formato de dados inesperado ao analisar a BOM.");
    }
}

export async function findSupplierPrice(itemDescription: string): Promise<{ supplier: string, price: number, url: string }> {
    const prompt = `Usando a busca na web, encontre um preço médio em Reais (BRL) para o seguinte item de marcenaria no mercado brasileiro: "${itemDescription}".
    
    Retorne APENAS um objeto JSON com as seguintes chaves:
    - "supplier": (string) O nome de um fornecedor conhecido (ex: Leo Madeiras, Leroy Merlin).
    - "price": (number) O preço médio encontrado para uma unidade do item.
    - "url": (string) A URL da fonte onde o preço foi encontrado.`;

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    supplier: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    url: { type: Type.STRING },
                },
                required: ['supplier', 'price', 'url'],
            }
        }
    });
    
    const response = await callApiWithRetry(apiCall);
    try {
        const result = cleanAndParseJson<{ supplier: string, price: number, url: string }>(response.text);
        // Basic validation
        if (typeof result.price !== 'number' || !result.supplier || !result.url) {
            throw new Error('Formato de preço inválido recebido.');
        }
        return result;
    } catch (e) {
        console.error("Failed to parse supplier price JSON:", response.text, e);
        throw new Error("Não foi possível encontrar um preço para este item.");
    }
}

// --- NEW MOCK SERVICES FOR ADMIN PANELS ---

export function calculateFinancialSummary(project: ProjectHistoryItem): { revenue: number, margin: number, profit: number } {
    const revenue = project.projectValue || 0;
    const totalCost = (project.materialCost || 0) + (project.laborCost || 0);
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, margin, profit };
}

export async function fetchSupplierCatalog(): Promise<{ id: string, name: string, description: string, price: string, imageUrl: string }[]> {
    // This is a mock function. In a real app, it would fetch from a supplier's API.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { id: 'dur_cristallo', name: 'MDF Cristallo Branco', description: 'Chapa de MDF de alta densidade com acabamento brilhante.', price: 'R$ 350,00', imageUrl: 'https://via.placeholder.com/150/FFFFFF/000000?Text=Cristallo' },
                { id: 'ara_canela', name: 'MDF Arauco Canela', description: 'Padrão amadeirado clássico, ideal para ambientes sofisticados.', price: 'R$ 420,00', imageUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?Text=Canela' },
                { id: 'gua_cinza', name: 'MDF Guararapes Cinza Sagrado', description: 'Tonalidade de cinza neutra com acabamento fosco.', price: 'R$ 380,00', imageUrl: 'https://via.placeholder.com/150/808080/FFFFFF?Text=Cinza' },
                { id: 'fg_corrediça', name: 'Corrediça Telescópica 450mm', description: 'Par de corrediças de extração total, para gavetas.', price: 'R$ 25,00', imageUrl: 'https://via.placeholder.com/150/C0C0C0/000000?Text=Corrediça' },
            ]);
        }, 1000);
    });
}

export async function calculateShippingCost(address?: string): Promise<{ cost: number, eta: string }> {
    // Mock function
    return new Promise(resolve => {
        setTimeout(() => {
            if (!address) {
                resolve({ cost: 0, eta: 'N/A' });
                return;
            }
            const cost = 50 + Math.random() * 150; // Random cost between 50 and 200
            const etaDays = Math.floor(2 + Math.random() * 5);
            resolve({ cost: parseFloat(cost.toFixed(2)), eta: `${etaDays} dias úteis` });
        }, 800);
    });
}

export async function fetchMarceneiros(cidade: string, especialidade: string): Promise<Marceneiro[]> {
    // This is a mock function. In a real app, it would query a database.
    const mockDB: Marceneiro[] = [
        { id: 1, nome: 'João Silva', cidade: 'São Paulo', especialidade: ['Cozinhas', 'Armários'], anosExperiencia: 15, notaMedia: 4.8, email: 'joao.silva@marceneiro.com' },
        { id: 2, nome: 'Maria Oliveira', cidade: 'Rio de Janeiro', especialidade: ['Closets', 'Home Theater'], anosExperiencia: 10, notaMedia: 4.9, email: 'maria.oliveira@marceneiro.com' },
        { id: 3, nome: 'Carlos Pereira', cidade: 'São Paulo', especialidade: ['Móveis para Escritório'], anosExperiencia: 20, notaMedia: 4.7, email: 'carlos.pereira@marceneiro.com' },
        { id: 4, nome: 'Ana Costa', cidade: 'Belo Horizonte', especialidade: ['Cozinhas', 'Banheiros'], anosExperiencia: 8, notaMedia: 4.6, email: 'ana.costa@marceneiro.com' },
    ];
    
    return new Promise(resolve => {
        setTimeout(() => {
            const result = mockDB.filter(m =>
                (!cidade || m.cidade.toLowerCase().includes(cidade.toLowerCase())) &&
                (!especialidade || m.especialidade.some(e => e.toLowerCase().includes(especialidade.toLowerCase())))
            );
            resolve(result);
        }, 500);
    });
}