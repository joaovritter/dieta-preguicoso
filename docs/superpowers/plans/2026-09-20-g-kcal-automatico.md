# Plano G — Kcal automático a partir dos macros

> **Modelo:** cada tarefa é implementada por subagente **Sonnet**; a sessão coordena e revisa.

**Goal:** As calorias de um alimento (e a meta de calorias do usuário) deixam de ser um campo
independente e passam a ser sempre `4×carboidrato_g + 4×proteina_g + 9×gordura_g`, calculado no
servidor e refletido ao vivo no cliente. Além disso, a porção do alimento passa a aceitar
digitação livre da quantidade, não só os botões `+`/`-`.

**Contexto levantado no código atual** (não presumir nada além disso):
- `backend/src/domain/nutricao.ts`: `calcularMetas` já usa 4/4/9 internamente só para estimar
  metas a partir de dados corporais (Mifflin-St Jeor). Não existe função reaproveitável
  `calorasDeMacros`.
- `frontend/src/lib/porcao.ts` → `escalarAlimento`: escala `calorias` e os 3 macros pelo mesmo
  fator linear da quantidade — não recalcula `calorias` a partir dos macros escalados.
- `frontend/src/components/detalhe/DetalheAlimento.tsx`: modo "ajustar valores" tem `TextField`
  independentes para kcal e cada macro — editar um não afeta o outro. Modo padrão só tem os
  botões `+`/`-` de porção, sem campo de texto livre pra quantidade.
- `backend/src/routes/registros.ts` → `PATCH /api/registros/:id`: recebe `alimentos` e grava como
  vier, sem recalcular `calorias` a partir dos macros.
- `frontend/src/components/SecaoMetas.tsx` e `backend/src/routes/me.ts` → `PUT /api/me`: os 5
  campos de meta (`meta_calorias`, `meta_carboidrato_g`, `meta_proteina_g`, `meta_gordura_g`,
  `meta_agua_ml`) são independentes quando `metas_automaticas` é `false`. Quando é `true`, o
  servidor sobrescreve todos com `calcularMetas` (TMB), ignorando o que veio do cliente.
- Tipo `Alimento` (`backend/src/domain/tipos.ts` / `frontend/src/lib/types.ts`): um único campo
  `calorias`, sem separação "informada" vs "calculada".

## Global Constraints

- Escopo é **edição manual** — a estimativa inicial da IA (`POST /registros/foto|audio|texto` →
  confirmação) não é tocada; a IA continua estimando `calorias` do jeito que já faz hoje. O
  recálculo automático só entra quando o usuário edita um alimento já salvo (`PATCH
  /api/registros/:id`) ou a meta (`PUT /api/me`).
- Fórmula única, sem exceção: `calorias = round1(4*carboidrato_g + 4*proteina_g + 9*gordura_g)`
  (mesmo arredondamento de 1 casa que `escalarAlimento` já usa).
- Backend recalcula sempre, mesmo que o cliente mande um valor de `calorias` diferente — defesa em
  profundidade, não confiar só no frontend.
- Frontend mostra o cálculo ao vivo enquanto o usuário digita (sem esperar salvar).
- Domínio em português, termos técnicos em inglês. SQL puro, sem ORM. Toda entrada de rota validada
  com Zod. Testes Vitest só de função pura, sem rede/DOM.
- Commits em português, frase imperativa curta, terminando com as linhas de atribuição da sessão.

---

### Task 1: `calorasDeMacros` — função pura (TDD, backend e frontend)

**Files:**
- Modify: `backend/src/domain/nutricao.ts`
- Modify: `backend/src/domain/nutricao.test.ts`
- Create: `frontend/src/lib/nutricao.ts`
- Create: `frontend/src/lib/nutricao.test.ts`

**Interfaces:**
- `export function calorasDeMacros(carboidrato_g: number, proteina_g: number, gordura_g: number): number`
  — `round1(4*carboidrato_g + 4*proteina_g + 9*gordura_g)`, mesma função de arredondamento a 1 casa
  que já existe em cada lado (`arredondar` no backend, algo equivalente a criar no frontend se não
  existir — conferir `frontend/src/lib/porcao.ts`, que já tem uma função `umaCasa` privada; extraia
  ou duplique, o que for mais simples).

**Steps:**
1. Escreva os testes primeiro (casos: valores normais, todos zero, arredondamento de casas
   decimais tipo `.05`).
2. Rode os testes, confirme que falham.
3. Implemente nos dois arquivos.
4. Rode os testes, confirme que passam.
5. `npm run typecheck` em `backend/` e `frontend/`.
6. Commit único cobrindo os dois lados (ou dois commits, um por lado — o que fizer mais sentido
   pro histórico).

---

### Task 2: Backend recalcula `calorias` de alimentos ao salvar (`PATCH /api/registros/:id`)

**Files:**
- Modify: `backend/src/routes/registros.ts` (ou onde estiver a validação/persistência de
  `alimentos` recebidos pelo PATCH — confirme com grep antes)
- Modify/Create: teste correspondente (TDD)

**Steps:**
1. No handler de `PATCH /api/registros/:id`, antes de persistir, recalcule `calorias` de cada item
   de `alimentos` recebido usando `calorasDeMacros`, ignorando o valor de `calorias` que veio no
   body.
2. Confirme (teste ou leitura do código) que o recálculo de totais do registro (soma dos
   alimentos) continua funcionando em cima dos valores já corrigidos.
3. TDD: teste que envia um alimento com `calorias` "errado" e macros "certos", confirma que o
   registro salvo tem `calorias` recalculado.
4. `npm test` e `npm run typecheck` em `backend/`.
5. Atualize `docs/api-contract.md` na seção de `PATCH /api/registros/:id` explicando que
   `calorias` de cada alimento é sempre recalculado a partir dos macros ao editar (a IA continua
   livre para estimar na primeira vez).
6. Commit.

---

### Task 3: Frontend — porção com texto livre + kcal computado ao vivo em `DetalheAlimento`

**Files:**
- Modify: `frontend/src/components/detalhe/DetalheAlimento.tsx`
- Modify/Create: teste de função pura auxiliar se alguma lógica nova de parsing for extraída para
  `frontend/src/lib/` (evite lógica não-trivial direto no componente)

**Steps:**
1. No modo padrão (não-editando), ao lado dos botões `+`/`-` de porção, adicione um campo de texto
   numérico editável ligado ao mesmo estado `quantidade` — digitar substitui o valor, sem precisar
   clicar nos botões. Mantenha os limites/validação que já existem (não deixar zerar/negativo).
2. No modo "ajustar valores" (`editando`), o campo de kcal deixa de ser um `TextField` editável e
   vira um valor computado (`calorasDeMacros` de `frontend/src/lib/nutricao.ts`, Task 1) que
   atualiza a cada tecla digitada nos campos de macro. Pode continuar visualmente parecido com os
   outros campos, só sem aceitar digitação direta (ex: `disabled`/somente leitura com o mesmo
   estilo, ou um texto grande como no modo padrão — decida pelo que ficar mais coerente com o
   resto da tela).
3. Ajuste `aoSalvar` para mandar o alimento com o `calorias` computado (mesmo que o backend também
   recalcule na Task 2 — mantém a tela consistente antes de salvar).
4. `npm test`, `npm run typecheck`, `npm run build` em `frontend/`.
5. Checagem visual manual fora do escopo do subagente — mencionar no resumo.
6. Commit.

---

### Task 4: Meta do usuário — kcal computado a partir dos macros

**Files:**
- Modify: `backend/src/routes/me.ts`
- Modify: `frontend/src/components/SecaoMetas.tsx`
- Modify/Create: testes correspondentes

**Steps:**
1. Backend (`PUT /api/me`): quando `metas_automaticas` é `false` (ou não enviado, mantendo o
   estado atual do usuário), recalcule `meta_calorias` a partir de
   `calorasDeMacros(meta_carboidrato_g, meta_proteina_g, meta_gordura_g)` usando os valores finais
   (mesclados com o que já está salvo, igual ao padrão que `automaticas` já usa hoje no mesmo
   arquivo), ignorando o `meta_calorias` que vier no body. Quando `metas_automaticas` é `true`, o
   comportamento already existente (TMB via `calcularMetas`) continua mandando — não muda.
2. TDD no handler ou numa função extraída, como preferir, cobrindo: editar só um macro da meta
   recalcula `meta_calorias`; `metas_automaticas` true ignora o que o cliente mandar.
3. Frontend (`SecaoMetas.tsx`): quando `metas_automaticas` está desligado, o campo `meta_calorias`
   vira somente leitura (computado ao vivo com `calorasDeMacros`, igual ao já existente quando
   `metas_automaticas` está ligado — reaproveite a mesma UI de "campo calculado" que já existe pro
   caso automático, só trocando a fonte do cálculo).
4. `npm test`, `npm run typecheck` (backend e frontend), `npm run build` (frontend).
5. Atualize `docs/api-contract.md` (seção `PUT /api/me` e "Cálculo automático de metas") deixando
   claro que `meta_calorias` é sempre derivado dos macros quando `metas_automaticas` é `false`.
6. Commit.

---

### Task 5: Revisão final

**Steps:**
1. Rode a suíte completa (`npm test`, `npm run typecheck`, `npm run build`) em `backend/` e
   `frontend/`.
2. Confira que não sobrou nenhum lugar (grep por `calorias:` em atribuições diretas fora das
   funções centralizadas) escrevendo `calorias` sem passar por `calorasDeMacros` nos fluxos de
   edição tocados por este plano.
3. Teste funcional real se possível (Postgres local já configurado): editar um alimento mudando só
   a proteína e confirmar que as kcal do registro mudam; editar a meta mudando só o carboidrato e
   confirmar que `meta_calorias` muda.
4. Reporte qualquer pendência.
