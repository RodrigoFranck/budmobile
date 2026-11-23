/**
 * Server-driven Free chat quota (TF-111 / TF-115).
 * The app never computes remaining tokens locally — only mirrors these fields.
 *
 * Server default (23/11): `LIMITE_TOKENS_FREE_MES` = 250_000
 *   ≈ P75 deep conversation (~30 text turns) + 20% · or ~20 min voice
 * Voice conversion on server: 12_500 tokens / connected minute
 */

export type FreeChatQuota = {
  /** Whether Free may send text / start voice this cycle. */
  chatLiberado: boolean;
  /** Remaining share of the monthly Free chat quota, 0–100. Never shown as a number. */
  cotaRestantePct: number;
  /** Next renewal instant (ISO). Display as DD/MM in BRT. */
  renovaEm: string | null;
};

export const EMPTY_FREE_CHAT_QUOTA: FreeChatQuota = {
  chatLiberado: true,
  cotaRestantePct: 100,
  renovaEm: null,
};

export const FREE_QUOTA_LOW_PCT = 20;

export function clampCotaPct(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseFreeChatQuota(raw: unknown): FreeChatQuota {
  if (!raw || typeof raw !== 'object') return EMPTY_FREE_CHAT_QUOTA;
  const row = raw as Record<string, unknown>;
  const chatLiberado = Boolean(
    row.chat_liberado ?? row.chatLiberado ?? true,
  );
  const cotaRestantePct = clampCotaPct(
    row.cota_restante_pct ?? row.cotaRestantePct ?? (chatLiberado ? 100 : 0),
  );
  const renovaRaw = row.renova_em ?? row.renovaEm ?? null;
  const renovaEm = typeof renovaRaw === 'string' && renovaRaw.trim() ? renovaRaw : null;
  return {
    chatLiberado: chatLiberado && cotaRestantePct > 0,
    cotaRestantePct: chatLiberado ? cotaRestantePct : 0,
    renovaEm,
  };
}

/** Format `renova_em` for the quota bar label: "renova em DD/MM". */
export function formatRenovaEmLabel(renovaEm: string | null, now = new Date()): string {
  const date = renovaEm ? new Date(renovaEm) : null;
  const valid = date && Number.isFinite(date.getTime()) ? date : now;
  const dd = String(valid.getDate()).padStart(2, '0');
  const mm = String(valid.getMonth() + 1).padStart(2, '0');
  return `renova em ${dd}/${mm}`;
}

export function isFreeQuotaLow(cotaRestantePct: number): boolean {
  return cotaRestantePct > 0 && cotaRestantePct <= FREE_QUOTA_LOW_PCT;
}
