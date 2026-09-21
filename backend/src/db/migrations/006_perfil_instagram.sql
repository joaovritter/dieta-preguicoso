-- Perfil estilo Instagram: foto de perfil (opcional) e opção de esconder a aba de comentários.
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS esconder_comentarios_perfil BOOLEAN NOT NULL DEFAULT false;
