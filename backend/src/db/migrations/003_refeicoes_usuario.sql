-- Refeições deixam de ser cinco valores fixos e passam a ser um conjunto por pessoa.
CREATE TABLE IF NOT EXISTS refeicoes_usuario (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  inicio    CHAR(5) NOT NULL,
  fim       CHAR(5) NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refeicoes_usuario_nome
  ON refeicoes_usuario (user_id, lower(nome));
CREATE INDEX IF NOT EXISTS idx_refeicoes_usuario_user
  ON refeicoes_usuario (user_id, inicio);

-- Semeia a partir das faixas que cada pessoa já tinha: quem customizou mantém.
INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim)
SELECT u.id,
       CASE f.refeicao
         WHEN 'cafe_da_manha' THEN 'Café da manhã'
         WHEN 'almoco'        THEN 'Almoço'
         WHEN 'lanche'        THEN 'Lanche'
         WHEN 'janta'         THEN 'Janta'
         ELSE                      'Ceia'
       END,
       f.inicio,
       f.fim
FROM users u
CROSS JOIN LATERAL jsonb_to_recordset(u.faixas_refeicao)
  AS f(refeicao text, inicio text, fim text);

ALTER TABLE registros_alimentares ADD COLUMN refeicao_id UUID;

UPDATE registros_alimentares r
SET refeicao_id = ru.id
FROM refeicoes_usuario ru
WHERE ru.user_id = r.user_id
  AND lower(ru.nome) = lower(CASE r.refeicao
        WHEN 'cafe_da_manha' THEN 'Café da manhã'
        WHEN 'almoco'        THEN 'Almoço'
        WHEN 'lanche'        THEN 'Lanche'
        WHEN 'janta'         THEN 'Janta'
        ELSE                      'Ceia'
      END);

-- Trava de segurança: se sobrou registro sem refeição, a transação inteira volta
-- e nada é perdido. É o que separa migration de acidente.
DO $$
DECLARE orfaos INT;
BEGIN
  SELECT count(*) INTO orfaos FROM registros_alimentares WHERE refeicao_id IS NULL;
  IF orfaos > 0 THEN
    RAISE EXCEPTION 'migration 003: % registro(s) sem refeicao_id', orfaos;
  END IF;
END $$;

ALTER TABLE registros_alimentares
  ALTER COLUMN refeicao_id SET NOT NULL,
  ADD CONSTRAINT registros_refeicao_fk
    FOREIGN KEY (refeicao_id) REFERENCES refeicoes_usuario(id) ON DELETE RESTRICT,
  DROP COLUMN refeicao;

CREATE INDEX IF NOT EXISTS idx_registros_refeicao ON registros_alimentares (refeicao_id);

ALTER TABLE users DROP COLUMN faixas_refeicao;
DROP TYPE IF EXISTS refeicao;
