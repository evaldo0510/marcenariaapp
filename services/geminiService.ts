import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { Part } from "@google/genai";
import type { Finish, ProjectHistoryItem, LocationState, Marceneiro, PricedBomItem, ProjectLead } from '../types';
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
    base64Images: { data: string; mimeType: string }[] | null
): Promise<string> {
    const model = 'gemini-2.5-flash-image';

    const parts: Part[] = [{ text: prompt }];

    if (base64Images) {
        for (const img of base64Images) {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        }
    }

    const apiCall = () => ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: { responseModalities: [Modality.IMAGE] },
    });
    
    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, `geração de imagem`);
}

export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    const parts: Part[] = [
        fileToGenerativePart(base64Data, mimeType),
        { text: prompt }
    ];

    const apiCall = () => ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: { responseModalities: [Modality.IMAGE] },
    });
    
    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, 'edição de imagem');
}

export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    const parts: Part[] = [
        fileToGenerativePart(base64Data, mimeType),
        { text: `Você é um editor de plantas baixas 2D. Com base na imagem fornecida e na instrução a seguir, redesenhe a planta baixa mantendo o mesmo estilo (preto e branco, técnico, com cotas). Aplique a seguinte modificação: "${prompt}"` }
    ];

    const apiCall = () => ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const response = await callApiWithRetry(apiCall);
    return processImageGenerationResponse(response, 'edição de planta baixa');
}

export async function generateText(prompt: string, base64Images: { data: string; mimeType: string }[] | null): Promise<string> {
    const model = 'gemini-2.5-pro';

    const parts: Part[] = [{ text: prompt }];

    if (base64Images) {
        for (const img of base64Images) {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        }
    }
    
    const apiCall = () => ai.models.generateContent({
        model: model,
        contents: { parts: parts },
    });

    const response = await callApiWithRetry(apiCall);
    return response.text;
}

export async function generateFloorPlanFrom3D(project: ProjectHistoryItem): Promise<string> {
    if (!project.views3d || project.views3d.length === 0) {
        throw new Error("É necessária uma imagem 3D para gerar a planta baixa.");
    }

    const base64Image = {
        data: project.views3d[0].split(',')[1],
        mimeType: project.views3d[0].match(/data:(.*);/)?.[1] || 'image/png'
    };

    const prompt = `**Persona:** Você é um arquiteto técnico e desenhista CAD sênior, especialista em criar desenhos de fabricação para marcenaria. Sua precisão é lendária.

**Tarefa:** Converta a imagem 3D e a descrição de um móvel em um desenho técnico 2D profissional, pronto para produção.

**Contexto:** Este desenho é a única fonte de informação para o marceneiro. Erros ou omissões nas dimensões resultarão em desperdício de material. A clareza e a precisão são absolutamente críticas.

**Input:**
1.  **Imagem 3D:** [A imagem do móvel será fornecida]
2.  **Descrição do Projeto:** "${project.description}"

**Requisitos de Saída (Siga estas regras sem exceção):**
1.  **Estilo:** Desenho técnico 2D, preto e branco, linhas finas e precisas (estilo AutoCAD). **NÃO** use sombreamento, gradientes, cores ou texturas. Fundo branco puro.
2.  **Vistas Essenciais:** A imagem final DEVE conter as três vistas ortográficas principais, organizadas e alinhadas:
    *   **Vista Superior (Planta Baixa):** Mostrando a profundidade e largura.
    *   **Vista Frontal:** Mostrando a largura e altura.
    *   **Vista Lateral (Direita ou Esquerda):** Mostrando a profundidade e altura.
3.  **Dimensionamento (Cotas) - O MAIS IMPORTANTE:**
    *   **Unidade Obrigatória:** Todas as cotas DEVEM ser em **MILÍMETROS (mm)**. Não use cm, m ou polegadas.
    *   **Cotas Gerais:** Adicione as dimensões totais (Altura Total, Largura Total, Profundidade Total) em cada vista apropriada.
    *   **Cotas Detalhadas:** Adicione dimensões para TODOS os componentes visíveis: espessura de painéis, altura de gavetas, largura de portas, espaçamento entre prateleiras, altura do rodapé. Seja exaustivo.
    *   **Clareza das Cotas:** As linhas de dimensão, setas e números devem ser nítidos, legíveis e não devem sobrepor o desenho principal.
4.  **Escala:** O desenho deve ser perfeitamente proporcional. Se possível, adicione uma nota de escala (ex: "Escala 1:10").
5.  **Foco Absoluto:** O desenho deve mostrar SOMENTE o móvel. Exclua qualquer elemento de fundo da imagem 3D original (paredes, pisos, decorações).`;

    return generateImage(prompt, [base64Image]);
}

export async function generate3Dfrom2D(project: ProjectHistoryItem, newStyle: string, newFinish: string): Promise<string> {
    if (!project.image2d) {
        throw new Error("É necessária uma planta baixa 2D para gerar uma nova vista 3D.");
    }

    const floorPlanImage = {
        data: project.image2d.split(',')[1],
        mimeType: project.image2d.match(/data:(.*);/)?.[1] || 'image/png'
    };

    const prompt = `Com base na planta baixa 2D fornecida e na descrição do projeto, gere uma imagem 3D fotorrealista.
- **Descrição Original do Projeto:** "${project.description}"
- **Estilo Original:** "${project.style}"
- **NOVO Estilo de Design Desejado:** "${newStyle}"
- **NOVO Acabamento Principal:** "${newFinish}"

**Requisitos da Imagem:**
- O fundo deve ser um estúdio de fotografia minimalista com iluminação suave e difusa.
- O foco deve ser total no móvel, mostrando-o de forma clara e atraente.
- A qualidade da renderização deve ser fotorrealista.`;

    return generateImage(prompt, [floorPlanImage]);
}

export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Você é um assistente especialista em acabamentos de marcenaria. Com base na busca do usuário, retorne uma lista de 4 a 8 acabamentos (MDF, laminados, etc.) que correspondam à descrição. Para cada um, forneça um ID único, nome, uma breve descrição, o tipo, uma URL de imagem de alta qualidade (use a API do Pexels ou Unsplash, ex: https://images.pexels.com/photos/XXXX/YYYY.jpeg?auto=compress&cs=tinysrgb&w=400) e um fabricante conhecido (ex: Duratex, Arauco, Guararapes, Formica). Retorne a resposta APENAS como um array JSON.
    
    Busca do usuário: "${query}"`;
    
    const response = await generateText(prompt, null);
    
    return cleanAndParseJson<Finish[]>(response);
}


export async function generateGroundedResponse(query: string, location: LocationState): Promise<{ text: string; sources: any[] }> {
    const model = "gemini-2.5-flash";
    
    const config: any = {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
    };

    if (location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        };
    }

    const apiCall = () => ai.models.generateContent({
        model: model,
        contents: `Você é Iara, uma assistente de pesquisa especializada em marcenaria. Responda à pergunta do usuário de forma concisa e útil, usando os resultados da busca. Sempre que citar uma informação, indique a fonte. Pergunta: "${query}"`,
        config: config,
    });
    
    const response = await callApiWithRetry(apiCall);
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string; image: string; optimization: string }> {
  const bom = project.bom || "Lista de materiais não disponível.";
  
  const textPrompt = `Gere um plano de corte otimizado em Markdown para a seguinte lista de materiais (BOM), considerando chapas de ${sheetWidth}x${sheetHeight}mm. Liste as chapas necessárias e, para cada uma, quais peças serão cortadas dela. Forneça o total de chapas e a porcentagem de aproveitamento. BOM: \n${bom}`;
  const imagePrompt = `Crie um diagrama visual simplificado de um plano de corte para a seguinte BOM, em chapas de ${sheetWidth}x${sheetHeight}mm. Mostre a disposição das peças na chapa. Use linhas simples e texto claro. BOM: \n${bom}`;
  const optimizationPrompt = `Forneça 2-3 dicas práticas e concisas em Markdown para otimizar o corte e minimizar o desperdício para a BOM a seguir: \n${bom}`;

  const [text, image, optimization] = await Promise.all([
    generateText(textPrompt, null),
    generateImage(imagePrompt, null),
    generateText(optimizationPrompt, null),
  ]);

  return { text, image, optimization };
}

export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number; laborCost: number }> {
    const prompt = `Você é um especialista em orçamentos para marcenaria. Com base na descrição, BOM e imagens do projeto, estime o custo de material e o custo de mão de obra em Reais (BRL). A mão de obra deve considerar a complexidade e o tempo de fabricação e montagem.
    Descrição: ${project.description}
    BOM: ${project.bom || "Não fornecida"}
    Retorne a resposta APENAS como um objeto JSON com as chaves "materialCost" e "laborCost".`;
    
    const images = project.views3d.map(url => ({
        data: url.split(',')[1],
        mimeType: url.match(/data:(.*);/)?.[1] || 'image/png'
    }));

    const response = await generateText(prompt, images);
    
    return cleanAndParseJson<{ materialCost: number; laborCost: number }>(response);
}

export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
  const prompt = `Crie um guia de montagem detalhado em Markdown para o projeto a seguir. Inclua uma lista de ferramentas, a ordem dos passos e dicas importantes.
  Descrição: ${project.description}
  BOM: ${project.bom || "Não fornecida"}`;
  
  const images = project.views3d.map(url => ({
      data: url.split(',')[1],
      mimeType: url.match(/data:(.*);/)?.[1] || 'image/png'
  }));

  return await generateText(prompt, images);
}

export const parseBomToList = async (bom: string): Promise<PricedBomItem[]> => {
  const prompt = `Analise a seguinte Bill of Materials (BOM) em Markdown e extraia cada item em uma estrutura JSON. Ignore os cabeçalhos das seções. Para cada item, extraia a quantidade, o nome do item e as dimensões (se aplicável).
  BOM:
  ${bom}
  
  Retorne APENAS um array de objetos JSON com as chaves: "item", "qty", "dimensions".`;

  const response = await generateText(prompt, null);
  return cleanAndParseJson<{item: string; qty: string; dimensions: string}[]>(response).map(i => ({...i, isSearching: false}));
};

export const findSupplierPrice = async (itemDescription: string): Promise<{price: number, supplier: string, url: string}> => {
  const prompt = `Pesquise o preço médio de mercado para o seguinte item de marcenaria: "${itemDescription}". Encontre um fornecedor online conhecido no Brasil (como Leo Madeiras, GMAD, etc.) e retorne o preço e o nome do fornecedor.
  
  Retorne APENAS um objeto JSON com as chaves "price" (number), "supplier" (string), e "url" (string).`;
  
  const response = await generateGroundedResponse(prompt, null); // Use grounded response for web search
  const textResponse = response.text;
  
  // A Gemini pode retornar o JSON diretamente ou em um texto. Vamos extrair.
  return cleanAndParseJson<{price: number, supplier: string, url: string}>(textResponse);
};

export const calculateFinancialSummary = async (materialCost: number, laborCost: number, overheadPercent: number, profitMarginPercent: number): Promise<{projectValue: number, profitValue: number}> => {
    const prompt = `Calcule o valor final de um projeto de marcenaria e o lucro.
    Custo de Material: R$ ${materialCost}
    Custo de Mão de Obra: R$ ${laborCost}
    Custos Indiretos (Overhead): ${overheadPercent}% sobre (Material + Mão de Obra)
    Margem de Lucro: ${profitMarginPercent}% sobre o custo total (Material + Mão de Obra + Overhead)
    
    Retorne APENAS um objeto JSON com as chaves "projectValue" (valor final para o cliente) e "profitValue" (valor do lucro).`;
    
    const response = await generateText(prompt, null);
    return cleanAndParseJson<{projectValue: number, profitValue: number}>(response);
};

export async function fetchSupplierCatalog(supplierName: string): Promise<Finish[]> {
    const prompt = `Busque no catálogo online de "${supplierName}" por 5-10 padrões de MDF populares. Para cada um, forneça um ID único, nome, uma breve descrição, o tipo ('wood' ou 'solid'), uma URL de imagem de alta qualidade do padrão e o nome do fabricante ("${supplierName}"). Retorne a resposta APENAS como um array JSON.`;
    
    const response = await generateGroundedResponse(prompt, null);
    return cleanAndParseJson<Finish[]>(response.text);
}

export async function calculateShippingCost(cepOrigem: string, cepDestino: string, project: ProjectHistoryItem): Promise<number> {
    const prompt = `Estime o custo de frete para um móvel com base no projeto abaixo, de ${cepOrigem} para ${cepDestino}. Considere as dimensões e o peso provável dos materiais listados na BOM.
    Descrição: ${project.description}
    BOM: ${project.bom}
    
    Retorne APENAS um objeto JSON com a chave "shippingCost" (number).`;
    
    const response = await generateGroundedResponse(prompt, null);
    const result = cleanAndParseJson<{shippingCost: number}>(response.text);
    return result.shippingCost;
}

export const findMarceneirosPro = async (especialidade: string, cidade: string): Promise<Marceneiro[]> => {
    const prompt = `Busque na plataforma "EncontraPro" por marceneiros na cidade de "${cidade}" com a especialidade em "${especialidade}". Retorne uma lista de até 5 profissionais. Para cada um, forneça id, nome, cidade, especialidades (array de strings), anos de experiência, nota média e email. Retorne APENAS um array de objetos JSON.`;
    const response = await generateGroundedResponse(prompt, null);
    return cleanAndParseJson<Marceneiro[]>(response.text);
};

export const findProjectLeads = async (cidade: string): Promise<ProjectLead[]> => {
    const prompt = `Você é um assistente que alimenta a plataforma "EncontraPro" com novos projetos para marceneiros. Busque por novos projetos de marcenaria na cidade de "${cidade}". Retorne uma lista de 3 a 5 leads de projetos fictícios. Para cada um, forneça um id único, title, description, location (bairro, cidade) e um budget (orçamento) estimado em Reais. Retorne APENAS um array de objetos JSON.`;
    const response = await generateGroundedResponse(prompt, null);
    return cleanAndParseJson<ProjectLead[]>(response.text);
};

export async function suggestAlternativeStyles(projectDescription: string, currentStyle: string, base64Image: string): Promise<string[]> {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
    const imageData = base64Image.split(',')[1];

    const prompt = `Você é um designer de interiores de renome. Com base na descrição e na imagem de um projeto de marcenaria, sugira 3 nomes de estilos alternativos que também funcionariam bem. O estilo atual é "${currentStyle}". Não sugira o estilo atual. Seja criativo e específico (ex: "Minimalista Japandi", "Industrial Urbano", "Rústico Moderno").

**Descrição do Projeto:** ${projectDescription}

Retorne a resposta APENAS como um array JSON de strings. Exemplo: ["Estilo A", "Estilo B", "Estilo C"]`;
    
    const parts: Part[] = [
        { text: prompt },
        fileToGenerativePart(imageData, mimeType)
    ];

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
    });
    
    const response = await callApiWithRetry(apiCall);
    return cleanAndParseJson<string[]>(response.text);
}

export async function suggestImageEdits(projectDescription: string, base64Image: string): Promise<string[]> {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/png';
    const imageData = base64Image.split(',')[1];

    const prompt = `Você é um assistente de design criativo. Com base na descrição e na imagem de um móvel, sugira 3 edições curtas e diretas que poderiam ser feitas na imagem. Foque em mudanças de material, cor, adição de pequenos objetos decorativos ou alteração de iluminação.

**Descrição do Projeto:** ${projectDescription}

Retorne a resposta APENAS como um array JSON de strings. Exemplo: ["Adicione um vaso de plantas pequeno ao lado", "Mude o acabamento para laca preta brilhante", "Faça a iluminação ser mais dramática, como ao entardecer"]`;
    
    const parts: Part[] = [
        { text: prompt },
        fileToGenerativePart(imageData, mimeType)
    ];

    const apiCall = () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts },
    });
    
    const response = await callApiWithRetry(apiCall);
    return cleanAndParseJson<string[]>(response.text);
}