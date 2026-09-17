-- Interações no feed: curtir e comentar a refeição de quem você acompanha.
-- Apagar o registro ou a conta leva junto as interações (CASCADE).
CREATE TABLE IF NOT EXISTS curtidas (
  registro_id UUID NOT NULL REFERENCES registros_alimentares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (registro_id, user_id)
);

CREATE TABLE IF NOT EXISTS comentarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES registros_alimentares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 500),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_registro ON comentarios (registro_id, criado_em);
