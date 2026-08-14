import {
  resolveInsightVisualCategory,
  type InsightVisualCategory,
} from '@/constants/insightCategoryTheme';
import type { ChatInsightParam } from '@/types/chatInsight';

export type InsightContextCardData = {
  badge: string;
  title: string;
  description?: string;
  category: InsightVisualCategory;
};

type InsightContextPayload = {
  badge?: unknown;
  title?: unknown;
  description?: unknown;
  insightType?: unknown;
  backgroundType?: unknown;
  category?: unknown;
};

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function serializeInsightContextMessage(insight: ChatInsightParam): string {
  const title = insight.title.trim();
  const description =
    insight.cardDescription?.trim() ||
    insight.contextSummary?.trim() ||
    title;
  const category = resolveInsightVisualCategory({
    insightType: insight.insightType,
    backgroundType: insight.backgroundType,
  });

  const payload = {
    badge: insight.badge?.trim() || 'INSIGHT',
    title,
    description,
    insightType: insight.insightType,
    backgroundType: insight.backgroundType,
    category,
  };

  return JSON.stringify(payload);
}

export function parseInsightContextMessage(content: string): InsightContextCardData | null {
  try {
    const parsed = JSON.parse(content) as InsightContextPayload;
    const title = asNonEmptyString(parsed.title);
    const description = asNonEmptyString(parsed.description);
    if (!title && !description) {
      return null;
    }

    return {
      badge: asNonEmptyString(parsed.badge) || 'INSIGHT',
      title: title || description || 'INSIGHT',
      ...(description ? { description } : {}),
      category: resolveInsightVisualCategory({
        category: asNonEmptyString(parsed.category),
        insightType: asNonEmptyString(parsed.insightType),
        backgroundType: asNonEmptyString(parsed.backgroundType),
      }),
    };
  } catch {
    return null;
  }
}

export function isUserMessageAfterContext(
  messages: Array<{ role: string }>,
  index: number,
): boolean {
  const message = messages[index];
  if (message?.role !== 'user') {
    return false;
  }

  return messages[index - 1]?.role === 'context';
}
