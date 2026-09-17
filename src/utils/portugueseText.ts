/**
 * Client-side Portuguese accent sanitizer for assistant chat replies.
 * Mirrors budmind `_shared/insightPortuguese.ts` safe replacements.
 * Only unambiguous unaccented forms — never "esta"→"está" (demonstrative).
 */

const ACCENT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bvoce\b/gi, 'você'],
  [/\bvc\b/gi, 'você'],
  [/\bnao\b/gi, 'não'],
  [/\btambem\b/gi, 'também'],
  [/\btb\b/gi, 'também'],
  [/\bestao\b/gi, 'estão'],
  [/\bpadroes\b/gi, 'padrões'],
  [/\bpadrao\b/gi, 'padrão'],
  [/\bhabito\b/gi, 'hábito'],
  [/\bhabitos\b/gi, 'hábitos'],
  [/\bconstancia\b/gi, 'constância'],
  [/\bcobranca\b/gi, 'cobrança'],
  [/\bcobrancas\b/gi, 'cobranças'],
  [/\bsugestao\b/gi, 'sugestão'],
  [/\bsugestoes\b/gi, 'sugestões'],
  [/\bultimo\b/gi, 'último'],
  [/\bultimos\b/gi, 'últimos'],
  [/\bultima\b/gi, 'última'],
  [/\bultimas\b/gi, 'últimas'],
  [/\bproximo\b/gi, 'próximo'],
  [/\bproxima\b/gi, 'próxima'],
  [/\bproximos\b/gi, 'próximos'],
  [/\bproximas\b/gi, 'próximas'],
  [/\bpercepcao\b/gi, 'percepção'],
  [/\bfrequencia\b/gi, 'frequência'],
  [/\breflexao\b/gi, 'reflexão'],
  [/\bobservacao\b/gi, 'observação'],
  [/\bhistoria\b/gi, 'história'],
  [/\bexperiencia\b/gi, 'experiência'],
  [/\bexperiencias\b/gi, 'experiências'],
  [/\bcoracao\b/gi, 'coração'],
  [/\bemocao\b/gi, 'emoção'],
  [/\bemocoes\b/gi, 'emoções'],
  [/\batencao\b/gi, 'atenção'],
  [/\bsituacao\b/gi, 'situação'],
  [/\bsituacoes\b/gi, 'situações'],
  [/\bsensacao\b/gi, 'sensação'],
  [/\bsensacoes\b/gi, 'sensações'],
  [/\bpressao\b/gi, 'pressão'],
  [/\btensao\b/gi, 'tensão'],
  [/\bopcao\b/gi, 'opção'],
  [/\bopcoes\b/gi, 'opções'],
  [/\bdecisao\b/gi, 'decisão'],
  [/\bdecisoes\b/gi, 'decisões'],
  [/\brelacao\b/gi, 'relação'],
  [/\brelacoes\b/gi, 'relações'],
  [/\bconversacao\b/gi, 'conversação'],
  [/\bingles\b/gi, 'inglês'],
  [/\bportugues\b/gi, 'português'],
  [/\bfacil\b/gi, 'fácil'],
  [/\bdificil\b/gi, 'difícil'],
  [/\bpossivel\b/gi, 'possível'],
  [/\bimpossivel\b/gi, 'impossível'],
  [/\bnecessario\b/gi, 'necessário'],
  [/\bnecessaria\b/gi, 'necessária'],
  [/\bnumero\b/gi, 'número'],
  [/\bnumeros\b/gi, 'números'],
  [/\barea\b/gi, 'área'],
  [/\bmemoria\b/gi, 'memória'],
  [/\bmemorias\b/gi, 'memórias'],
  [/\bcarater\b/gi, 'caráter'],
  [/\borganizacao\b/gi, 'organização'],
  [/\bconfusao\b/gi, 'confusão'],
  [/\binseguranca\b/gi, 'insegurança'],
  [/\bseguranca\b/gi, 'segurança'],
  [/\bpaciencia\b/gi, 'paciência'],
  [/\bimpaciencia\b/gi, 'impaciência'],
  [/\bconsciencia\b/gi, 'consciência'],
  [/\bexistencia\b/gi, 'existência'],
  [/\bresistencia\b/gi, 'resistência'],
  [/\bpresenca\b/gi, 'presença'],
  [/\bausencia\b/gi, 'ausência'],
  [/\bviolencia\b/gi, 'violência'],
  [/\btolerancia\b/gi, 'tolerância'],
  [/\bimportancia\b/gi, 'importância'],
  [/\bdiferenca\b/gi, 'diferença'],
  [/\bdiferencas\b/gi, 'diferenças'],
  [/\bpreferencia\b/gi, 'preferência'],
  [/\breferencia\b/gi, 'referência'],
  [/\binfluencia\b/gi, 'influência'],
  [/\bconfianca\b/gi, 'confiança'],
  [/\besperanca\b/gi, 'esperança'],
  [/\bcrianca\b/gi, 'criança'],
  [/\bcriancas\b/gi, 'crianças'],
  [/\bcabeca\b/gi, 'cabeça'],
  [/\bcomeca\b/gi, 'começa'],
  [/\bcomeco\b/gi, 'começo'],
  [/\bcomecou\b/gi, 'começou'],
  [/\bcomecar\b/gi, 'começar'],
];

/** Preserve original capitalization of the matched token. */
function matchCase(source: string, replacement: string): string {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Fix common missing accents in Portuguese assistant text.
 * Safe for final chat replies; do not apply to mid-stream partial tokens.
 */
export function fixPortugueseAccents(text: string): string {
  if (!text) return text;

  let result = text;
  for (const [regex, replacement] of ACCENT_REPLACEMENTS) {
    result = result.replace(regex, (match) => matchCase(match, replacement));
    regex.lastIndex = 0;
  }
  return result;
}

/**
 * Sanitize assistant reply before UI persist: accents + strip leaked markdown markers.
 */
export function sanitizeAssistantPortuguese(text: string): string {
  let result = fixPortugueseAccents(text.trim());

  // Prompt forbids markdown; strip common leaks without rewriting content.
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/(^|[^\w*])\*([^*\n]+)\*(?=[^\w*]|$)/g, '$1$2');
  result = result.replace(/^#{1,6}\s+/gm, '');

  return result;
}
