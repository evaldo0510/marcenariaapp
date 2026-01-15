import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Token de verificação para o webhook
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'seu_token_secreto_aqui';

// Inicializa o Google AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Webhook recebido:', req.method, req.query, req.body);

  // Verificação do webhook (GET request do Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    } else {
      console.error('Falha na verificação do webhook');
      return res.status(403).send('Token de verificação inválido');
    }
  }

  // Processar mensagens (POST request do WhatsApp)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Verifica se há entradas de mensagem
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const message = messages[0];
          const from = message.from; // Número do remetente
          const messageText = message.text?.body;
          const messageId = message.id;

          console.log('Mensagem recebida de:', from);
          console.log('Texto:', messageText);

          // Processa a mensagem com a Iara (Google AI Studio)
          if (messageText) {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            
            // Contexto da Iara para MarcenApp
            const prompt = `Você é a Iara, assistente virtual do MarcenApp. 
O MarcenApp transforma fotos de rascunhos em projetos 3D fotorrealistas para marceneiros.
Responda à seguinte mensagem de um cliente de forma amigável e profissional:

"${messageText}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const iaraResponse = response.text();

            console.log('Resposta da Iara:', iaraResponse);

            // Aqui você enviaria a resposta de volta para o WhatsApp
            // usando a API do WhatsApp Business
            await sendWhatsAppMessage(from, iaraResponse);
          }
        }
      }

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return res.status(500).json({ error: 'Erro ao processar mensagem' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

// Função para enviar mensagem via WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('Token ou Phone ID do WhatsApp não configurados');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const data = await response.json();
    console.log('Mensagem enviada com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}
