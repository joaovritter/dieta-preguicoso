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
-- Um valor de `refeicao` fora do esperado vira NULL de propósito — `nome NOT NULL`
-- aborta a migration em vez de relabelar em silêncio como Ceia.
INSERT INTO refeicoes_usuario (user_id, nome, inicio, fim)
SELECT u.id,
       CASE f.refeicao
         WHEN 'cafe_da_manha' THEN 'Café da manhã'
         WHEN 'almoco'        THEN 'Almoço'
         WHEN 'lanche'        THEN 'Lanche'
         WHEN 'janta'         THEN 'Janta'
         WHEN 'ceia'          THEN 'Ceia'
         ELSE                      NULL
       END,
       f.inicio,
       f.fim
FROM users u
CROSS JOIN LATERAL jsonb_to_recordset(u.faixas_refeicao)
  AS f(refeicao text, inicio text, fim text);

-- Trava de segurança: `faixas_refeicao` vazio (ou só com valores fora do esperado)
-- deixaria a pessoa com zero refeições e conta inutilizável. Mesmo formato da
-- trava de órfãos logo abaixo — a transação inteira volta, nada é perdido.
DO $$
DECLARE sem_refeicao INT;
BEGIN
  SELECT count(*) INTO sem_refeicao
  FROM users u
  WHERE NOT EXISTS (SELECT 1 FROM refeicoes_usuario ru WHERE ru.user_id = u.id);
  IF sem_refeicao > 0 THEN
    RAISE EXCEPTION 'migration 003: % usuário(s) sem nenhuma refeição', sem_refeicao;
  END IF;
END $$;

ALTER TABLE registros_alimentares ADD COLUMN refeicao_id UUID;

-- Mesmo catch-all removido aqui: um `r.refeicao` fora do esperado vira NULL dentro
-- do lower(...), a comparação nunca casa, e a trava de órfãos logo abaixo pega isso.
UPDATE registros_alimentares r
SET refeicao_id = ru.id
FROM refeicoes_usuario ru
WHERE ru.user_id = r.user_id
  AND lower(ru.nome) = lower(CASE r.refeicao
        WHEN 'cafe_da_manha' THEN 'Café da manhã'
        WHEN 'almoco'        THEN 'Almoço'
        WHEN 'lanche'        THEN 'Lanche'
        WHEN 'janta'         THEN 'Janta'
        WHEN 'ceia'          THEN 'Ceia'
        ELSE                      NULL
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
