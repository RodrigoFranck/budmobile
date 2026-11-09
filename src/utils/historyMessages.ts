import { isChatImageContent } from '@/utils/chatImageMessage';

export type HistoryMessageLike = {
  role: string;
  content: string | null | undefined;
};

/** True when the message can be shown in History day detail (text, photo, or context card). */
export function isDisplayableHistoryMessage(message: HistoryMessageLike): boolean {
  if (message.role === 'context') {
    return Boolean(message.content?.trim());
  }

  if (message.role !== 'user' && message.role !== 'assistant') {
    return false;
  }

  const content = message.content ?? '';
  if (isChatImageContent(content)) {
    return true;
  }

  return content.trim().length > 0;
}

/** Counts user/assistant turns that have visible content (excludes empty voice stubs and context). */
export function countDisplayableHistoryTurns(messages: HistoryMessageLike[]): number {
  return messages.filter(
    (message) =>
      (message.role === 'user' || message.role === 'assistant') &&
      isDisplayableHistoryMessage(message),
  ).length;
}
