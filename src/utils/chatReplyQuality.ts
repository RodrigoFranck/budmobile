const LAST_WORD_LETTERS = /[^\p{L}]+/gu;
const HAS_VOWEL = /[aeiouáéíóúâêôãõàüAEIOUÁÉÍÓÚÂÊÔÃÕÀÜ]/;
const SINGLE_LETTER_WORD = /^[aeoéàáó]$/i;

export function isIncompleteAssistantReply(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.includes('\uFFFD')) return true;
  if (/[,:;]\s*$/.test(trimmed)) return true;
  if (/[\u2013\u2014-]\s*$/.test(trimmed)) return true;

  const quoteCount = (trimmed.match(/"/g) ?? []).length;
  if (quoteCount % 2 === 1) return true;

  const lastLine = trimmed.split('\n').filter((line) => line.trim()).pop()?.trim() ?? trimmed;
  const lastWord = lastLine.split(/\s+/).pop() ?? '';
  const letters = lastWord.replace(LAST_WORD_LETTERS, '');

  if (!letters) return false;
  if (letters.length === 1 && !SINGLE_LETTER_WORD.test(letters)) return true;
  if (letters.length >= 2 && !HAS_VOWEL.test(letters)) return true;

  return false;
}
