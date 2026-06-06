---
name: po-instructions
description: Generates PT-BR PO/product instructions for the current branch using Git evidence (logs/diffs) and minimal code reading when needed. Use when the user asks for PO instructions, product/business impact summary, stakeholder-facing notes, or how to test from a beneficiary journey perspective.
disable-model-invocation: true
---

# PO Instructions (PT-BR)

## Objetivo

Gerar **instruções de PO** em **PT-BR** para a branch atual, com linguagem de **produto/negócio** (beneficiário, fluxo, jornada), baseadas em evidências do **Git** e, quando necessário, leitura pontual do **código** — para apoiar validação com PO, QA e stakeholders.

**Não substitui** a descrição técnica de PR (`pr-description`); complementa com visão de impacto e testes.

Observação: **prints de evidência** (telas, vídeos, logs) **serão adicionados manualmente pelo autor** — não incluir nem solicitar prints na saída.

## Prompt gerador (regras obrigatórias)

### 1) Coleta de evidências Git (não pular)

Reutilizar a mesma lógica de range da skill `pr-description`:

- Descobrir a base (prioridade): `origin/main`, senão `origin/develop`, senão `origin/master`.
- Determinar o **início do range** (`START`), prioridade:
  - **Ponto de criação da branch**: `git reflog show <branch> --pretty='%H %gs' | grep -m 1 'branch: Created from'` → SHA como `START`.
  - **Fallback**: `git merge-base HEAD <base>`.
- Coletar sempre para a **branch checkoutada** (`HEAD`), range `START..HEAD`:
  - `git branch --show-current`
  - `git log --no-merges START..HEAD --oneline`
  - `git log --no-merges START..HEAD --pretty=format:"%H|%s" --reverse`
  - `git diff --stat START...HEAD`
  - `git diff --name-status START...HEAD`
- Por commit (para contexto): `git show --name-only --pretty=format: <sha>`.

### 2) Mapeamento para o app (obrigatório antes de redigir)

Traduzir arquivos e commits em **áreas do app** e **fluxos do beneficiário**. Usar o diff e, se preciso, leitura rápida do código.

**Heurísticas de caminho (projeto INPAO):**

| Padrão no diff                           | Área / fluxo provável                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `src/screens/...`                        | Tela ou passo de jornada (nome da pasta ≈ nome do fluxo)                   |
| `App.tsx`, `drawer.routes`, `*routes*`   | Navegação, entrada em fluxos, menu                                         |
| `src/services/`, `src/models/`           | Regras de negócio, APIs, dados exibidos no app                             |
| `src/contexts/`                          | Comportamento global (sessão, plano, etc.)                                 |
| `src/i18n/`, textos                      | Copy, mensagens ao usuário                                                 |
| `src/constants/`, analytics              | Tagueamento, menus, feature flags                                          |
| `ios/`, `android/`, `Info.plist`, Gradle | Build nativo, permissões, deep link — impacto indireto ou de instalação    |
| `package.json`, CI, pipeline             | Infra/deploy — mencionar só se afetar **entrega** ou **ambiente de teste** |

**Para cada mudança relevante**, responder mentalmente (e refletir na redação):

- Qual **funcionalidade** do app muda (o que o beneficiário vê ou consegue fazer)?
- É **nova**, **correção**, **melhoria** ou **ajuste interno** sem mudança visível?
- Há **regressão possível** em fluxos adjacentes (login, home, menu, reembolso, rede credenciada, carteirinha, etc.)?

Se o diff for só build/lockfile/refactor sem UX: declarar **“sem impacto visível ao beneficiário”** e explicar em uma frase o motivo (ex.: correção de pipeline).

### 3) Redação (linguagem de PO)

- Escrever **sempre em PT-BR**.
- Foco no **beneficiário** e na **jornada**, não em classes, hooks ou nomes de arquivo na narrativa principal (arquivos podem aparecer só em nota técnica opcional no fim, se útil para QA).
- Ser **específico**: evitar “melhorias gerais”; citar telas/fluxos pelo **nome de negócio** (ex.: “Solicitação de reembolso”, “Rede credenciada por CEP”).
- Se o escopo for incerto, marcar com **“(inferido do diff — validar com PO)”** em vez de inventar regra de negócio.
- Não inventar critérios de aceite que não aparecem nos commits/diff/código.

### 4) Plano de testes

- Listar **pré-requisitos** (ambiente, tipo de plano, login, dados de teste) só quando inferíveis ou indispensáveis.
- Descrever passos em formato **checklist** (`- [ ]`), numerados por fluxo.
- Incluir **caminho de navegação** no app quando conhecido (ex.: Menu → Reembolso → Nova solicitação).
- Cobrir: **caminho feliz**, **1–2 cenários de borda** plausíveis, e **smoke** em fluxos que o diff sugere como adjacentes.
- Separar testes **iOS** e **Android** somente se o diff tocar nativo ou comportamento específico de plataforma.

## Formato de saída (obrigatório)

Retornar em **Markdown** pronto para colar (Confluence, Jira, PR, etc.).

No máximo **uma linha** de contexto do range (ex.: `Branch: <nome> | Range: START=<sha>..HEAD`).

Em seguida, **exatamente estas três seções** (títulos fixos):

---

## O que isso impacta no app

- Bullets por **área/funcionalidade** impactada.
- Para cada item: o que muda para o beneficiário (antes/depois em uma frase, quando couber).
- Agrupar mudanças pequenas relacionadas; não repetir um bullet por arquivo.

## O que de valor isso trouxe?

- Bullets com **benefício** (problema resolvido, risco reduzido, experiência melhorada, conformidade, etc.).
- Linguagem de resultado (“o beneficiário consegue…”, “reduz erro ao…”), não de implementação.
- Se não houver valor direto ao usuário (ex.: só CI), declarar o valor para **entrega/estabilidade** em uma frase.

## Como testar e quais fluxos impacta dentro do App

### Fluxos impactados

- Lista nomeada dos fluxos/jornadas (para smoke e regressão).

### Como testar

- Checklist por fluxo, com passos acionáveis.
- Subseção **Regressão sugerida** (fluxos adjacentes a exercitar rapidamente).
- Subseção **Observações** (opcional): dados necessários, flags, ambientes, limitações conhecidas.

---

### Exemplo mínimo de estrutura (substituir por dados reais)

## O que isso impacta no app

- **Reembolso — nova solicitação**: o beneficiário passa a ver…

## O que de valor isso trouxe?

- Reduz abandono no envio porque…

## Como testar e quais fluxos impacta dentro do App

### Fluxos impactados

- Login / Home
- Reembolso → Nova solicitação → Confirmação

### Como testar

**Reembolso — nova solicitação**

- [ ] Logar com beneficiário com plano ativo
- [ ] Menu → Reembolso → Nova solicitação
- [ ] …

**Regressão sugerida**

- [ ] Abrir histórico de reembolsos e validar listagem anterior
