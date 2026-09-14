-- Rede social: identidade pública nome#tag, amizades e grupos.

-- Tag de 4 dígitos no estilo Discord. Única dentro do mesmo nome, não globalmente.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tag CHAR(4);

DO $$
DECLARE u RECORD; nova TEXT;
BEGIN
  FOR u IN SELECT id, nome FROM users WHERE tag IS NULL LOOP
    LOOP
      nova := lpad(floor(random() * 10000)::int::text, 4, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM users WHERE lower(nome) = lower(u.nome) AND tag = nova
      );
    END LOOP;
    UPDATE users SET tag = nova WHERE id = u.id;
  END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN tag SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nome_tag ON users (lower(nome), tag);

DO $$ BEGIN
  CREATE TYPE status_amizade AS ENUM ('pendente', 'aceita');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Um pedido aceito vira a própria amizade (status muda para 'aceita'). Recusar apaga
-- a linha, para que a pessoa possa mandar outro pedido depois.
CREATE TABLE IF NOT EXISTS amizades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          status_amizade NOT NULL DEFAULT 'pendente',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondido_em   TIMESTAMPTZ,
  CONSTRAINT amizade_nao_reflexiva CHECK (solicitante_id <> destinatario_id),
  UNIQUE (solicitante_id, destinatario_id)
);

CREATE INDEX IF NOT EXISTS idx_amizades_destinatario ON amizades (destinatario_id, status);
CREATE INDEX IF NOT EXISTS idx_amizades_solicitante ON amizades (solicitante_id, status);

CREATE TABLE IF NOT EXISTS grupos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT NOT NULL,
  codigo_convite TEXT NOT NULL UNIQUE,
  criador_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grupo_membros (
  grupo_id  UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entrou_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_grupo_membros_user ON grupo_membros (user_id);
