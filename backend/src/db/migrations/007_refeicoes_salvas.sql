-- Refeições salvas: cópia privada (nome, alimentos, totais) de um registro do usuário ou de um post visível de outra pessoa.
-- `origem_registro_id` é só informativo (sem FK): a cópia sobrevive se o registro original for apagado.
CREATE TABLE IF NOT EXISTS refeicoes_salvas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL,
  alimentos           JSONB NOT NULL,
  calorias_total      NUMERIC NOT NULL,
  carboidrato_total_g NUMERIC NOT NULL,
  proteina_total_g    NUMERIC NOT NULL,
  gordura_total_g     NUMERIC NOT NULL,
  origem_registro_id  UUID,
  origem_autor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  origem_autor_nome   TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refeicoes_salvas_user_criado
  ON refeicoes_salvas (user_id, criado_em DESC);
