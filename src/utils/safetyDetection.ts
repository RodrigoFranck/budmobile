/**
 * Safety detection utility for CVV guardrails
 * Detects if AI response contains safety protocol indicators
 */

const SAFETY_PATTERNS = [
  "188",
  "cvv.org.br",
  "CVV",
  "tirar a própria vida",
  "se machucar",
  "Você corre perigo",
  "Centro de Valorização da Vida",
  "não deve ficar sozinho",
  "liga 188",
  "liga pro 188",
];

/**
 * Checks if content contains safety protocol indicators
 * Requires at least 2 pattern matches to avoid false positives
 */
export function isSafetyResponse(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const matchCount = SAFETY_PATTERNS.filter(pattern => 
    lowerContent.includes(pattern.toLowerCase())
  ).length;
  return matchCount >= 2;
}

