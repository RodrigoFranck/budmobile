export const SUPPORT_MESSAGE_MAX_LENGTH = 4000;
export const SUPPORT_SCREENSHOT_MAX_BYTES = 4 * 1024 * 1024;

export const SUPPORT_SCREENSHOT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
] as const;

export type SupportScreenshotType = (typeof SUPPORT_SCREENSHOT_TYPES)[number];

export type SupportScreenshot = {
  filename: string;
  contentType: string;
  content: string;
};

const DATA_URL_PREFIX = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,/i;

export function normalizeScreenshotContent(content: string): string {
  return content.replace(/\s/g, '').replace(DATA_URL_PREFIX, '');
}

export function isAllowedScreenshotType(contentType: string): contentType is SupportScreenshotType {
  return (SUPPORT_SCREENSHOT_TYPES as readonly string[]).includes(contentType.toLowerCase());
}

export function estimateBase64Bytes(content: string): number {
  const padded = normalizeScreenshotContent(content);
  if (!padded) return 0;
  const padding = padded.endsWith('==') ? 2 : padded.endsWith('=') ? 1 : 0;
  return Math.floor((padded.length * 3) / 4) - padding;
}

export function screenshotExtension(contentType: string): string {
  const type = contentType.toLowerCase();
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/gif') return 'gif';
  if (type === 'image/heic' || type === 'image/heif') return 'heic';
  return 'jpg';
}

export function sanitizeScreenshotFilename(filename: string | undefined, contentType: string): string {
  const extension = screenshotExtension(contentType);
  const raw = (filename ?? '').split(/[/\\]/).pop() ?? '';
  const stem = raw.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 60);
  return `${stem || 'print'}.${extension}`;
}

export function validateSupportScreenshot(
  screenshot: SupportScreenshot | null | undefined,
): string | null {
  if (!screenshot) return null;
  const contentType = screenshot.contentType.trim().toLowerCase();
  if (!isAllowedScreenshotType(contentType)) {
    return 'O print precisa ser uma imagem (jpg, png, webp ou heic).';
  }
  const content = normalizeScreenshotContent(screenshot.content);
  if (!content) {
    return 'Não foi possível ler o print. Tente outra imagem.';
  }
  if (estimateBase64Bytes(content) > SUPPORT_SCREENSHOT_MAX_BYTES) {
    return 'O print está grande demais. Escolha outra imagem.';
  }
  return null;
}

export function buildSupportEmailPayload({
  message,
  topic,
  replyTo,
  appVersion,
  platform,
  screenshot,
}: {
  message: string;
  topic?: string | null;
  replyTo?: string | null;
  appVersion?: string;
  platform?: string;
  screenshot?: SupportScreenshot | null;
}) {
  const trimmedMessage = message.trim();
  const payload: {
    message: string;
    topic?: string;
    replyTo?: string;
    appVersion?: string;
    platform?: string;
    screenshot?: SupportScreenshot;
  } = { message: trimmedMessage };

  const trimmedTopic = topic?.trim();
  if (trimmedTopic) payload.topic = trimmedTopic;

  const trimmedReplyTo = replyTo?.trim();
  if (trimmedReplyTo) payload.replyTo = trimmedReplyTo;

  if (appVersion) payload.appVersion = appVersion;
  if (platform) payload.platform = platform;

  if (screenshot) {
    const contentType = screenshot.contentType.trim().toLowerCase();
    payload.screenshot = {
      filename: sanitizeScreenshotFilename(screenshot.filename, contentType),
      contentType,
      content: normalizeScreenshotContent(screenshot.content),
    };
  }

  return payload;
}
