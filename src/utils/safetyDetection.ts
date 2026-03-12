const SAFETY_PATTERNS = [
  '188',
  'cvv.org.br',
  'CVV',
  'tirar a própria vida',
  'se machucar',
  'Você corre perigo',
  'Centro de Valorização da Vida',
  'não deve ficar sozinho',
  'liga 188',
  'liga pro 188',
];

export function isSafetyResponse(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const matchCount = SAFETY_PATTERNS.filter((pattern) =>
    lowerContent.includes(pattern.toLowerCase()),
  ).length;
  return matchCount >= 2;
}
