import { supabase } from '@/integrations/supabase/client';

type SendWelcomeEmailParams = {
  email: string;
  name?: string | null;
  userId?: string | null;
};

/**
 * Dispara o e-mail de boas-vindas (TF-82).
 * A edge function `send-auth-email` grava `welcome_sent_at` e ignora reenvios.
 * O gatilho principal é o AFTER INSERT em `profiles` (migration);
 * este helper é backup no signup por e-mail.
 */
export async function sendWelcomeEmail({
  email,
  name,
  userId,
}: SendWelcomeEmailParams): Promise<void> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-auth-email', {
      body: {
        email: trimmedEmail,
        type: 'welcome',
        name: name?.trim() || undefined,
        userId: userId || undefined,
      },
    });

    if (error) {
      console.warn('Welcome email invoke failed:', error.message);
    }
  } catch (error) {
    console.warn('Welcome email unexpected error:', error);
  }
}
