# Plano J — Água: histórico de registros e valor personalizado

> **Modelo:** cada tarefa é implementada por subagente **Sonnet**; a sessão coordena e revisa.

**Goal:** O modo "editar" do `CardAgua` passa a mostrar a lista dos registros de água do dia
(quantidade + hora), cada um com um ícone de lixeira pra apagar na hora. A edição das predefinições
ganha campo de texto livre (clicar no valor digita, não só `+`/`-50`). Um quarto botão
"personalizado" abre um campo pra digitar qualquer quantidade (com os mesmos `+`/`-50` de apoio) e
adicionar na hora, sem virar preset fixo.

**Contexto levantado no código atual — importante, muda o tamanho do plano:**
- **O backend já registra água como linhas individuais**, não como total acumulado:
  `registros_agua (id, user_id, quantidade_ml, criado_em)`, com `DELETE /api/agua/:id` **já
  existente e funcionando** (`backend/src/repos/agua.ts` → `apagarAgua`). O único endpoint que
  falta é um jeito de **listar** os registros do dia — hoje só existe soma (`totalAguaNoIntervalo`,
  usada em `GET /api/resumo/dia`).
- `frontend/src/components/CardAgua.tsx`: modo "editar" hoje só mexe nas 3 predefinições
  (`usePresetsAgua`), com `BotaoPasso` de `+`/`-50` — não lista nem apaga registros de consumo.
- `frontend/src/lib/presetsAgua.ts`/`usePresetsAgua.ts`: predefinições são só `localStorage`, 3
  valores fixos (`PRESETS_PADRAO = [200, 300, 500]`).
- Referência de campo de texto livre + stepper já existe: `frontend/src/components/detalhe/DetalheAlimento.tsx`
  (Plano G, Task 3) — mesmo padrão a reaproveitar aqui.

## Global Constraints

- Reaproveite `DELETE /api/agua/:id`, que já existe — não recrie.
- Predefinições continuam só client-side (`localStorage`); o quarto botão "personalizado" NÃO vira
  uma predefinição salva, é uma ação avulsa (digita e adiciona, sem persistir o valor escolhido em
  lugar nenhum além do registro em si).
- Estilo só com MUI (`sx`/`styled`), tokens do tema, Motion respeitando `useReducedMotion`.
- Domínio em português, termos técnicos em inglês. Testes Vitest só de função pura, sem
  rede/DOM.
- Commits em português, frase imperativa curta, terminando com as linhas de atribuição da sessão.
- Verificação: `npm test && npm run typecheck` (e `npm run build` no frontend) nos lados tocados.

---

### Task 1: Backend — listar registros de água do dia

**Files:**
- Modify: `backend/src/repos/agua.ts`
- Modify: `backend/src/routes/agua.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- `export async function listarAguaNoIntervalo(userId: string, inicio: Date, fim: Date): Promise<RegistroAgua[]>`
  (mesmo padrão de `totalAguaNoIntervalo`, devolvendo as linhas em vez da soma, mais recente
  primeiro).
- `GET /api/agua?data=YYYY-MM-DD` (data opcional, padrão hoje no fuso do usuário — confira como
  outras rotas já resolvem "hoje no fuso do usuário", ex. `resumo.ts`) → `200 RegistroAgua[]`.

**Steps:**
1. Implemente a função no repo e a rota, seguindo o padrão de datas/fuso já usado em
   `backend/src/routes/resumo.ts`.
2. `npm test`, `npm run typecheck` em `backend/`.
3. Documente a rota no contrato.
4. Teste real contra o Postgres local se possível (Postgres já rodando via `docker compose up -d
   postgres`, `backend/.env` configurado).
5. Commit.

---

### Task 2: Frontend — lista de registros de água no modo editar, com lixeira

**Files:**
- Modify: `frontend/src/components/CardAgua.tsx`
- Modify: `frontend/src/lib/api.ts` (`api.aguaDoDia()`/`api.apagarAgua(id)` — confira se
  `apagarAgua` já existe antes de recriar, o backend já tem o endpoint)
- Modify: `frontend/src/lib/types.ts` (`RegistroAgua`, se ainda não existir)

**Steps:**
1. No modo "editar" do `CardAgua`, acima ou abaixo da edição das predefinições, busque
   `api.aguaDoDia()` e liste os registros do dia (horário formatado tipo "14:32", quantidade em
   ml), cada linha com um ícone de lixeira (`lucide-react`, já é dependência) que chama
   `api.apagarAgua(id)` e remove da lista/recalcula o total exibido, com confirmação leve (o app já
   tem um padrão de confirmação — `useConfirmacao`/`Interruptor` — reaproveite se fizer sentido, ou
   um clique simples se o padrão do app já trata delete como reversível/pouco arriscado; confira
   como o app trata "excluir alimento"/"excluir registro" em outro lugar antes de decidir).
2. Atualize o total exibido no card (a métrica de água) depois de apagar um registro, sem esperar
   reload da página — recarregue a métrica do dia (mesma função que `Home.tsx` já usa) ou atualize
   localmente.
3. `npm test`, `npm run typecheck`, `npm run build` em `frontend/`.
4. Checagem visual manual fora do escopo do subagente.
5. Commit.

---

### Task 3: Frontend — predefinições editáveis por texto livre

**Files:**
- Modify: `frontend/src/components/CardAgua.tsx`

**Steps:**
1. No modo "editar", ao lado dos `BotaoPasso` de cada predefinição, adicione (ou troque o
   `Typography` do valor por) um `TextField` numérico editável ligado ao mesmo estado — digitar
   substitui o valor, mesmos limites de `ajustarPreset` (50–2000, múltiplo de 50 se o
   `presetsAgua.ts` já validar isso — confira e mantenha a mesma regra).
2. `npm test`, `npm run typecheck`, `npm run build`.
3. Commit.

---

### Task 4: Frontend — quarto botão "personalizado"

**Files:**
- Modify: `frontend/src/components/CardAgua.tsx`

**Steps:**
1. No modo padrão (não-editando), ao lado dos 3 botões de preset (`+200ml` etc.), adicione um
   quarto botão "personalizado" (rótulo curto, ex. "outro"). Ao tocar, abre um campo pequeno
   (popover, `Dialog` do MUI, ou expansão inline — decida pelo que for mais simples e consistente
   com o resto do app) com um `TextField` numérico e os mesmos `+`/`-50` de apoio, mais um botão
   "adicionar" que chama `aoAdicionar(valor)` com o valor digitado e fecha o campo.
2. Validação: mesmo intervalo mínimo/máximo já usado em outros lugares de água (confira
   `aguaSchema` do backend — `min(1).max(10000)` — e replique um limite razoável no cliente antes
   de enviar).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Checagem visual manual fora do escopo do subagente.
5. Commit.

---

### Task 5: Revisão final

**Steps:**
1. `npm test`, `npm run typecheck`, `npm run build` em `backend/` e `frontend/`.
2. Teste funcional real se possível: adicionar água por preset, por "personalizado", conferir que
   aparece na lista do modo editar com hora certa, apagar um registro e confirmar que o total do
   card atualiza.
3. Reporte qualquer pendência.
