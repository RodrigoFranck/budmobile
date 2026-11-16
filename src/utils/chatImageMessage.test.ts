import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CHAT_IMAGE_HISTORY_TEXT,
  CHAT_IMAGE_LOOK_CUE,
  buildChatImageApiContent,
  chatMessageTextForModel,
  encodeChatImageContent,
  inlineChatImageContent,
  parseChatImageContent,
  validateChatGalleryImage,
} from './chatImageMessage';

const PATH = '11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/1.jpg';

test('stores a private gallery path the bubble can read back', () => {
  const content = encodeChatImageContent(PATH);
  assert.equal(parseChatImageContent(content)?.storagePath, PATH);
  assert.equal(chatMessageTextForModel(content), CHAT_IMAGE_HISTORY_TEXT);
});

test('keeps ordinary text unchanged for the model', () => {
  assert.equal(chatMessageTextForModel('dormi mal'), 'dormi mal');
  assert.equal(parseChatImageContent('dormi mal'), null);
});

test('rejects path traversal and leaves the photo out of later turns as pixels', () => {
  assert.equal(parseChatImageContent('[[foto]]../secret.jpg'), null);
  assert.equal(
    chatMessageTextForModel('data:image/jpeg;base64,aaaa'),
    CHAT_IMAGE_HISTORY_TEXT,
  );
});

test('sends the current photo for the model to look at', () => {
  const content = buildChatImageApiContent('abc');
  assert.equal(content[0].type, 'text');
  assert.equal(content[0].type === 'text' ? content[0].text : '', CHAT_IMAGE_LOOK_CUE);
  assert.equal(
    content[1].type === 'image_url' ? content[1].image_url.url : '',
    'data:image/jpeg;base64,abc',
  );
});

test('rejects an empty or oversized photo', () => {
  assert.equal(
    validateChatGalleryImage({ base64: '', mimeType: 'image/jpeg' }),
    'Não foi possível ler a foto. Tente outra imagem.',
  );
  assert.equal(validateChatGalleryImage({ base64: 'abcd', mimeType: 'application/pdf' }), 'Escolha uma foto da galeria.');
  assert.equal(inlineChatImageContent('abcd'), 'data:image/jpeg;base64,abcd');
});
