CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE objetivo AS ENUM ('perder_peso', 'manter', 'ganhar_massa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sexo AS ENUM ('M', 'F');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_entrada AS ENUM ('foto', 'audio', 'texto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refeicao AS ENUM ('cafe_da_manha', 'almoco', 'lanche', 'janta', 'ceia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  nome               TEXT NOT NULL,
  sexo               sexo,
  idade              INT,
  peso_kg            NUMERIC(6,2),
  altura_cm          NUMERIC(6,2),
  objetivo           objetivo NOT NULL DEFAULT 'manter',
  meta_calorias      INT NOT NULL DEFAULT 2000,
  meta_carboidrato_g NUMERIC(7,2) NOT NULL DEFAULT 250,
  meta_proteina_g    NUMERIC(7,2) NOT NULL DEFAULT 120,
  meta_gordura_g     NUMERIC(7,2) NOT NULL DEFAULT 60,
  meta_agua_ml       INT NOT NULL DEFAULT 2500,
  metas_automaticas  BOOLEAN NOT NULL DEFAULT TRUE,
  modo_preguicoso    BOOLEAN NOT NULL DEFAULT FALSE,
  faixas_refeicao    JSONB NOT NULL DEFAULT '[
    {"refeicao":"cafe_da_manha","inicio":"05:00","fim":"10:00"},
    {"refeicao":"almoco","inicio":"10:01","fim":"15:00"},
    {"refeicao":"lanche","inicio":"15:01","fim":"18:00"},
    {"refeicao":"janta","inicio":"18:01","fim":"22:00"},
    {"refeicao":"ceia","inicio":"22:01","fim":"04:59"}
  ]'::jsonb,
  timezone           TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registros_alimentares (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo_entrada         tipo_entrada NOT NULL,
  refeicao             refeicao NOT NULL,
  descricao_bruta      TEXT NOT NULL DEFAULT '',
  midia_url            TEXT,
  alimentos_detectados JSONB NOT NULL DEFAULT '[]'::jsonb,
  calorias_total       NUMERIC(8,2) NOT NULL DEFAULT 0,
  carboidrato_total_g  NUMERIC(8,2) NOT NULL DEFAULT 0,
  proteina_total_g     NUMERIC(8,2) NOT NULL DEFAULT 0,
  gordura_total_g      NUMERIC(8,2) NOT NULL DEFAULT 0,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registros_user_data
  ON registros_alimentares (user_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS registros_agua (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantidade_ml INT NOT NULL CHECK (quantidade_ml > 0),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agua_user_data
  ON registros_agua (user_id, criado_em DESC);
