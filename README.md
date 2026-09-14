# dieta-preguicoso

Controle de dieta sem fricção. Você fotografa o prato, fala o que comeu ou digita — a IA
interpreta, decide sozinha em qual refeição aquilo entra (pelo horário) e o app mostra
quanto falta ou quanto passou da meta do dia.

Uso pessoal, feito para rodar numa VPS própria.

## O que ele faz

- **Três entradas, um pipeline.** Foto → visão da OpenAI. Áudio → Whisper → chat. Texto → chat.
  Todas terminam na mesma lista de alimentos com calorias e macros estimados.
- **Nunca pergunta qual refeição é.** Classifica por faixa de horário (configurável) no fuso
  do usuário. Dá para corrigir depois, mas nunca é obrigatório antes.
- **Resumo honesto.** Mostra o que falta e, quando você estoura a meta, mostra o excesso
  separado em vez de zerar e fingir que está tudo certo.
- **Modo preguiçoso total.** Ligado no perfil, pula a tela de confirmação e grava direto.
- **Água, faixa semanal, metas automáticas** por Mifflin-St Jeor a partir de peso/altura/idade.
- **Rede social enxuta.** Cada pessoa tem um `nome#0000` estilo Discord; você adiciona amigos
  por essa tag e cria grupos com código de convite. Toda refeição registrada já vira um post
  no feed de quem te acompanha, e o perfil de cada um mostra o dia, o calendário do mês
  (verde = dentro de ±10% da meta) e as refeições.

## Stack

TypeScript de ponta a ponta. React 19 + Vite no front (CSS puro, tema escuro, zero
framework de UI). Express 5 + PostgreSQL 16 com SQL puro no back. Docker Compose para subir.

## Rodar local

Precisa de um Postgres na mão e de uma `OPENAI_API_KEY`.

```bash
cp .env.example .env    # preencha DATABASE_URL, JWT_SECRET, OPENAI_API_KEY

cd backend && npm install && npm run migrate && npm run dev   # :3001
cd frontend && npm install && npm run dev                     # :5173, com proxy para :3001
```

## Rodar com Docker

```bash
cp .env.example .env    # preencha POSTGRES_PASSWORD, JWT_SECRET, OPENAI_API_KEY
docker compose up -d --build
```

Abre em `http://localhost:8080`. Só essa porta é exposta — banco e API ficam na rede interna.

## Verificação

```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run build
```

## Documentos

| Arquivo | Para quê |
|---|---|
| [`docs/api-contract.md`](docs/api-contract.md) | Endpoints, tipos e regras de cálculo — fonte da verdade |
| [`docs/design.md`](docs/design.md) | Tokens visuais e layout das telas |
| [`docs/deploy.md`](docs/deploy.md) | Subir na VPS, firewall, backup e restauração |
| [`CLAUDE.md`](CLAUDE.md) | Convenções do repo e comandos canônicos |

## Aviso

As estimativas nutricionais vêm de um modelo de linguagem olhando uma foto ou lendo uma
frase. Servem para acompanhar tendência, não para prescrição. A tela de confirmação existe
porque a IA erra porção com frequência.
