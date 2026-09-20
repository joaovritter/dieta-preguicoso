-- Conta não é apagada: fica desativada. NULL = ativa. Só o administrador volta para NULL.
ALTER TABLE users ADD COLUMN IF NOT EXISTS desativada_em TIMESTAMPTZ;
