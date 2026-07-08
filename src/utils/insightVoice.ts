const BUD_FIRST_PERSON_PATTERNS: RegExp[] = [
  /\b(?:^|[.!?]\s*)(?:eu)\s+(?:percebo|percebi|notei|vejo|vi|sinto|observo)\b/gi,
  /\b(?:notei|percebo|percebi|vejo|vi|sinto|observo)\s+que\s+(?:voce|você)\b/gi,
  /\b(?:^|[.!?]\s*)(?:notei|percebo|percebi|vejo|sinto)\b/gi,
  /\bconsigo\s+ver\b/gi,
];

const MISSING_ACCENT_PATTERNS: RegExp[] = [
  /\bvoce\b/i,
  /\bnao\b/i,
  /\btambem\b/i,
  /\bestao\b/i,
  /\bpadroes\b/i,
  /\bhabito\b/i,
  /\bcobranca\b/i,
  /\bcobrancas\b/i,
];

function hasMissingAccents(text: string): boolean {
  return MISSING_ACCENT_PATTERNS.some((pattern) => {
    const matched = pattern.test(text);
    pattern.lastIndex = 0;
    return matched;
  });
}

function hasBudFirstPerson(text: string): boolean {
  return BUD_FIRST_PERSON_PATTERNS.some((pattern) => {
    const matched = pattern.test(text);
    pattern.lastIndex = 0;
    return matched;
  });
}

export function insightNeedsAccentRefresh(title: string, description: string): boolean {
  return hasMissingAccents(`${title}\n${description}`);
}

export function insightNeedsVoiceRefresh(
  title: string,
  description: string,
  insightType?: string,
): boolean {
  const combined = `${title}\n${description}`.trim();
  if (!combined) {
    return false;
  }

  if (insightNeedsAccentRefresh(title, description)) {
    return true;
  }

  if (insightType === 'yesterday_journey') {
    return false;
  }

  return hasBudFirstPerson(combined);
}

export function deepInsightNeedsVoiceRefresh(insight: {
  headline: string;
  intro: string;
  what_i_noticed?: { title?: string; content?: string };
  reflection?: { title?: string; content?: string };
  key_takeaway?: { title?: string; content?: string };
  next_steps?: { title?: string; content?: string };
}): boolean {
  const parts = [
    insight.headline,
    insight.intro,
    insight.what_i_noticed?.title,
    insight.what_i_noticed?.content,
    insight.reflection?.title,
    insight.reflection?.content,
    insight.key_takeaway?.title,
    insight.key_takeaway?.content,
    insight.next_steps?.title,
    insight.next_steps?.content,
  ].filter(Boolean);

  const combined = parts.join('\n');
  return hasMissingAccents(combined) || hasBudFirstPerson(combined);
}
