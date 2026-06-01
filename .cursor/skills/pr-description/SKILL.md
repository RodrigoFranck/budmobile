---
name: pr-description
description: Generates a GitHub Pull Request description in PT-BR with one line per commit, using Git evidence (branch base + START..HEAD range + per-commit diff). Use when the user asks to write PR descriptions, PR summary, or "descrição do PR" for the current branch.
disable-model-invocation: true
---

# PR Description (PT-BR)

## Objetivo

Gerar descrição de **Pull Request** em **PT-BR**, pronta para colar no GitHub: **uma linha por commit**, no formato fixo abaixo.

Não incluir listas de arquivos, áreas temáticas, test plan nem prints — salvo se o usuário pedir explicitamente.

Para visão de produto/PO e checklist de testes, usar a skill `po-instructions` (complementar; não substitui esta).

## Workflow

```
Task Progress:
- [ ] Descobrir base remota (main → develop → master)
- [ ] Determinar START (reflog da branch ou merge-base)
- [ ] Listar commits START..HEAD (--no-merges, ordem cronológica)
- [ ] Para cada commit: inspecionar diff e redigir resumo em PT-BR
- [ ] Emitir saída no formato | `<hash>`: ...
```

## Coleta de evidências (não pular)

Executar na **branch checkoutada** (`HEAD`).

**Base** (prioridade): `origin/main` → `origin/develop` → `origin/master`. Usar a primeira que existir (`git rev-parse --verify <ref>`).

**START** (prioridade):

1. Reflog — ponto de criação da branch:
   ```bash
   BRANCH=$(git branch --show-current)
   git reflog show "$BRANCH" --pretty='%H %gs' | grep -m 1 'branch: Created from' | awk '{print $1}'
   ```
2. Fallback: `git merge-base HEAD <base>`

**Commits** (ordem cronológica, sem merges):

```bash
git log --no-merges START..HEAD --pretty=format:"%h|%s" --reverse
```

**Por commit**: `git show <sha> --stat` (e diff resumido se o assunto for genérico ou em inglês). Redigir o resumo a partir do **diff**, não só da mensagem de commit.

**Range vazio ou só merges**: informar que não há commits no range e não inventar linhas.

## Formato de saída (obrigatório)

Uma linha por commit, **exatamente** (pipe + hash em código inline + dois pontos + resumo):

```text
| `<hash>`: <resumo breve em PT-BR do que aquele commit implementa>
```

- Hash curto (`%h`) como na listagem.
- Resumo: o **que** mudou em linguagem técnica objetiva (PT-BR), não copiar o subject do commit se for vago.
- Sem título `#`, sem seções extras, sem bullet lists — apenas as linhas no formato acima, salvo pedido explícito do usuário.

## Exemplo

Entrada (commits hipotéticos):

```text
0a1b2c3|feat: add refund flow
9d8e7f6|fix: handle null status
```

Saída:

```text
| `0a1b2c3`: Implementa o fluxo de reembolso (telas e integrações necessárias) para o módulo.
| `9d8e7f6`: Corrige tratamento de status nulo para evitar falha em tempo de execução.
```
