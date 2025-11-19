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
        { text: `Atue como um Desenhista CAD Sênior especializado em arquitetura.

**Tarefa:** Editar a planta baixa técnica (2D) fornecida, aplicando estritamente a seguinte instrução:
"${prompt}"

**Requisitos Críticos de Estilo (Invioláveis):**
1.  **Estilo CAD:** Mantenha estritamente o estilo de desenho técnico: linhas pretas nítidas e uniformes sobre fundo branco absoluto.
2.  **Consistência:** Preserve a espessura das paredes existentes e a escala visual.
3.  **Simbologia Arquitetônica:**
    *   **Janelas:** Devem ser representadas como linhas finas duplas ou triplas dentro da parede (simbologia padrão de planta baixa). NÃO desenhe vidro realista.
    *   **Portas:** Devem incluir o arco de abertura.
4.  **Orientação Espacial:** Em planta baixa 2D, "parede do fundo" ou "trás" refere-se à parte SUPERIOR do desenho (oposta à entrada/baixo).
5.  **Sem Arte:** NÃO adicione cores, sombreamento, texturas realistas ou elementos 3D. O resultado deve parecer um documento técnico vetorial impresso.
6.  **Limpeza:** O desenho deve ser limpo, sem ruído, borrões ou artefatos de compressão.` }
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
  
  const textPrompt = `
  Atue como um **Operador de Seccionadora Especialista**.
  
  Com base na Lista de Materiais (BOM) abaixo, gere um **Plano de Corte Industrial** para chapas de **${sheetWidth}x${sheetHeight}mm**.
  
  **BOM:**
  ${bom}

  **Requisitos:**
  1.  **Agrupamento:** Agrupe as peças por tipo de chapa (ex: MDF 15mm Branco, MDF 6mm Fundo).
  2.  **Lógica de Corte:** Liste as peças na ordem de corte ideal para uma seccionadora (cortes longitudinais primeiro, depois transversais).
  3.  **Resumo de Chapas:** Indique quantas chapas inteiras são necessárias para cada tipo.
  4.  **Sobras:** Estime se haverá sobras úteis (retalhos grandes).

  Formate a resposta em Markdown claro e técnico.
  `;

  const imagePrompt = `
  Crie um **Diagrama de Plano de Corte Técnico (Nesting)** 2D, estilo CAD, minimalista e de alto contraste (fundo branco, linhas pretas).
  
  **Input:** Uma chapa retangular de proporção aproximada ${sheetWidth}:${sheetHeight}.
  **Conteúdo:** Distribua retângulos menores (representando peças de móveis) dentro desta chapa de forma otimizada, minimizando espaços vazios.
  **Estilo:** Desenho vetorial técnico, sem texturas realistas. Adicione algumas cotas numéricas ilustrativas.
  `;

  const optimizationPrompt = `
  Como um **Especialista em Otimização de Corte (Nesting)**, analise a BOM abaixo e forneça 3 dicas avançadas para reduzir o desperdício e custos neste projeto específico.
  
  Considere:
  - Sentido do veio da madeira (Grain Direction).
  - Espessura da serra (Kerf) de 3mm.
  - Possibilidade de rotacionar peças internas (prateleiras/divisórias).

  BOM:
  ${bom}
  
  Responda em Markdown com bullets.
  `;

  const [text, image, optimization] = await Promise.all([
    generateText(textPrompt, null),
    generateImage(imagePrompt, null),
    generateText(optimizationPrompt, null),
  ]);

  return { text, image, optimization };
}

export async function estimateProjectCosts(project: ProjectHistoryItem): Promise<{ materialCost: number; laborCost: number }> {
    const prompt = `
    Atue como um Orçamentista Sênior de Marcenaria no Brasil.
    
    Sua tarefa é estimar com precisão os custos de **Material** e **Mão de Obra** para o projeto descrito abaixo.

    **Dados do Projeto:**
    - Descrição: "${project.description}"
    - Lista de Materiais (BOM): "${project.bom || 'Não fornecida (estime com base na descrição/imagem)'}"
    
    **Diretrizes de Precificação (Mercado Brasileiro):**
    1.  **Materiais:** Considere o preço atual de chapas de MDF (ex: Branco TX ~R$ 220, Madeirados ~R$ 350), ferragens (dobradiças, corrediças telescópicas), fitas de borda e insumos (cola, parafusos). Adicione 10% de margem de erro.
    2.  **Mão de Obra:** Estime as horas necessárias para: corte, fitagem, furação, pré-montagem e instalação. Use uma taxa base de R$ 80,00 a R$ 120,00 por hora técnica, dependendo da complexidade visualizada.
    
    **Saída Obrigatória:**
    Retorne APENAS um objeto JSON válido (sem Markdown, sem explicações) com este formato exato:
    {
      "materialCost": 1250.50,
      "laborCost": 800.00
    }
    `;
    
    const images = project.views3d.map(url => ({
        data: url.split(',')[1],
        mimeType: url.match(/data:(.*);/)?.[1] || 'image/png'
    }));

    const response = await generateText(prompt, images);
    
    return cleanAndParseJson<{ materialCost: number; laborCost: number }>(response);
}

export async function generateAssemblyDetails(project: ProjectHistoryItem): Promise<string> {
  const prompt = `
  Você é um Mestre Marceneiro com 30 anos de experiência e um redator técnico premiado. Sua tarefa é criar o **Guia de Montagem Definitivo** para o projeto de marcenaria descrito.
  
  **Dados do Projeto:**
  - **Descrição:** ${project.description}
  - **Materiais (BOM):** ${project.bom || "Não fornecida (Deduza os materiais com base nas práticas padrão de marcenaria para este tipo de móvel)"}

  Gere a resposta estritamente em **Markdown** bem formatado, seguindo esta estrutura exata:

  # 🛠️ Guia de Montagem Profissional: [Nome do Projeto]

  **⏱️ Tempo Estimado:** [Estimar horas de montagem] | **💪 Dificuldade:** [Fácil/Médio/Difícil]

  ## 1. 🛡️ Segurança e Preparação (Obrigatório)
  *   **EPIs:** Liste óculos, protetor auricular, luvas, etc.
  *   **Ambiente:** Dicas para proteger o piso e organizar o espaço.

  ## 2. 🧰 Lista de Ferramentas
  Divida em:
  *   **Medição e Marcação:** (Trena, esquadro, lápis...)
  *   **Furação e Fixação:** (Parafusadeira/Furadeira, brocas específicas - ex: 3mm guia, 35mm para dobradiça, bits Phillips/Torx)
  *   **Montagem e Ajuste:** (Martelo de borracha, nível, chaves manuais)

  ## 3. 🔩 Lista de Ferragens e Insumos (Estimativa)
  Liste detalhadamente (ex: Parafuso 4,0x40mm para caixa, 3,5x14mm para ferragens, cavilhas, cola PVA, Minifix/VB se aplicável, Dobradiças, Corrediças). Explique *onde* cada um é usado.

  ## 4. 🚀 Passo a Passo da Montagem (Lógica de Fabricação)
  Crie uma sequência lógica de montagem do "caixote" para fora.
  *   **Passo 1: Preparação das Peças:** Onde colocar cavilhas, onde fixar os calços das dobradiças e as corrediças *antes* de montar a caixa.
  *   **Passo 2: Estrutura Principal:** Ordem de fixação (Base, Laterais, Travessas/Teto). *Dica de Mestre: Como garantir o esquadro perfeito.*
  *   **Passo 3: O Fundo:** A importância do fundo para travar a estrutura.
  *   **Passo 4: Internos:** Instalação de prateleiras fixas e móveis.
  *   **Passo 5: Instalação no Local:** (Se for aéreo/suspenso ou fixação na parede).
  *   **Passo 6: Componentes Móveis:** Montagem das gavetas e fixação das portas.

  ## 5. 🔧 O Segredo do Acabamento: Regulagens
  *   **Dobradiças:** Explique os 3 parafusos de ajuste (Altura, Profundidade, Cobrimento/Lateral).
  *   **Gavetas:** Como nivelar frentes de gaveta.
  *   **Limpeza Final:** Remoção de marcas de lápis e cola.

  ## 6. ⚠️ Troubleshooting (Resolução de Problemas)
  *   *Problema:* "A porta não fecha direito." -> *Solução:* ...
  *   *Problema:* "O móvel está balançando." -> *Solução:* ...

  ---
  *Estilo:* Use negrito para destacar peças e medidas. Seja encorajador mas extremamente técnico e preciso. Use emojis para tornar a leitura agradável.
  `;
  
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