import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../services/supabaseClient';

// Função para buscar configurações do Supabase
async function getWhatsAppConfig() {
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('ativo', true)
    .single();

  if (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }

  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Webhook recebido:', req.method, req.query, req.body);

  // Buscar configurações do banco
  const config = await getWhatsAppConfig();
  
  if (!config) {
    console.error('Configurações do WhatsApp não encontradas');
    return res.status(500).json({ error: 'Configurações não encontradas' });
  }

  // Verificação do webhook (GET request do Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.verify_token) {
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

          // Salvar mensagem no banco de dados
          await supabase.from('whatsapp_messages').insert({
            message_id: messageId,
            from_number: from,
            message_text: messageText,
            received_at: new Date().toISOString(),
            status: 'received'
          });

          // Processa a mensagem com a Iara (Google AI Studio)
          if (messageText) {
            const genAI = new GoogleGenerativeAI(config.gemini_api_key);
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

            // Enviar resposta de volta para o WhatsApp
            await sendWhatsAppMessage(from, iaraResponse, config);

            // Salvar resposta no banco
            await supabase.from('whatsapp_messages').insert({
              message_id: `sent_${Date.now()}`,
              from_number: 'marcenapp',
              to_number: from,
              message_text: iaraResponse,
              sent_at: new Date().toISOString(),
              status: 'sent'
            });
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
async function sendWhatsAppMessage(to: string, message: string, config: any) {
  if (!config.whatsapp_token || !config.phone_number_id) {
    console.error('Token ou Phone ID do WhatsApp não configurados');
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${config.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp_token}`,
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
