export function splitMessageStanzas(content: string): string[] {
  const normalized = content.trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const lines = normalized
    .split(/\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  const sentences = normalized
    .match(/[^.!?…]+[.!?…]+(?:\s+|$)|[^.!?…]+$/gu)
    ?.map((part) => part.trim())
    .filter(Boolean);

  if (sentences && sentences.length > 1) {
    return sentences;
  }

  return [normalized];
}
