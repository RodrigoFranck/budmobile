import type { InternalProfile } from '@/hooks/useInternalProfile';

export interface MemoryInsight {
  insight_type: string;
  title: string;
  description: string;
  context_summary?: string | null;
}

export interface PreviousConversationMemory {
  date: string;
  title: string;
}

export interface ChatMemoryContext {
  internalProfileText: string | null;
  approachGuidance: string | null;
  recentInsights: MemoryInsight[];
  previousConversations: PreviousConversationMemory[];
}

const EMPTY_PROFILE_MESSAGE =
  'Perfil interno ainda não disponível — este é um usuário novo ou o perfil ainda não foi gerado.';

function formatCommunicationStyle(profile: InternalProfile): string[] {
  const style = profile.communication_style;
  const lines: string[] = [];

  if (style.preferred_tone) {
    lines.push(`Tom preferido: ${style.preferred_tone}`);
  }
  if (style.response_length) {
    lines.push(`Tamanho de resposta preferido: ${style.response_length}`);
  }
  if (style.needs_validation === true) {
    lines.push('Precisa de validação antes de exploração ou provocação');
  }
  if (style.prefers_questions === true) {
    lines.push('Responde melhor a perguntas diretas');
  } else if (style.prefers_questions === false) {
    lines.push('Responde melhor a afirmações e observações reflexivas');
  }
  if (style.other_notes) {
    lines.push(style.other_notes);
  }

  return lines;
}

export function buildApproachGuidance(profile: InternalProfile | null): string | null {
  if (!profile) return null;

  const lines: string[] = [];
  const styleLines = formatCommunicationStyle(profile);

  if (styleLines.length > 0) {
    lines.push('ESTILO DE COMUNICAÇÃO DESTE USUÁRIO:');
    styleLines.forEach((line) => lines.push(`- ${line}`));
  }

  if (profile.effective_approaches.length > 0) {
    lines.push('');
    lines.push('ABORDAGENS QUE JÁ FUNCIONARAM COM ESTE USUÁRIO:');
    profile.effective_approaches.forEach((item) => {
      lines.push(`- ${item.approach}${item.context ? ` (${item.context})` : ''}`);
    });
  }

  if (profile.blind_spots.length > 0) {
    lines.push('');
    lines.push('PONTOS DE ATENÇÃO — ABORDAR COM CUIDADO:');
    profile.blind_spots.forEach((item) => {
      lines.push(`- ${item.area}: ${item.approach}`);
    });
  }

  if (lines.length === 0) return null;
  return lines.join('\n');
}

export function formatInternalProfileForPrompt(
  profile: InternalProfile | null,
  options?: {
    previousConversations?: PreviousConversationMemory[];
    recentInsights?: MemoryInsight[];
  },
): string {
  const sections: string[] = [];

  if (!profile) {
    sections.push(EMPTY_PROFILE_MESSAGE);
  } else {
    if (profile.journey_summary) {
      sections.push(`RESUMO DA JORNADA:\n${profile.journey_summary}`);
    }

    if (profile.emotional_patterns.length > 0) {
      const patterns = profile.emotional_patterns
        .map((item) => `- ${item.pattern} (${item.frequency}): ${item.context}`)
        .join('\n');
      sections.push(`PADRÕES EMOCIONAIS:\n${patterns}`);
    }

    if (profile.recurring_themes.length > 0) {
      const themes = profile.recurring_themes
        .map((item) => `- ${item.theme} [${item.importance}]: ${item.evolution}`)
        .join('\n');
      sections.push(`TEMAS RECORRENTES:\n${themes}`);
    }

    const styleLines = formatCommunicationStyle(profile);
    if (styleLines.length > 0) {
      sections.push(`ESTILO DE COMUNICAÇÃO:\n${styleLines.map((line) => `- ${line}`).join('\n')}`);
    }

    if (profile.effective_approaches.length > 0) {
      const approaches = profile.effective_approaches
        .map((item) => `- ${item.approach}${item.context ? ` (${item.context})` : ''}`)
        .join('\n');
      sections.push(`ABORDAGENS QUE FUNCIONARAM:\n${approaches}`);
    }

    if (profile.blind_spots.length > 0) {
      const spots = profile.blind_spots
        .map((item) => `- ${item.area}: ${item.approach}`)
        .join('\n');
      sections.push(`PONTOS DE ATENÇÃO:\n${spots}`);
    }

    if (profile.conversations_analyzed > 0) {
      sections.push(
        `Conversas analisadas: ${profile.conversations_analyzed}${
          profile.last_consolidated_at
            ? ` (última consolidação: ${profile.last_consolidated_at.split('T')[0]})`
            : ''
        }`,
      );
    }

    if (sections.length === 0) {
      sections.push(EMPTY_PROFILE_MESSAGE);
    }
  }

  const previousConversations = options?.previousConversations ?? [];
  if (previousConversations.length > 0) {
    const history = previousConversations
      .map((item) => `- ${item.date}: ${item.title}`)
      .join('\n');
    sections.push(`CONVERSAS DE OUTROS DIAS (memória cross-day):\n${history}`);
  }

  const recentInsights = options?.recentInsights ?? [];
  if (recentInsights.length > 0) {
    const insights = recentInsights
      .map((item) => {
        const summary = item.context_summary || item.description;
        return `- [${item.insight_type}] ${item.title}: ${summary}`;
      })
      .join('\n');
    sections.push(`INSIGHTS RECENTES DO SISTEMA:\n${insights}`);
  }

  return sections.join('\n\n');
}

export function buildChatMemoryContext(
  profile: InternalProfile | null,
  previousConversations: PreviousConversationMemory[],
  recentInsights: MemoryInsight[],
): ChatMemoryContext {
  return {
    internalProfileText: formatInternalProfileForPrompt(profile, {
      previousConversations,
      recentInsights,
    }),
    approachGuidance: buildApproachGuidance(profile),
    recentInsights,
    previousConversations,
  };
}
