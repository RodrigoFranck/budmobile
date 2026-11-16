export type InsightContextVariant = 'letter' | 'activity' | 'start';

export type InsightActivityType =
  | 'fiee'
  | 'cinco_porques'
  | 'valores'
  | 'mapa_relacoes'
  | 'unknown';

export function resolveInsightContextVariant(params: {
  variant?: string | null;
  insightType?: string | null;
  backgroundType?: string | null;
}): InsightContextVariant {
  const variant = params.variant?.trim();
  if (variant === 'letter' || variant === 'activity' || variant === 'start') {
    return variant;
  }

  const insightType = (params.insightType ?? '').trim().toLowerCase();
  if (
    insightType === 'letter' ||
    insightType === 'carta' ||
    insightType === 'daily_letter' ||
    insightType.startsWith('letter_')
  ) {
    return 'letter';
  }

  if (insightType.startsWith('activity_') || insightType.includes('fiee') || insightType.includes('porqu')) {
    return 'activity';
  }

  if (
    insightType.includes('valores') ||
    insightType.includes('mapa') ||
    insightType.includes('relac')
  ) {
    return 'activity';
  }

  return 'start';
}

export function resolveInsightActivityType(
  insightType?: string | null,
): InsightActivityType {
  const raw = (insightType ?? '').trim().toLowerCase();
  if (raw.includes('fiee')) return 'fiee';
  if (raw.includes('porqu')) return 'cinco_porques';
  if (raw.includes('valor')) return 'valores';
  if (raw.includes('mapa') || raw.includes('relac')) return 'mapa_relacoes';
  return 'unknown';
}
