import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { Insight } from '@/hooks/useExploreInsights';
import { supabase } from '@/integrations/supabase/client';
import type { ChatInsightParam } from '@/types/chatInsight';
import { buildExploreChatInsight } from '@/utils/buildExploreChatInsight';
import { navigateToChatTab } from '@/utils/navigateToChat';

export const HOME_CONVERSATION_RECAP_TYPE = 'conversation_recap';

const MAX_RECAP_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 400;
const MAX_TRANSCRIPT_CHARS = 4000;

function formatTranscript(
  messages: Array<{ role: string; content: string }>,
): string {
  const lines = messages
    .filter((message) => message.role !== 'context' && message.content.trim())
    .slice(-MAX_RECAP_MESSAGES)
    .map((message) => {
      const speaker = message.role === 'user' ? 'Pessoa' : 'Bud';
      const trimmed = message.content.trim();
      const content =
        trimmed.length > MAX_MESSAGE_CHARS
          ? `${trimmed.slice(0, MAX_MESSAGE_CHARS)}…`
          : trimmed;
      return `${speaker}: ${content}`;
    });

  let transcript = lines.join('\n');
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    transcript = transcript.slice(-MAX_TRANSCRIPT_CHARS);
  }
  return transcript;
}

function recapHeader(title: string, dateLabel: string): string {
  return (
    `A pessoa escolheu retomar a conversa "${title}" (${dateLabel}) a partir do núcleo.\n` +
    'Retome somente essa troca. Não peça o assunto.'
  );
}

export async function fetchConversationRecapInternalContext(params: {
  conversationId: string;
  title: string;
  dateLabel: string;
}): Promise<string> {
  const header = recapHeader(params.title, params.dateLabel);

  const { data: summaries } = await supabase
    .from('session_summaries')
    .select('summary_text')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false })
    .limit(1);

  const summaryText = summaries?.[0]?.summary_text?.trim();
  if (summaryText) {
    return `${header}\n\nResumo da sessão:\n${summaryText}`;
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: false })
    .limit(MAX_RECAP_MESSAGES);

  const chronological = [...(messages ?? [])].reverse();
  const transcript = formatTranscript(chronological);
  if (transcript) {
    return `${header}\n\nTrechos da conversa:\n${transcript}`;
  }

  return header;
}

export function buildYesterdayHomeRecapChatInsight(insight: Insight): ChatInsightParam {
  return buildExploreChatInsight('yesterday_journey', insight, 'text');
}

export async function buildConversationRecapChatInsight(params: {
  conversationId: string;
  title: string;
  dateLabel: string;
  cardDescription: string;
}): Promise<ChatInsightParam> {
  const title = params.title.trim();
  let internalContext = recapHeader(title, params.dateLabel);

  try {
    internalContext = await fetchConversationRecapInternalContext({
      conversationId: params.conversationId,
      title,
      dateLabel: params.dateLabel,
    });
  } catch {
    // Keep the title/date fallback if the recap transcript cannot be loaded.
  }

  return {
    insightType: HOME_CONVERSATION_RECAP_TYPE,
    badge: params.dateLabel.toUpperCase(),
    title,
    contextSummary: params.cardDescription,
    internalContext,
    cardDescription: params.cardDescription,
    backgroundType: 'inspired',
    conversationId: params.conversationId,
    initialUserMessage: title
      ? `Quero continuar nossa conversa sobre "${title}".`
      : 'Quero continuar essa conversa de onde parou.',
  };
}

export type HomeRecapChatTarget =
  | { kind: 'yesterday'; insight: Insight }
  | {
      kind: 'conversation';
      conversationId: string;
      title: string;
      dateLabel: string;
      cardDescription: string;
    };

export async function openHomeRecapChat(
  navigation: NavigationProp<ParamListBase>,
  recap: HomeRecapChatTarget,
) {
  const chatInsight =
    recap.kind === 'yesterday'
      ? buildYesterdayHomeRecapChatInsight(recap.insight)
      : await buildConversationRecapChatInsight(recap);

  navigateToChatTab(navigation, { chatInsight });
}
