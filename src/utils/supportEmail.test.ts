import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSupportEmailPayload,
  estimateBase64Bytes,
  isAllowedScreenshotType,
  normalizeScreenshotContent,
  sanitizeScreenshotFilename,
  validateSupportScreenshot,
} from './supportEmail';

test('strips a data URL prefix from screenshot content', () => {
  assert.equal(normalizeScreenshotContent('data:image/png;base64,abc123'), 'abc123');
  assert.equal(normalizeScreenshotContent(' a b c '), 'abc');
});

test('accepts image mime types used by the photo picker', () => {
  assert.equal(isAllowedScreenshotType('image/jpeg'), true);
  assert.equal(isAllowedScreenshotType('image/png'), true);
  assert.equal(isAllowedScreenshotType('application/pdf'), false);
});

test('sanitizes screenshot filenames and keeps a safe extension', () => {
  assert.equal(sanitizeScreenshotFilename('Print da carta.png', 'image/png'), 'Print-da-carta.png');
  assert.equal(sanitizeScreenshotFilename('../../secret', 'image/jpeg'), 'secret.jpg');
  assert.equal(sanitizeScreenshotFilename(undefined, 'image/webp'), 'print.webp');
});

test('estimates decoded base64 size', () => {
  assert.equal(estimateBase64Bytes('YQ=='), 1);
  assert.equal(estimateBase64Bytes('data:image/png;base64,YQ=='), 1);
});

test('rejects missing or oversized screenshots', () => {
  assert.equal(validateSupportScreenshot(null), null);
  assert.equal(
    validateSupportScreenshot({
      filename: 'print.pdf',
      contentType: 'application/pdf',
      content: 'YQ==',
    }),
    'O print precisa ser uma imagem (jpg, png, webp ou heic).',
  );
});

test('builds the edge-function payload with topic, reply-to and screenshot', () => {
  const payload = buildSupportEmailPayload({
    message: '  A carta não abriu.  ',
    topic: 'Problema',
    replyTo: 'marina@email.com',
    appVersion: '2.0.20',
    platform: 'ios',
    screenshot: {
      filename: 'print da carta.PNG',
      contentType: 'image/png',
      content: 'data:image/png;base64,YQ==',
    },
  });

  assert.deepEqual(payload, {
    message: 'A carta não abriu.',
    topic: 'Problema',
    replyTo: 'marina@email.com',
    appVersion: '2.0.20',
    platform: 'ios',
    screenshot: {
      filename: 'print-da-carta.png',
      contentType: 'image/png',
      content: 'YQ==',
    },
  });
});
