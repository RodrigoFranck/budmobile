import { Platform } from 'react-native';

import { supabase } from '@/integrations/supabase/client';
import {
  buildSupportEmailPayload,
  SUPPORT_MESSAGE_MAX_LENGTH,
  type SupportScreenshot,
  validateSupportScreenshot,
} from '@/utils/supportEmail';

export type SendSupportEmailInput = {
  message: string;
  topic?: string | null;
  replyTo?: string | null;
  appVersion?: string;
  screenshot?: SupportScreenshot | null;
};

async function resolveFunctionsError(
  error: { message?: string; context?: unknown } | null,
  response?: Response | null,
): Promise<string> {
  const fallback = error?.message || 'Não foi possível enviar sua mensagem. Tente novamente.';
  const errorContext =
    response ??
    (typeof error === 'object' && error !== null && 'context' in error && error.context instanceof Response
      ? error.context
      : null);

  if (!errorContext) return fallback;

  try {
    const body = (await errorContext.clone().json()) as { error?: string; message?: string };
    if (body.error) return body.error;
    if (body.message) return body.message;
  } catch {
    // keep default message
  }

  if (fallback.includes('non-2xx')) {
    return 'Não foi possível enviar sua mensagem. Tente novamente.';
  }

  return fallback;
}

export async function sendSupportEmail(input: SendSupportEmailInput): Promise<void> {
  const message = input.message.trim();
  if (!message) {
    throw new Error('Escreva uma mensagem antes de enviar.');
  }
  if (message.length > SUPPORT_MESSAGE_MAX_LENGTH) {
    throw new Error(`A mensagem deve ter no máximo ${SUPPORT_MESSAGE_MAX_LENGTH} caracteres.`);
  }

  const screenshotError = validateSupportScreenshot(input.screenshot);
  if (screenshotError) {
    throw new Error(screenshotError);
  }

  const { data, error, response } = await supabase.functions.invoke('send-support-email', {
    body: buildSupportEmailPayload({
      message,
      topic: input.topic,
      replyTo: input.replyTo,
      appVersion: input.appVersion,
      platform: Platform.OS,
      screenshot: input.screenshot,
    }),
  });

  if (error) {
    throw new Error(await resolveFunctionsError(error, response));
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
}
