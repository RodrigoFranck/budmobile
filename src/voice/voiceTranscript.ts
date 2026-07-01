export const VOICE_RESUME_WINDOW_MS = 3 * 60 * 1000;

export interface VoiceTranscriptMessage {
  role: 'user' | 'assistant' | 'context';
  content: string;
  createdAt?: string;
}

export function getResumableAssistantTranscript(
  messages: VoiceTranscriptMessage[],
  now = Date.now(),
): string {
  const conversationMessages = messages.filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  );
  if (conversationMessages.length === 0) {
    return '';
  }

  const lastUserMessage = [...conversationMessages]
    .reverse()
    .find((message) => message.role === 'user' && message.content.trim());
  if (!lastUserMessage?.createdAt) {
    return '';
  }

  const lastUserAt = new Date(lastUserMessage.createdAt).getTime();
  if (Number.isNaN(lastUserAt) || now - lastUserAt > VOICE_RESUME_WINDOW_MS) {
    return '';
  }

  const lastAssistantMessage = [...conversationMessages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim());

  return lastAssistantMessage?.content.trim() ?? '';
}
