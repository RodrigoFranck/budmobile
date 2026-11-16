import * as SecureStore from 'expo-secure-store';

export type HealthSurveyDraft = {
  answers: Record<string, string>;
  index: number;
  phase: 'intro' | 'questions' | 'thanks';
  updatedAt: string;
};

function storageKey(userId: string) {
  return `health_survey_draft_${userId}`;
}

export async function readHealthSurveyDraft(userId: string): Promise<HealthSurveyDraft | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HealthSurveyDraft>;
    if (!parsed.answers || typeof parsed.answers !== 'object') return null;
    if (typeof parsed.index !== 'number' || !Number.isFinite(parsed.index)) return null;
    if (parsed.phase !== 'intro' && parsed.phase !== 'questions' && parsed.phase !== 'thanks') {
      return null;
    }
    return {
      answers: parsed.answers,
      index: Math.max(0, Math.floor(parsed.index)),
      phase: parsed.phase,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function writeHealthSurveyDraft(
  userId: string,
  draft: Omit<HealthSurveyDraft, 'updatedAt'>,
): Promise<void> {
  try {
    const payload: HealthSurveyDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(payload));
  } catch {
    // Draft is best-effort until the server confirms.
  }
}

export async function clearHealthSurveyDraft(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId));
  } catch {
    // ignore
  }
}
