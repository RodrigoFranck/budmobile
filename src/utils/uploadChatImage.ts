import { supabase } from '@/integrations/supabase/client';
import {
  CHAT_IMAGE_BUCKET,
  encodeChatImageContent,
  inlineChatImageContent,
} from '@/utils/chatImageMessage';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export async function storeChatImage({
  userId,
  conversationId,
  base64,
}: {
  userId: string;
  conversationId: string;
  base64: string;
}): Promise<string | null> {
  const fileName = `${Date.now()}.jpg`;
  const storagePath = `${userId}/${conversationId}/${fileName}`;

  try {
    const { error } = await supabase.storage.from(CHAT_IMAGE_BUCKET).upload(
      storagePath,
      base64ToArrayBuffer(base64),
      { contentType: 'image/jpeg', upsert: false },
    );
    if (!error) return encodeChatImageContent(storagePath);
    console.warn('[chat] image upload failed', error.message);
  } catch (error) {
    console.warn('[chat] image upload failed', error);
  }

  return inlineChatImageContent(base64);
}
