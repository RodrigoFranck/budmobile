import { estimateBase64Bytes } from '@/utils/supportEmail';

export const CHAT_IMAGE_MARKER = '[[foto]]';
export const CHAT_IMAGE_BUCKET = 'chat-images';
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_IMAGE_HISTORY_TEXT = 'A pessoa enviou uma foto.';
export const CHAT_IMAGE_LOOK_CUE =
  'Estou te mostrando uma foto. Olhe para ela e responda sobre o que vê, falando de mim. Não trate a imagem como uma pergunta sobre você.';

const STORAGE_PATH_RE =
  /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i;

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatApiContent = string | ChatContentPart[];

export type ChatGalleryImage = {
  uri: string;
  base64: string;
  mimeType: string;
};

export function encodeChatImageContent(storagePath: string): string {
  return `${CHAT_IMAGE_MARKER}${storagePath}`;
}

export function parseChatImageContent(content: string): { storagePath: string } | null {
  if (!content.startsWith(CHAT_IMAGE_MARKER)) return null;
  const storagePath = content.slice(CHAT_IMAGE_MARKER.length).trim();
  if (!STORAGE_PATH_RE.test(storagePath)) return null;
  return { storagePath };
}

export function isChatImageContent(content: string): boolean {
  return content.startsWith('data:image/') || content.startsWith(CHAT_IMAGE_MARKER);
}

export function chatMessageTextForModel(content: string): string {
  if (isChatImageContent(content)) return CHAT_IMAGE_HISTORY_TEXT;
  return content;
}

export function chatImageDataUrl(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function buildChatImageApiContent(base64: string): ChatContentPart[] {
  return [
    { type: 'text', text: CHAT_IMAGE_LOOK_CUE },
    { type: 'image_url', image_url: { url: chatImageDataUrl(base64) } },
  ];
}

export function validateChatGalleryImage(image: {
  base64: string;
  mimeType?: string | null;
}): string | null {
  const mime = (image.mimeType ?? 'image/jpeg').toLowerCase();
  if (!mime.startsWith('image/')) {
    return 'Escolha uma foto da galeria.';
  }
  if (!image.base64.trim()) {
    return 'Não foi possível ler a foto. Tente outra imagem.';
  }
  if (estimateBase64Bytes(image.base64) > CHAT_IMAGE_MAX_BYTES) {
    return 'A foto está grande demais. Escolha outra imagem.';
  }
  return null;
}

export function inlineChatImageContent(base64: string): string | null {
  if (estimateBase64Bytes(base64) > CHAT_IMAGE_MAX_BYTES) return null;
  return chatImageDataUrl(base64);
}
