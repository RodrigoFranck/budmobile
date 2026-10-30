import { Platform } from 'react-native';

import {
  buildNetlifySupportFields,
  NETLIFY_SUPPORT_FORM_ENDPOINT,
  SUPPORT_MESSAGE_MAX_LENGTH,
  type SupportScreenshot,
  validateSupportScreenshot,
} from '@/utils/supportEmail';

export type SendSupportEmailInput = {
  message: string;
  topic?: string | null;
  replyTo?: string | null;
  name?: string | null;
  appVersion?: string;
  screenshot?: SupportScreenshot | null;
};

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

  const body = new URLSearchParams(
    buildNetlifySupportFields({
      message,
      topic: input.topic,
      replyTo: input.replyTo,
      name: input.name,
      appVersion: input.appVersion,
      platform: Platform.OS,
      screenshotFilename: input.screenshot?.filename,
    }),
  );

  const response = await fetch(NETLIFY_SUPPORT_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Não foi possível enviar sua mensagem. Tente novamente.');
  }
}
