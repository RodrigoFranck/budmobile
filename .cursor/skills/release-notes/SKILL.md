---
name: release-notes
description: Generates PT-BR App Store / Play Store style "What's New" text plus a separate internal QA checklist from Git evidence. Use for release notes, notas de release, texto das lojas, or o que validar antes de publicar.
disable-model-invocation: true
---

# Release Notes (PT-BR)

## Objetivo

Gerar duas saídas distintas a partir do Git:

1. **Novidades desta versão** — texto **para o usuário final**, no estilo **App Store** e **Google Play** (“O que há de novo”), pronto para colar no campo de release das lojas.
2. **Checklist interno** — o que o time deve **testar antes de publicar**; **não** vai para as lojas.

Basear-se em evidência Git (diff, commits). Não inventar funcionalidades. Não incluir prints.

**Não substitui** `po-instructions` (regras de negócio incertas, critérios de aceite e passos detalhados de QA ficam lá — **nunca** na saída desta skill).

## Quando usar qual escopo

| Pedido do usuário             | Range Git                                        |
| ----------------------------- | ------------------------------------------------ |
| Branch atual / “esta release” | `START..HEAD` (regras abaixo)                    |
| Tag ou versão explícita       | `FROM..TO` informado                             |
| “Desde a última tag”          | `$(git describe --tags --abbrev=0 <base>)..HEAD` |
| Base explícita                | `BASE..HEAD` informado                           |

Se o usuário não especificar range, usar **branch atual** com `START..HEAD`.

## Workflow

```
Task Progress:
- [ ] Resolver range (FROM..TO ou START..HEAD)
- [ ] Ler versão em app.json
- [ ] Coletar commits e diff do range
- [ ] Mapear mudanças visíveis e comportamentais ao usuário
- [ ] Redigir seção 1 (lojas) e seção 2 (checklist interno)
- [ ] Revisar: nenhum termo proibido na seção 1; bullets obrigatórios cobertos
```

## Coleta de evidências (não pular)

### START (branch atual)

1. Reflog: `git reflog show "$BRANCH" --pretty='%H %gs' | grep -m 1 'branch: Created from' | awk '{print $1}'`
2. Fallback: `git merge-base HEAD` com `origin/main` → `origin/develop` → `origin/master`

### Comandos

```bash
git log --no-merges FROM..TO --pretty=format:"%h|%s" --reverse
git diff --stat FROM...TO
git diff --name-status FROM...TO
```

Versão: `app.json` (`expo.version`). Range vazio: informar e não inventar bullets.

### Varredura obrigatória (não pular)

Antes de redigir, inspecionar o diff por estes **eixos do produto**. Se houver mudança relevante, **deve** aparecer na seção 1 (benefício) e na seção 2 (teste) — não tratar como “só refactor”.

| Eixo               | Paths / sinais no diff                                                                                                                                             | Falar com o usuário como…                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Botão de voz**   | `ProminentVoiceButton`, `VoiceInterface`, `MessageInputBar` (`mode="trigger"`, `prominent`), `ChatHome`                                                            | botão de voz em destaque na tela do chat; falar com o Bud por voz ficou mais acessível                                                                 |
| **Cérebro do Bud** | `voicePrompt`, `approachMatcher`, `formatInternalProfile`, `useChatMemoryContext`, `ChatSessionProvider`, `chatStream` (`memoryContext`, `approachContext`)        | o Bud lembra conversas anteriores; escuta e responde com mais empatia e no seu ritmo; não precisa repetir tudo a cada vez                              |
| **Insights**       | `DeepInsightSheet`, `useDeepInsight`, `useExploreInsights`, `InsightCard`, `InsightContextCard`, `History` (card Inspirado em você), `Explore`, `TabScreenContext` | reflexões personalizadas mais profundas; pensamentos sobre você no Histórico e no Explorar; continuar a conversa a partir de um insight (texto ou voz) |

Commits com `memory context`, `approach context`, `voice prompt`, `insight` no título são pista forte — sempre mapear para benefício.

## Seção 1 — Novidades desta versão (lojas)

### Tom e formato (App Store / Play Store)

- **PT-BR**, direto para quem usa o app — como um comunicado caloroso da equipe do Bud.
- Foco no **benefício** (“revise suas conversas com mais clareza”), não na implementação.
- Bullets curtos: em geral **1 frase** (máx. 2), **sem** título técnico em negrito (`**Histórico —**`).
- Pode usar **“você”** com naturalidade; evite tom de documentação interna.
- Agrupar mudanças relacionadas em um único bullet quando fizer sentido.
- **3 a 8 bullets** na maioria das releases; releases grandes (ex.: 2.x) podem ter mais se o diff justificar.
- Incluir na seção 1 tudo que o usuário **percebe ou sente na conversa**: UI, voz, reflexões/insights e **mudanças no jeito do Bud responder** (memória, empatia, continuidade).
- **Não** incluir bump de versão, CI, migrations, skills internas nem refactors puramente estruturais **sem** efeito perceptível.
- **“Invisível” aqui é só infra** — reescrita de prompt, memória de chat e lógica de insights **são perceptíveis** e entram na seção 1 com linguagem de benefício (nunca jargão de engenharia).

### Proibido na seção 1 (lojas)

Nunca usar na copy para lojas:

- Marcadores internos: `(validar com PO)`, `TODO`, `WIP`, `smoke`, `regressão`, `handoff`
- Jargão de engenharia: `sheet`, `modal`, `hook`, `backend`, `Supabase`, `RTK`, nomes de arquivo/componente, hashes, branch
- Nomes de parceiros/links técnicos como item de release, salvo se for benefício claro ao usuário (ex.: não listar “selo ElevenLabs” — no máximo “melhorias na tela de entrada” se for só visual)
- Listas de teste, cenários de QA ou “abrir/voltar/conferir”
- Tom frio: “implementado”, “adicionado componente”, “refatorado”, “integrado”

### Vocabulário preferido (lojas)

| Evitar                                   | Preferir                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| sheet / modal                            | tela, leitura completa, painel                        |
| insight semanal (jargão)                 | reflexão personalizada, pensamentos sobre você        |
| cards de contexto                        | destaques das suas conversas                          |
| títulos automáticos                      | nomes mais claros nas suas conversas                  |
| modo automático (tema)                   | o app acompanha o tema claro ou escuro do seu celular |
| feedback (técnico)                       | diga o que achou                                      |
| prompt / approachMatcher / memoryContext | o Bud lembra e responde com mais escuta               |
| ProminentVoiceButton                     | botão de voz em destaque                              |
| deep insight / general_insight           | reflexão personalizada, pensamentos sobre você        |

### Bullets obrigatórios quando o diff tiver…

- **Botão de voz em destaque** (`ProminentVoiceButton` / `ChatHome` + `mode="trigger"`): pelo menos 1 bullet na seção 1.
- **Cérebro** (`voicePrompt`, `approachMatcher`, `useChatMemoryContext` ou equivalente): pelo menos 1 bullet sobre memória, empatia ou continuidade da conversa.
- **Insights** (`DeepInsightSheet`, cards no Explorar/Histórico, `InsightContextCard`): pelo menos 1 bullet sobre reflexões e seguir a conversa a partir delas.

### Exemplos bom vs ruim (lojas)

**Ruim:** `**Histórico — insight semanal**: card “Inspirado em você” abre sheet com feedback e atalho para chat (com voz).`

**Bom:** `Descubra uma reflexão feita para você no Histórico — leia com calma e, se quiser, continue a conversa com o Bud por voz.`

**Ruim:** `Títulos automáticos (validar com PO se persistência no backend está ok).`

**Bom:** `Suas conversas passam a ter nomes mais fáceis de reconhecer no Histórico.`

**Ruim:** `Integrado chat memory context e approach matcher no stream.`

**Bom:** `O Bud lembra melhor do que vocês já conversaram e responde com mais escuta — você não precisa começar do zero toda vez.`

**Ruim:** `Novo ProminentVoiceButton no ChatHome.`

**Bom:** `Na tela do chat, um botão de voz em destaque deixa mais fácil falar com o Bud quando quiser — sem precisar digitar.`

**Ruim:** `DeepInsightSheet com feedback e navigateToChatTab.`

**Bom:** `Reflexões feitas para você no Histórico e no Explorar podem ser lidas por inteiro e viram ponto de partida para continuar a conversa, inclusive por voz.`

Se não houver nada perceptível ao usuário no range:

```text
Pequenos ajustes para deixar sua experiência com o Bud ainda mais estável.
```

(Usar só quando o diff for realmente só infra/versão.)

## Seção 2 — Checklist interno (não publicar nas lojas)

- Lista **operacional** para QA antes do envio às lojas.
- Bullets por **fluxo** (Histórico, Login, Chat, etc.), não por arquivo.
- Linguagem clara para o time, mas **sem** `(validar com PO)` nem outras notas para PO — dúvidas de regra de negócio: omitir da lista ou usar `po-instructions`.
- Máximo **5–10 bullets**; cada novidade perceptível da seção 1 deve ter cobertura de teste aqui.
- Pode mencionar estados (bloqueado/desbloqueado, login social, tema do sistema) porque é **uso interno**.

## Mapeamento Git → linguagem de loja (referência interna do agente)

| Diff                                                     | Falar com o usuário como…                                    |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `History`, `DeepInsightSheet`                            | Histórico, reflexões sobre você, leitura completa            |
| `Explore`, `InsightCard`                                 | Explorar, pensamentos sobre sua jornada, frequência, hábitos |
| `InsightContextCard`                                     | destaques visuais ao rever uma conversa                      |
| `Chat`, `ChatHome`, `TextChatScreen`                     | conversa com o Bud, por texto ou voz                         |
| `ProminentVoiceButton`, `VoiceInterface`                 | botão de voz em destaque, falar com o Bud                    |
| `voicePrompt`, `approachMatcher`, `useChatMemoryContext` | o Bud lembra, escuta melhor, responde no seu ritmo           |
| `Auth`                                                   | entrar na sua conta                                          |
| `Settings`, tema                                         | Configurações, aparência do app                              |
| `onboarding`                                             | primeiros passos no Bud                                      |
| `healthSafety`                                           | recursos de apoio e segurança                                |

## Formato de saída (obrigatório)

Markdown pronto para colar. **Somente** a linha de contexto (metadado interno) e **duas seções**.

**Linha de contexto** (metadado — **não** colar nas lojas):

```text
Versão: <expo.version> | Range: FROM=<sha>..TO=<sha> | Branch: <nome>
```

---

## Novidades desta versão

_Texto para App Store e Google Play — “O que há de novo”._

- Bullets user-friendly (regras da seção 1).

---

## Checklist interno

_Não publicar nas lojas. Testar antes de enviar a versão._

- Bullets de QA (regras da seção 2).

---

### Apêndice opcional (se o usuário pedir commits)

## Referência de commits

`| \`<hash>\`: <resumo técnico>`

## Relação com outras skills

| Skill             | Uso                                |
| ----------------- | ---------------------------------- |
| `release-notes`   | Copy das lojas + checklist interno |
| `po-instructions` | Regras de negócio e QA detalhado   |
| `pr-description`  | PR commit a commit                 |

## Exemplo completo

```markdown
Versão: 1.0.6 | Range: FROM=abc1234..TO=def5678 | Branch: feat/history

## Novidades desta versão

_Texto para App Store e Google Play — “O que há de novo”._

- Na tela do chat, um botão de voz em destaque deixa mais fácil falar com o Bud quando quiser — sem precisar digitar.
- O Bud lembra melhor do que vocês já conversaram e responde com mais escuta e empatia, em texto e por voz.
- Reflexões feitas para você no Histórico e no Explorar podem ser lidas por inteiro e viram ponto de partida para continuar a conversa, inclusive por voz.
- O Histórico ficou mais fácil de usar: navegue por mês e encontre suas conversas com nomes que fazem sentido para você.
- Ao rever uma conversa, os momentos importantes aparecem de forma mais clara, com destaques visuais e horários.
- Entrar no Bud está mais simples, com opções de Apple, Google ou e-mail na mesma tela.
- O Bud pode seguir o tema claro ou escuro do seu celular, se você preferir.

## Checklist interno

_Não publicar nas lojas. Testar antes de enviar a versão._

- Chat (home): botão de voz em destaque, abrir chat por texto, iniciar voz a partir da home.
- Cérebro do Bud: retorno no mesmo dia com continuidade, memória de conversas anteriores, tom empático em crise e em desabafo; texto e voz.
- Insights no Explorar: cards bloqueados vs disponíveis, atalho de voz no card, abrir chat com contexto do insight.
- Histórico: troca de mês, card Inspirado em você (bloqueado/disponível), leitura completa, feedback, continuar no chat e voz.
- Detalhe da conversa: nomes gerados, destaques visuais (context), mensagens com horário.
- Login: Apple, Google, e-mail (entrar, cadastro, recuperar senha, mostrar senha).
- Configurações: tema claro/escuro e alinhamento com o tema do aparelho.
```
