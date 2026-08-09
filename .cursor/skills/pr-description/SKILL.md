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
- [ ] Emitir saída em fence ```text```, uma linha por commit
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

Envolver **toda** a lista num único fence ` ```text ` ` ` `. Dentro do fence:

- **Uma linha física por commit** (terminar cada commit com `\n`).
- **Linha em branco entre commits** (evita o Markdown juntar pipes numa tabela).
- Formato de cada linha: pipe + hash em código inline + dois pontos + resumo.

```text
| `<hash>`: <resumo breve em PT-BR do que aquele commit implementa>
```

Regras:

- Hash curto (`%h`) como na listagem.
- Resumo: o **que** mudou em linguagem técnica objetiva (PT-BR), não copiar o subject do commit se for vago.
- Sem título `#`, sem seções extras, sem bullet lists fora do fence — só o bloco ` ```text ` ` ` `, salvo pedido explícito do usuário.
- **Proibido** colar todos os commits numa única linha ou num parágrafo contínuo.
- **Proibido** emitir linhas `| ...` fora do fence (no chat elas viram tabela e “grudam”).

## Exemplo

Entrada (commits hipotéticos):

```text
0a1b2c3|feat: add refund flow
9d8e7f6|fix: handle null status
```

Saída (exatamente assim — fence + linha em branco entre commits):

````text
```text
| `0a1b2c3`: Implementa o fluxo de reembolso (telas e integrações necessárias) para o módulo.

| `9d8e7f6`: Corrige tratamento de status nulo para evitar falha em tempo de execução.
```
````
