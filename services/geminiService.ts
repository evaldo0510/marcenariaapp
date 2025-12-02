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
    // Construct payload to match standard Gemini REST structure
    // Many proxies like GeminiGen accept the OpenAI format or Google format.
    // This implementation assumes a Google-compatible endpoint.
    
    const payload = {
        model,
        contents,
        ...config, // Spread config directly
        apiKey: getGeminiApiKey() // Pass key in body if required by specific proxy
    };

    // Se a URL do proxy não tiver a chave na query, adicionamos se for a do Google
    let url = USE_PROXY_AS_PRIMARY ? CUSTOM_PROXY_URL : 'https://api.geminigen.ai/uapi/v1/generate';
    
    console.log(`[Connection] Usando rota: ${USE_PROXY_AS_PRIMARY ? 'Proxy Primário' : 'Proxy Fallback'}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getGeminiApiKey()}` // Alguns proxies usam Bearer
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
    
    // 1. Se o usuário configurou para usar PROXY como padrão (comprou serviço)
    if (USE_PROXY_AS_PRIMARY) {
        try {
            return await callCustomProxy(params.model, params.contents, params.config);
        } catch (e: any) {
            console.error("Falha no Proxy Primário:", e);
            throw e; // Se o primário falhar, lança erro
        }
    }

    // 2. Fluxo Padrão (Tenta Google Oficial -> Falha -> Tenta Proxy de Emergência)
    const ai = getAiClient();
    
    try {
        console.log(`[v2.4] Generating content with model: ${params.model}`);
        return await retryOperation(() => ai.models.generateContent(params));
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.warn(`[v2.4] Direct API call failed:`, errorMsg);

        // Só tenta o fallback se for erro de conexão, região ou servidor
        // Erros de "API Key Inválida" geralmente não se resolvem com proxy gratuito
        if (errorMsg.includes('fetch') || errorMsg.includes('500') || errorMsg.includes('503') || errorMsg.includes('location')) {
            console.warn(`[v2.4] Attempting proxy fallback...`);
            try {
                return await callCustomProxy(params.model, params.contents, params.config);
            } catch (proxyError) {
                console.error("[v2.4] Proxy fallback also failed:", proxyError);
            }
        }
        // Throw the original error if fallback fails or wasn't attempted
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

// --- ARCVISION SPECIFIC FUNCTIONS ---

export async function detectEnvironments(imageBase64: { data: string, mimeType: string } | null): Promise<string[]> {
    const prompt = `
      ATUE COMO: Especialista em Leitura de Projetos Arquitetônicos e Plantas Baixas.
      
      TAREFA: Analise visualmente a imagem fornecida.
      1. Se for uma PLANTA BAIXA: Identifique todos os cômodos/ambientes escritos ou representados (ex: "Sala", "Cozinha", "Suíte 1", "Varanda").
      2. Se for uma FOTO: Identifique qual é o ambiente visível na imagem.
      
      FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
      { 
        "ambientes": ["Nome do Ambiente 1", "Nome do Ambiente 2"] 
      }
      
      IMPORTANTE: Retorne APENAS o JSON, sem markdown, explicações ou texto adicional.
    `;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
        parts.push(fileToGenerativePart(imageBase64.data, imageBase64.mimeType));
    }

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ambientes: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
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
      Você é um Mestre Marceneiro e Arquiteto de Interiores Sênior.
      
      TAREFA:
      Analise a imagem e o pedido: "${description}".
      
      CONTEXTO:
      - Ambientes: ${envsList}.
      - Nível de Projeto: ${levelInfo.label} (${levelInfo.desc}).
      
      DIRETRIZES DE ESTILO (CRÍTICO):
      
      1. Se "Minimalismo Moderno":
         - Crie móveis com Design Escandinavo/Industrial Leve.
         - NÃO PAREÇA BARATO. Use puxadores cava ou perfil slim.
         - Proporções elegantes.
      
      2. Se "Design Alto Padrão":
         - Luxo, LEDs, Ripados, Vidros Reflecta.
      
      3. MATERIAL ESPECÍFICO (OBRIGATÓRIO):
         - O cliente escolheu o material: "${collectionInfo.label}".
         - No prompt de render, descreva EXATAMENTE este material (ex: madeira tom ${collectionInfo.colors[0]}).
      
      IMPORTANTE:
      1. SEGUIR O LAYOUT DA PLANTA RIGOROSAMENTE.
      2. Ficha de corte realista.
      
      SAÍDA (JSON) com o seguinte schema:
      {
        "resumo_simples": "Resumo do projeto.",
        "ambientes": [
          {
            "nome": "Nome do Ambiente",
            "lista_corte": {
               "movel": "Nome do Móvel",
               "medidas_totais": "Ex: 2.60m (Alt) x 1.80m (Larg)",
               "material_corpo": "MDF Branco TX 15mm",
               "material_frente": "MDF CorEscolhida 18mm",
               "lista_ferragens": ["Ferragem 1", "Ferragem 2"],
               "obs_montagem": "Dica técnica."
            },
            "vistas": [
              { "titulo": "Vista Principal", "prompt_tecnico": "Photorealistic render..." },
              { "titulo": "Detalhe Funcional", "prompt_tecnico": "Close up render..." }
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
        config: {
            responseMimeType: 'application/json'
        }
    });

    if (response.text) {
        return cleanAndParseJson<any>(response.text);
    }
    throw new Error("Falha ao gerar projeto ArcVision.");
}

// --- GENERATE IMAGE FUNCTION (Gemini 2.5 Flash & Gemini 3 Pro) ---
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
    \n**DIRETRIZES OBRIGATÓRIAS DE CÂMERA E ENQUADRAMENTO (ANTI-CORTE):**
    `;

    if (framingStrategy) {
        technicalPrompt += `\n**COMANDO PRIORITÁRIO DE ENQUADRAMENTO:** "${framingStrategy}"\n`;
    }

    technicalPrompt += `
    1. **ZOOM OUT OBRIGATÓRIO:** Afaste a câmera virtual 20% a mais do que você acha necessário. O objeto deve "flutuar" no centro da imagem com espaço sobrando ao redor.
    2. **ZONA DE SEGURANÇA (SAFE AREA):** Mantenha uma margem vazia (padding) generosa em todas as 4 bordas (topo, base, esquerda, direita). NENHUMA parte do móvel (pés, puxadores, sancas) pode tocar a borda da imagem.
    3. **LENTE:** Use uma lente **Grande Angular (Wide Angle - 24mm)** para capturar todo o contexto sem distorcer demais.
    4. **COMPOSIÇÃO:** Centralize o objeto principal matematicamente.
    5. **RESPONSIVIDADE:** A imagem deve ser legível tanto em telas verticais quanto horizontais, por isso o espaço extra ao redor é vital.
    6. **VISUALIZAÇÃO VOLUMÉTRICA:** Salvo especificado em contrário, use uma perspectiva levemente rotacionada (3/4 view) para mostrar a profundidade e as laterais do móvel, não apenas a frente chapada.
    `;

    // --- BLOCO DE DECORAÇÃO INTELIGENTE ---
    if (decorationLevel !== 'minimal') {
        technicalPrompt += `
        \n**DIRETRIZES DE DECORAÇÃO INTELIGENTE (${decorationLevel.toUpperCase()}):**
        `;
        if (decorationLevel === 'standard') {
            technicalPrompt += `Adicione elementos de decoração equilibrados que combinem com o estilo do móvel. Inclua 2-3 itens como: plantas, quadros, ou objetos decorativos nas prateleiras.`;
        } else if (decorationLevel === 'rich') {
            technicalPrompt += `Crie uma cena totalmente ambientada e decorada ("Lived-in Look"). Adicione tapetes texturizados, iluminação decorativa (abajures, pendentes), livros, plantas volumosas, quadros na parede e objetos de design sobre o móvel. A cena deve parecer pronta para uma revista de arquitetura.`;
        }
    } else {
        technicalPrompt += `\n**DIRETRIZES DE DECORAÇÃO:** Mantenha a cena limpa (Clean). Foco total no móvel, sem objetos decorativos que distraiam.`;
    }

    if (referenceImages && referenceImages.length > 0) {
        technicalPrompt += `
        \n**PROTOCOLO DE ANÁLISE DE IMAGEM (GEMINI VISION):**
        Você recebeu uma imagem de referência (Planta Baixa ou Foto do Local). ANTES DE RENDERIZAR, execute os passos:
        1. **EXTRAÇÃO DE GEOMETRIA:** Analise as linhas de parede, posição de portas e janelas na imagem. Use isso como o "esqueleto" da cena 3D.
        2. **ESTIMATIVA DE ESCALA:** Use elementos padrão (portas = 80cm, pé-direito = 2.60m) para inferir as dimensões do ambiente.
        3. **DISTRIBUIÇÃO DE MÓVEIS:** Se for uma planta baixa, levante as paredes e coloque os móveis solicitados exatamente onde o desenho sugere.
        
        ${isMirrored ? 
        `**⚠️ ALERTA DE ESPELHAMENTO (PLANTA INVERTIDA) ⚠️**
        O usuário indicou que esta é uma planta invertida (tipo apartamento espelhado).
        VOCÊ DEVE INVERTER A LÓGICA ESPACIAL HORIZONTALMENTE:
        - Se na imagem a parede do armário está à direita, no render 3D coloque-a à ESQUERDA.
        - Se a janela está na esquerda, mova-a para a DIREITA.
        - Mantenha as dimensões e estilo, apenas espelhe a posição dos elementos.` 
        : ''}

        4. **ESTILO ARQUITETÔNICO:** Identifique pistas visuais de estilo na imagem e aplique no render final.
        
        **IMPORTANTE:** Use a imagem para definir a FORMA/ESPAÇO (considerando o espelhamento se solicitado), e o texto para definir os MATERIAIS/ACABAMENTOS.
        `;
    }

    technicalPrompt += `
    \n**DIRETRIZES VISUAIS (Fotorrealismo):**
    1. **Materiais:** Texturas de alta definição. Madeira com veios naturais. Lacas com reflexo correto.
    2. **Iluminação:** Iluminação Global (GI) suave. Sombras de contato (Ambient Occlusion) para "aterrar" o móvel no chão.
    3. **Estilo:** Renderização limpa, comercial, pronta para catálogo.
    4. **Qualidade:** 4K, nítida, sem distorções.
    `;

    if (useProModel) {
        technicalPrompt += `
        \n**💎 MODO PRO ATIVADO (Hiper-Realismo):**
        - **Renderização:** Utilize técnicas de Path Tracing para simular fisicamente a luz.
        - **Materiais PBR:** As superfícies devem interagir com a luz de forma complexa (rugosidade, especularidade, normal maps).
        - **Fotografia:** Simule uma lente de câmera profissional (85mm para retratos de móveis ou 24mm para ambientes). Adicione profundidade de campo sutil (Bokeh) se apropriado.
        - **Atmosfera:** A imagem deve ser indistinguível de uma fotografia real de revista de design (Architectural Digest).
        `;
    }

    const parts: any[] = [{ text: technicalPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
             parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    try {
        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        if (useProModel) {
            config.imageConfig = {
                imageSize: imageResolution
            };
        }

        const response = await generateContentSafe({
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

// Function to describe an image for a 3D project prompt
export async function describeImageFor3D(base64Data: string, mimeType: string): Promise<string> {
    const prompt = `Descreva detalhadamente este móvel da foto para um projeto 3D: destaque o tipo de móvel, as dimensões aproximadas, materiais, estilo, quantidade de portas/gavetas/nichos e qualquer característica visual que se destaca. Formule como um prompt de geração de projeto.`;

    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                fileToGenerativePart(base64Data, mimeType),
                { text: prompt }
            ]
        }
    });

    return response.text || "Não foi possível descrever a imagem.";
}

export async function enhancePrompt(originalText: string): Promise<string> {
    const prompt = `
    Atue como um Mestre Marceneiro e Designer de Interiores Sênior.
    
    TAREFA:
    Reescreva a seguinte solicitação informal de um cliente/marceneiro em um PROMPT TÉCNICO DETALHADO para geração de imagem 3D e plano de corte.
    
    ENTRADA ORIGINAL:
    "${originalText}"
    
    REGRAS DE ENGENHARIA DE PROMPT (MANDATÓRIO):
    1. **Vocabulário Técnico:** Substitua termos leigos por técnicos (ex: "madeira" -> "MDF Louro Freijó", "armário" -> "Módulo com tamponamento").
    2. **Especificações de Material (Espessuras):** Defina espessuras padrão de mercado (ex: "Caixaria em MDF 15mm Branco TX", "Frentes em MDF 18mm", "Tamponamento/Engrosso de 25mm ou 30mm").
    3. **Iluminação LED:** Especifique o tipo e temperatura (ex: "Perfil de LED 4000K (Neutro) embutido em sanca", "Fita LED COB nos nichos", "Spots dicróicos").
    4. **Ferragens:** Mencione acabamentos e mecanismos (ex: "Puxadores perfil gola alumínio anodizado", "Dobradiças com amortecimento (slow-motion)", "Corrediças telescópicas ou invisíveis").
    5. **Acabamento:** Cite texturas específicas (ex: "Laca fosca", "Vidro Reflecta Bronze", "Pedra Sintética Calacatta").
    
    O texto final deve parecer escrito por um arquiteto experiente detalhando o projeto para a fábrica, pronto para ser renderizado.
    
    Retorne APENAS o texto reescrito, sem introduções ou aspas.
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

    const prompt = `Analise esta imagem de ambiente ou planta baixa como um Arquiteto Sênior.
    
    TAREFAS:
    1. Identifique o tipo de ambiente (Cozinha, Quarto, Sala, Banheiro, Escritório).
    2. Estime as dimensões (Largura, Profundidade, Altura) baseando-se em padrões arquitetônicos (portas 80cm, janelas 120cm).
    3. Liste os elementos estruturais (paredes, portas, janelas).
    4. **ANÁLISE DE FLUXO:** Identifique mentalmente onde seria o local IDEAL para móveis planejados neste layout.
    
    Retorne JSON: { roomType: string, confidence: string, dimensions: { width: number, depth: number, height: number }, detectedObjects: string[] }`;

    const response = await generateContentSafe({
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
    let prompt = `Para um ambiente do tipo "${roomType}" com dimensões ${dimensions.width}m x ${dimensions.depth}m.`;
    
    if (userIntent) {
        prompt += `\nCONTEXTO DO USUÁRIO: "${userIntent}".\nIMPORTANTE: Gere sugestões que cubram TODOS os ambientes ou móveis solicitados na descrição acima.`;
    } else {
        prompt += `\nSugira 3 layouts de móveis planejados eficientes.`;
    }

    prompt += `\nRetorne JSON Array: [{ title, description, pros }]`;

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

    if (response.text) {
        return cleanAndParseJson(response.text);
    }
    return [];
}

export async function generateDecorationList(projectDescription: string, style: string): Promise<{ item: string, category: string, estimatedPrice: string, suggestion: string }[]> {
    const prompt = `Atue como um Designer de Interiores.
    Baseado neste projeto: "${projectDescription}"
    Estilo: "${style}"
    
    Sugira 5 a 7 itens de decoração REAIS que completariam este ambiente (ex: tapetes, luminárias, vasos, quadros).
    Para cada item, dê uma estimativa de preço em Reais (R$) e uma breve sugestão de onde usar.
    
    Retorne APENAS um JSON Array com objetos: { item, category, estimatedPrice, suggestion }`;

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

    const response = await generateContentSafe({
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
    const prompt = `Atue como um Especialista em Materiais de Marcenaria.
    Projeto: "${projectDescription}"
    Estilo: "${style}"
    
    Sugira 3 acabamentos REAIS e populares (Madeira, Laca, Metal) que combinem.
    Priorize padrões de MDF comuns no mercado (Duratex, Arauco, Guararapes).
    
    Retorne JSON array com objetos Finish.
    Type deve ser um de: 'wood', 'solid', 'metal', 'stone', 'glass'.`;

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

    if (response.text) {
        return cleanAndParseJson<Finish[]>(response.text);
    }
    return [];
}

export async function searchFinishes(query: string): Promise<Finish[]> {
    const prompt = `Sugira 4 acabamentos de marcenaria reais (MDF, pedras, metais) para: "${query}".
    Retorne JSON array.`;

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

    if (response.text) {
        return cleanAndParseJson<Finish[]>(response.text);
    }
    return [];
}

export async function editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    // Adicionando reforço de enquadramento também na edição
    const enhancedPrompt = `${prompt}
    
    **REGRA CRÍTICA DE MANUTENÇÃO DE ENQUADRAMENTO:**
    Ao editar, NÃO dê zoom in. Mantenha o enquadramento original ou afaste a câmera (Zoom Out) se necessário para mostrar o objeto inteiro. Mantenha margens de segurança nas bordas.`;

    const response = await generateContentSafe({
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
}

export async function suggestImageEdits(projectDescription: string, imageSrc: string): Promise<string[]> {
    const base64Data = imageSrc.split(',')[1];
    const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';

    const prompt = `Analise esta imagem de projeto. Sugira 4 edições visuais (ex: mudar cor, adicionar luz). Retorne JSON array de strings.`;

    const response = await generateContentSafe({
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
    const tools: any[] = [{ googleSearch: {} }];
    
    const response = await generateContentSafe({
        model: 'gemini-3-pro-preview', 
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

export async function findLocalSuppliers(location: { latitude: number, longitude: number }): Promise<any[]> {
    const prompt = `Encontre madeireiras e fornecedores de MDF próximos a esta localização (Lat: ${location.latitude}, Long: ${location.longitude}). Liste nome, endereço e se possível website.`;
    
    const response = await generateContentSafe({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const suppliers = groundingChunks
        .filter((chunk: any) => chunk.maps) 
        .map((chunk: any) => ({
            title: chunk.maps.title,
            uri: chunk.maps.uri,
        }));

    return suppliers;
}

export async function editFloorPlan(base64Data: string, mimeType: string, prompt: string): Promise<string> {
    const technicalPrompt = `
    ATUE COMO: Um software CAD (AutoCAD) em modo de exportação.
    TAREFA: Editar esta planta baixa mantendo o rigoroso padrão de desenho técnico.
    
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

    const response = await generateContentSafe({
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
    const parts: any[] = [{ text: prompt }];
    if (images) {
        images.forEach(img => {
            parts.push(fileToGenerativePart(img.data, img.mimeType));
        });
    }

    const response = await generateContentSafe({
        model: 'gemini-3-pro-preview',
        contents: { parts }
    });

    return response.text || "Não foi possível gerar o texto.";
}

export async function generateCuttingPlan(project: ProjectHistoryItem, sheetWidth: number, sheetHeight: number): Promise<{ text: string, image: string, optimization: string }> {
    // 1. Texto e Otimização
    const textPrompt = `Gere um plano de corte otimizado para chapas de ${sheetWidth}x${sheetHeight}mm.
    Projeto: ${project.name}
    BOM/Descrição: ${project.bom || project.description}
    
    Forneça:
    1. Lista de cortes detalhada.
    2. Dicas de otimização (nesting) para economizar chapas.`;

    const textResponse = await generateContentSafe({
        model: 'gemini-3-pro-preview',
        contents: textPrompt
    });
    
    const textPlan = textResponse.text || "Plano não gerado.";

    // 2. Imagem do Diagrama
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
    
    if (project.views3d && project.views3d.length > 0) {
         const imageSrc = project.views3d[0];
         const mimeType = imageSrc.match(/data:(.*);/)?.[1] || 'image/png';
         const data = imageSrc.split(',')[1];
         imgParts.push(fileToGenerativePart(data, mimeType));
    }

    let imageBase64 = "";
    try {
        const imgResponse = await generateContentSafe({
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
    const prompt = `Gere 3 leads fictícios de marcenaria em ${city}. JSON Array.`;
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
    const prompt = `Extraia itens da BOM para JSON Array [{item, qty, dimensions}]. BOM: ${bomText}`;
    const response = await generateContentSafe({
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
