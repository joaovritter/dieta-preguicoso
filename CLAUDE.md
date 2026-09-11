# dieta-preguicoso

App pessoal de controle de dieta. O usuário registra o que comeu por foto, áudio ou texto;
a IA interpreta, classifica a refeição pelo horário e o app mostra o resumo do dia.
Uso pessoal, rodando numa VPS Contabo sem domínio.

## Behavioral guidelines

1. **Pensar antes de codar** — declare suposições. Havendo várias leituras, apresente-as
   em vez de escolher em silêncio. Se algo estiver genuinamente ambíguo, pergunte.
2. **Simplicidade primeiro** — o mínimo de código que resolve. Sem features especulativas,
   sem abstração para uso único, sem tratar cenário impossível.
3. **Mudança cirúrgica** — mexa só no que o pedido exige. Siga o estilo existente.
4. **Execução verificável** — cada passo com um check ("rodar o teste X", "buildar").
5. **Orquestrador, não implementador** — a sessão principal planeja e coordena; trabalho
   delegável vai para subagente, em paralelo quando os escopos de arquivo são disjuntos.

## Stack

TypeScript · React 19 + Vite (SPA) · Express 5 + `pg` (PostgreSQL 16) · Vitest ·
Docker Compose · OpenAI API (visão, chat, Whisper) · npm

## Comandos canônicos

Backend (`backend/`):
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Test: `npm test`
- Migrations: `npm run migrate`

Frontend (`frontend/`):
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`

Stack completa: `docker compose up -d --build`

## Documentos de referência

- [`docs/api-contract.md`](docs/api-contract.md) — **fonte da verdade** dos endpoints,
  tipos e regras de cálculo. Backend e frontend seguem esse arquivo; divergência é bug.
- [`docs/design.md`](docs/design.md) — tokens e layout do frontend.
- [`docs/deploy.md`](docs/deploy.md) — subir na VPS, backup, restauração.

## Convenções

- Domínio em português (`refeicao`, `alimentos_detectados`, `meta_calorias`); termos
  técnicos em inglês. Colunas do banco em snake_case, campos de API idem.
- SQL puro em `backend/src/db/`, sem ORM. Migrations numeradas e imutáveis depois de aplicadas.
- Toda entrada de rota é validada com Zod antes de tocar no banco.
- Erros de domínio via `AppError(code, message, status)`; o middleware de erro serializa
  no formato do contrato. Nunca vaze stack trace na resposta.
- Chamadas à OpenAI ficam isoladas em `backend/src/ai/`; o resto do código nunca importa
  o SDK direto — isso mantém as rotas testáveis sem rede.
- Testes com Vitest, focados em cálculo (resumo, metas, detecção de refeição) e parsing
  da resposta da IA. Sem teste que dependa de rede.

## Tabela de roteamento de especialistas

| Agente | Quando usar |
|---|---|
| `backend-specialist` | Endpoints, persistência, pipeline de IA |
| `frontend-specialist` | Telas, componentes, estado do cliente |
| `test-engineer` | Testes de cálculo e parsing |
| `code-reviewer` | Depois de editar qualquer arquivo de origem |
| `security-reviewer` | Antes de merge que toque auth, upload ou segredos |
