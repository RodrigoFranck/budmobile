import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Activity, CreditCard, KeyRound, Mail, MessageSquare, Trash2 } from 'lucide-react-native';

import { useAppAlert } from '@/contexts/AppAlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppAudience } from '@/hooks/useAppAudience';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useV3Preferences } from '@/hooks/useV3Preferences';
import { supabase } from '@/integrations/supabase/client';
import { PASSWORD_RESET_REDIRECT } from '@/constants/auth';
import {
  BudToggle,
  MenuHeader,
  PrefGroup,
  PrefRow,
  ScreenScaffold,
  SectionLabel,
} from '@/pages/menu/menuUi';
import { fonts, useV3Colors } from '@/theme';
import type { MainTabNavigationProp } from '@/types/navigation';

function providerLabel(user: { app_metadata?: { provider?: string }; identities?: { provider?: string }[] } | null) {
  const provider = user?.app_metadata?.provider ?? user?.identities?.[0]?.provider;
  if (provider === 'apple') return 'Entrou com Apple';
  if (provider === 'google') return 'Entrou com Google';
  return 'Entrou com e-mail';
}

export default function AccountScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { showAlert } = useAppAlert();
  const { user } = useAuth();
  const { values, persist } = useV3Preferences();
  const { planId, status, isSubscribed, manageSubscription } = useUserPlan();
  const { can } = useAppAudience();
  const [sendingReset, setSendingReset] = useState(false);
  const [shareConversations, setShareConversations] = useState(values.shareConversations);
  const [shareResearch, setShareResearch] = useState(values.shareResearch);
  const planLabel = planId === 'free' || status === 'free' ? 'Grátis' : 'Premium';
  const showPaywall = can('paywall');

  useEffect(() => {
    setShareConversations(values.shareConversations);
  }, [values.shareConversations]);

  useEffect(() => {
    setShareResearch(values.shareResearch);
  }, [values.shareResearch]);

  const persistConsent = useCallback(
    async (key: 'shareConversations' | 'shareResearch', next: boolean) => {
      const setLocal = key === 'shareConversations' ? setShareConversations : setShareResearch;
      setLocal(next);
      try {
        await persist({ [key]: next });
      } catch {
        setLocal(!next);
        showAlert({ title: 'Não consegui salvar', message: 'Tente novamente.' });
      }
    },
    [persist, showAlert],
  );

  const handlePassword = useCallback(async () => {
    if (!user?.email) {
      showAlert({ title: 'Erro', message: 'Não encontramos um e-mail nesta conta.' });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: PASSWORD_RESET_REDIRECT,
      });
      if (error) {
        showAlert({ title: 'Erro', message: error.message });
        return;
      }
      showAlert({
        title: 'Verifique seu e-mail',
        message: `Enviamos um link para alterar a senha em ${user.email}.`,
      });
    } finally {
      setSendingReset(false);
    }
  }, [showAlert, user?.email]);

  return (
    <ScreenScaffold>
      <MenuHeader title="Conta e dados" onBack={() => navigation.goBack()} />
      <PrefGroup style={{ marginTop: 16 }}>
        <PrefRow
          icon={Mail}
          label={user?.email ?? '—'}
          hint={providerLabel(user)}
        />
        <PrefRow
          icon={KeyRound}
          label={sendingReset ? 'Enviando…' : 'Alterar senha'}
          last={!showPaywall}
          onPress={() => void handlePassword()}
        />
        {showPaywall ? (
          <PrefRow
            icon={CreditCard}
            label="Assinatura"
            value={planLabel}
            last
            onPress={() => {
              if (isSubscribed) {
                void manageSubscription().catch(() => {
                  showAlert({
                    title: 'Não foi possível abrir a assinatura',
                    message: 'Tente de novo pela loja do celular.',
                  });
                });
                return;
              }
              navigation.navigate('Paywall');
            }}
          />
        ) : null}
      </PrefGroup>

      <SectionLabel label="Privacidade e pesquisa" style={{ marginTop: 22 }} />
      <PrefGroup style={{ marginTop: 10 }}>
        <PrefRow
          icon={MessageSquare}
          label="Compartilhar conversas"
          hint="De forma anônima, para melhorar o Bud"
          trailing={
            <BudToggle
              value={shareConversations}
              onValueChange={(next) => void persistConsent('shareConversations', next)}
              accessibilityLabel="Compartilhar conversas"
            />
          }
        />
        <PrefRow
          icon={Activity}
          label="Usar respostas em pesquisa"
          hint="Pesquisas e atividades, sem identificar você"
          last
          trailing={
            <BudToggle
              value={shareResearch}
              onValueChange={(next) => void persistConsent('shareResearch', next)}
              accessibilityLabel="Usar respostas em pesquisa"
            />
          }
        />
      </PrefGroup>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          lineHeight: 19,
          color: colors.text3,
          marginTop: 12,
          paddingHorizontal: 4,
        }}
      >
        Nada disso identifica você. Dá para mudar quando quiser, e o que já foi usado sai no próximo ciclo.
      </Text>
      <PrefGroup style={{ marginTop: 16 }}>
        <PrefRow
          icon={Trash2}
          label="Excluir minha conta"
          last
          onPress={() => navigation.navigate('DeleteAccount')}
        />
      </PrefGroup>
    </ScreenScaffold>
  );
}
