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
  'liga agora para o cvv',
  'ligar agora para o cvv',
  'me importo com você',
  'pode te ajudar de verdade',
  'não precisa carregar',
  'não precisa carregar sozinha',
  'não precisa carregar sozinho',
];

const STRONG_SAFETY_SIGNALS = [
  '188',
  'cvv.org.br',
  'liga agora para o cvv',
  'ligar agora para o cvv',
  'liga 188',
  'liga pro 188',
];

export function isSafetyResponse(content: string): boolean {
  const lowerContent = content.toLowerCase();
  if (STRONG_SAFETY_SIGNALS.some((pattern) => lowerContent.includes(pattern.toLowerCase()))) {
    return true;
  }
  const matchCount = SAFETY_PATTERNS.filter((pattern) =>
    lowerContent.includes(pattern.toLowerCase()),
  ).length;
  return matchCount >= 2;
}
