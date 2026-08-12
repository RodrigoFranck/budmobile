import { supabase } from '@/integrations/supabase/client';

let inFlightByConversation = new Map<string, Promise<void>>();
const lastProcessedMessageCount = new Map<string, number>();

/**
 * Runs package session-memory pipeline (summary / clinical insights / bio facts).
 * Fire-and-forget; dedupes concurrent calls per conversation.
 */
export function scheduleSessionMemory(
  conversationId: string | null | undefined,
  messageCount: number,
): void {
  if (!conversationId || messageCount < 10) return;

  const lastCount = lastProcessedMessageCount.get(conversationId) ?? 0;
  // Re-run at 10, then every +10 messages
  if (messageCount < lastCount + 10 && lastCount > 0) return;
  if (inFlightByConversation.has(conversationId)) return;

  const promise = (async () => {
    try {
      const { error } = await supabase.functions.invoke('process-session-memory', {
        body: { conversationId },
      });
      if (error) {
        console.warn('Session memory failed:', error.message);
        return;
      }
      lastProcessedMessageCount.set(conversationId, messageCount);
    } catch (error) {
      console.warn('Session memory failed:', error);
    } finally {
      inFlightByConversation.delete(conversationId);
    }
  })();

  inFlightByConversation.set(conversationId, promise);
}
