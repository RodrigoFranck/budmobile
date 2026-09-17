import { LEGAL_DOCUMENTS_VERSION } from '@/constants/healthSafety';
import { supabase } from '@/integrations/supabase/client';

/**
 * Persists versioned acceptance of Terms + Privacy (LGPD audit trail).
 * Idempotent for the current LEGAL_DOCUMENTS_VERSION.
 */
export async function ensureTermsAcceptance(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  const { data: existing, error: selectError } = await supabase
    .from('user_terms_acceptance')
    .select('id')
    .eq('user_id', userId)
    .eq('accepted_version', LEGAL_DOCUMENTS_VERSION)
    .maybeSingle();

  if (selectError) {
    console.error('ensureTermsAcceptance select:', selectError.message);
    return;
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabase.from('user_terms_acceptance').insert({
    user_id: userId,
    accepted_version: LEGAL_DOCUMENTS_VERSION,
    accepted_at: new Date().toISOString(),
  });

  if (insertError) {
    // Race between parallel auth events — unique violation is fine.
    if (insertError.code === '23505') {
      return;
    }
    console.error('ensureTermsAcceptance insert:', insertError.message);
  }
}
