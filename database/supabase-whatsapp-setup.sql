-- Script SQL para criar as tabelas necessárias para a integração WhatsApp + Iara
-- Execute este script no SQL Editor do Supabase

-- Tabela para armazenar configurações do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verify_token TEXT NOT NULL,
  whatsapp_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  gemini_api_key TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  from_number TEXT,
  to_number TEXT,
  message_text TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração inicial (MODIFIQUE OS VALORES ANTES DE EXECUTAR)
INSERT INTO whatsapp_config (
  verify_token,
  whatsapp_token,
  phone_number_id,
  gemini_api_key,
  ativo
) VALUES (
  'marcenapp_iara_webhook_2026_secure_token',  -- Token de verificação
  'SEU_WHATSAPP_TOKEN_AQUI',                    -- Token do WhatsApp Business
  'SEU_PHONE_NUMBER_ID_AQUI',                   -- ID do número de telefone
  'SUA_GEMINI_API_KEY_AQUI',                    -- Chave da API do Google Gemini
  true
);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajuste conforme necessário)
-- Permitir leitura apenas para usuários autenticados
CREATE POLICY "Permitir leitura de config para autenticados" 
  ON whatsapp_config FOR SELECT 
  TO authenticated 
  USING (true);

-- Permitir leitura de mensagens para autenticados
CREATE POLICY "Permitir leitura de mensagens para autenticados" 
  ON whatsapp_messages FOR SELECT 
  TO authenticated 
  USING (true);

-- Permitir inserção de mensagens (para o webhook)
CREATE POLICY "Permitir inserção de mensagens" 
  ON whatsapp_messages FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Comentários nas tabelas
COMMENT ON TABLE whatsapp_config IS 'Armazena configurações do WhatsApp Business API e Gemini';
COMMENT ON TABLE whatsapp_messages IS 'Armazena histórico de mensagens enviadas e recebidas via WhatsApp';
