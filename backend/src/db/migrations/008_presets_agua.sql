-- Botões rápidos de água (+200ml, +300ml, +500ml) passam a morar na conta, não no aparelho.
ALTER TABLE users ADD COLUMN IF NOT EXISTS presets_agua_ml INT[] NOT NULL DEFAULT '{200,300,500}';
