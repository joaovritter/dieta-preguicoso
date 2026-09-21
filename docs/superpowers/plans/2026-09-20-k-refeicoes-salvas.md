# Plano K — Refeições salvas (privado, no próprio perfil)

> **Modelo:** cada tarefa é implementada por subagente **Sonnet**; a sessão coordena e revisa.

**Goal:** O usuário pode salvar uma refeição — a sua própria (ao confirmar um registro novo) ou a
de outra pessoa (a partir de um post no feed) — guardando uma cópia com todos os macros e calorias
daquele momento. Os salvos ficam numa aba nova no próprio perfil, visível só pro dono da conta
(nunca aparece no perfil público de ninguém).

**Contexto levantado no código atual:**
- `backend/src/domain/tipos.ts` → `interface Registro` já tem tudo que precisa virar um "salvo":
  `alimentos_detectados: Alimento[]`, `calorias_total`, `carboidrato_total_g`,
  `proteina_total_g`, `gordura_total_g`, `refeicao_nome`, `descricao_bruta`.
- `frontend/src/components/ConfirmacaoRegistro.tsx`: tela de confirmação logo após registrar (foto
  /áudio/texto) — `aoConfirmar(entrada: EntradaConfirmacao)` cria o registro. É aqui que entra a
  opção "salvar também".
- `frontend/src/components/CardPost.tsx`: já tem rodapé com curtir/comentar (ícones + contador,
  estado otimista) — o botão de salvar segue o mesmo padrão visual e de interação.
- Controle de acesso a um post de outra pessoa já existe: `postVisivel`/`donoDoRegistro` em
  `backend/src/routes/socialComum.ts`/`backend/src/repos/interacoes.ts` (usado por curtir/comentar)
  — reaproveite a mesma checagem pra salvar (só pode salvar o que já pode ver: feed geral, amigos,
  grupo).
- Perfil próprio (`frontend/src/pages/Perfil.tsx`, Plano H) já tem abas Publicações/Grupos
  /Comentários via `Segmentado`. A aba "Salvos" entra aqui, **só** nessa tela (nunca em
  `PerfilPublico.tsx`).

## Global Constraints

- "Salvar" copia os dados (nome, alimentos com macros, calorias) no momento do salvamento — não é
  um link/referência que muda se o post original for editado ou apagado depois.
- Só é possível salvar um registro que o usuário já pode ver (mesma regra de curtir/comentar —
  reaproveite `postVisivel`, não invente uma nova).
- A lista de salvos é privada: sem rota pública, sem campo em `PerfilPublico`.
- Domínio em português (`refeicoes_salvas`, `salvo`). SQL puro, sem ORM. Toda entrada de rota
  validada com Zod. Testes Vitest só de função pura, sem rede/DOM.
- Estilo só com MUI (`sx`/`styled`), tokens do tema. Sem CSS puro novo.
- Commits em português, frase imperativa curta, terminando com as linhas de atribuição da sessão.
- Verificação: `npm test && npm run typecheck` (e `npm run build` quando tocar frontend) nos lados
  tocados.

---

### Task 1: Contrato + migration

**Files:**
- Create: `backend/src/db/migrations/007_refeicoes_salvas.sql` (confira o número da última
  migration antes de nomear)
- Modify: `docs/api-contract.md`
- Modify: `backend/src/domain/tipos.ts`, `frontend/src/lib/types.ts`

**Steps:**
1. Migration: tabela `refeicoes_salvas` — `id UUID PK`, `user_id UUID NOT NULL REFERENCES users(id)
   ON DELETE CASCADE`, `nome TEXT NOT NULL`, `alimentos JSONB NOT NULL`, `calorias_total NUMERIC
   NOT NULL`, `carboidrato_total_g NUMERIC NOT NULL`, `proteina_total_g NUMERIC NOT NULL`,
   `gordura_total_g NUMERIC NOT NULL`, `origem_registro_id UUID NULL` (guarda de onde veio, só
   informativo — sem FK obrigatória, o registro original pode ser apagado depois sem quebrar o
   salvo), `origem_autor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL`, `origem_autor_nome
   TEXT NULL` (nome de quem postou originalmente, pra mostrar "salvo de fulano" mesmo que a conta
   dele suma), `criado_em TIMESTAMPTZ NOT NULL DEFAULT now()`. Índice em `(user_id, criado_em
   DESC)`.
2. Tipo `RefeicaoSalva` (backend e frontend): espelha as colunas acima (datas como `string` no
   frontend).
3. Documente no `api-contract.md` o tipo e as rotas que a Task 2 vai criar (pode escrever a seção
   já prevendo as rotas, ou deixar só o tipo aqui e completar na Task 2 — decida pelo que ficar mais
   organizado).
4. `npm run migrate` contra o Postgres local pra confirmar que aplica sem erro.
5. Commit.

---

### Task 2: Backend — salvar, listar e apagar

**Files:**
- Create: `backend/src/repos/refeicoesSalvas.ts`
- Modify: `backend/src/routes/me.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- `POST /api/me/salvos` — body `{ registro_id: string }`. Busca o registro (checando acesso com
  `postVisivel`/equivalente — precisa funcionar tanto pro próprio registro quanto pro de um amigo
  visível no feed), copia `refeicao_nome` como `nome`, `alimentos_detectados` como `alimentos`, os
  4 totais, e `origem_autor_id`/`origem_autor_nome` (nulo se for da própria pessoa, preenchido se
  for de outra) → `201 RefeicaoSalva`.
- `GET /api/me/salvos?antes=<ISO>&limite=<1..50>` — paginado, mesmo padrão de `GET
  /api/me/comentarios` (Plano H) → `200 { salvos: RefeicaoSalva[], proximo_antes: string | null }`.
- `DELETE /api/me/salvos/:id` → `204`.

**Steps:**
1. Implemente o repo e as três rotas. Reaproveite a checagem de acesso a post já usada por
   curtir/comentar — confira o nome exato da função em `backend/src/routes/socialComum.ts` antes de
   reimplementar.
2. TDD onde fizer sentido (função pura de montagem do payload, se extrair alguma).
3. `npm test`, `npm run typecheck` em `backend/`.
4. Documente as três rotas no contrato.
5. Teste real contra o Postgres local se possível: salvar um registro próprio, salvar o registro de
   uma conta de teste amiga, tentar salvar um registro de alguém que não é visível (deve barrar,
   mesmo erro que curtir/comentar barrado já usa).
6. Commit.

---

### Task 3: Frontend — cliente da API e tipos

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts` (se sobrar algo da Task 1)

**Steps:**
1. `api.salvarRefeicao(registroId: string)`, `api.salvos(antes?: string)`,
   `api.apagarSalvo(id: string)`.
2. `npm run typecheck`, `npm test` em `frontend/`.
3. Commit.

---

### Task 4: Frontend — botão salvar no `CardPost`

**Files:**
- Modify: `frontend/src/components/CardPost.tsx`
- Modify: `frontend/src/lib/types.ts` (`Post` ganha `salvo: boolean`, se ainda não tiver — confira
  se o backend já devolve isso; se não devolver, adicione na Task 2 em vez de aqui, mas deixe
  registrado que precisou)
- Modify: `backend/src/repos/registros.ts`/`backend/src/repos/interacoes.ts` (se `salvo` precisar
  ser propagado nas consultas de feed/comentários, mesmo padrão já usado pra `curti`)

**Steps:**
1. Ícone de "salvar" (bookmark, `lucide-react`) no rodapé do `CardPost`, ao lado de
   curtir/comentar, com estado otimista (preenchido quando `post.salvo`, chama
   `api.salvarRefeicao(post.id)` ao tocar — sem "desfazer salvar" por aqui, isso é feito na aba
   Salvos do perfil).
2. Se `salvo` não vier do backend ainda, adicione a subquery equivalente às de `curtidas`/`curti`
   (Plano D) nas consultas de feed relevantes.
3. `npm test`, `npm run typecheck`, `npm run build` em `frontend/` (e `backend/` se tiver mexido
   nas consultas).
4. Checagem visual manual fora do escopo do subagente.
5. Commit.

---

### Task 5: Frontend — opção de salvar ao confirmar um registro novo

**Files:**
- Modify: `frontend/src/components/ConfirmacaoRegistro.tsx`
- Modify: `frontend/src/captura/CapturaContext.tsx` (se o fluxo de confirmação precisar saber o id
  do registro recém-criado pra chamar `salvarRefeicao` — confira como `aoConfirmar` devolve/recebe
  o resultado da criação hoje)

**Steps:**
1. Adicione um `Interruptor`/checkbox "salvar esta refeição" na tela de confirmação. Ao confirmar
   com a opção ligada, depois que o registro é criado com sucesso, chame
   `api.salvarRefeicao(idDoRegistroCriado)`.
2. Trate falha ao salvar sem travar o fluxo principal (o registro já foi criado e confirmado; se o
   "salvar" falhar, mostre um aviso discreto, não bloqueie a navegação de volta).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Commit.

---

### Task 6: Frontend — aba "Salvos" no próprio perfil

**Files:**
- Modify: `frontend/src/pages/Perfil.tsx`
- Create: `frontend/src/components/perfil/AbaSalvos.tsx`

**Steps:**
1. Nova aba "salvos" na lista de abas do próprio perfil (Publicações/Grupos/Comentários/**Salvos**
   — decida a ordem que fizer mais sentido, sugestão: logo depois de Publicações). **Não** adicione
   essa aba em `PerfilPublico.tsx` — é sempre privada.
2. `AbaSalvos.tsx`: lista paginada de `api.salvos()`, cada item mostrando nome, calorias e macros
   totais, data salva, e — quando `origem_autor_nome` não é nulo — "salvo do post de {nome}"; ícone
   de lixeira pra apagar (`api.apagarSalvo`), sem precisar de confirmação extra (é só remover da
   sua própria lista salva, não afeta o post original).
3. `npm test`, `npm run typecheck`, `npm run build`.
4. Checagem visual manual fora do escopo do subagente.
5. Commit.

---

### Task 7: Revisão final

**Steps:**
1. `npm test`, `npm run typecheck`, `npm run build` em `backend/` e `frontend/`.
2. Confirme que `PerfilPublico.tsx` não ganhou nenhuma referência a salvos (privacidade).
3. Teste funcional real se possível: salvar a própria refeição ao confirmar, salvar a refeição de
   um amigo pelo feed, ver os dois na aba Salvos com os macros certos, apagar um e confirmar que
   sumiu.
4. Reporte qualquer pendência.
