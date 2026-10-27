import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, CreditCard, Trash2, User } from 'lucide-react-native';

import { BudButton } from '@/components/v3';
import { useAppAlert } from '@/contexts/AppAlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTabScreenContext } from '@/contexts/TabScreenContext';
import { clearAccountDeletedName, setAccountDeletedName } from '@/pages/menu/accountDeletedGate';
import { AccentTitle, MenuHeader, ScreenScaffold } from '@/pages/menu/menuUi';
import { fonts, useV3Colors } from '@/theme';

const POINTS = [
  {
    icon: Trash2,
    text: 'Suas conversas, cartas, atividades e pesquisas são apagadas em até 30 dias. Não dá para desfazer.',
  },
  {
    icon: CreditCard,
    text: 'Se você assina o Premium, cancele também na App Store ou no Google Play.',
  },
  {
    icon: User,
    text: 'Se você tem vínculo com um psicólogo, ele é avisado de que a conta foi encerrada.',
  },
] as const;

export default function DeleteAccountScreen() {
  const colors = useV3Colors();
  const navigation = useNavigation();
  const { showAlert } = useAppAlert();
  const { deleteAccount } = useAuth();
  const { profile } = useTabScreenContext();
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) return;
    setDeleting(true);
    setAccountDeletedName(profile?.name?.split(' ')[0] ?? null);
    try {
      const { error } = await deleteAccount();
      if (error) {
        clearAccountDeletedName();
        showAlert({ title: 'Erro', message: error.message });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenScaffold
      padded={false}
      bottom={
        <View>
          <BudButton
            label="Excluir minha conta"
            onPress={() => void handleDelete()}
            loading={deleting}
            disabled={!confirmed}
            variant={confirmed ? 'primary' : 'disabled'}
          />
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Mudei de ideia"
            style={{ alignItems: 'center', marginTop: 20 }}
          >
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, color: colors.text2 }}>
              Mudei de ideia
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ paddingHorizontal: 20 }}>
        <MenuHeader onBack={() => navigation.goBack()} />
      </View>
      <View style={{ paddingHorizontal: 28, marginTop: 26 }}>
        <AccentTitle before="Excluir sua " accent="conta" after="?" />
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 17,
            lineHeight: 26,
            color: colors.text2,
            marginTop: 16,
          }}
        >
          Antes, veja o que acontece:
        </Text>
      </View>
      <View style={{ paddingHorizontal: 28, marginTop: 68 }}>
        {POINTS.map((point) => (
          <View
            key={point.text}
            style={{
              flexDirection: 'row',
              gap: 14,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            }}
          >
            <point.icon color={colors.text} size={22} />
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 15,
                lineHeight: 22,
                color: colors.text,
              }}
            >
              {point.text}
            </Text>
          </View>
        ))}
        <Pressable
          onPress={() => setConfirmed((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          accessibilityLabel="Entendi e quero excluir minha conta"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 26 }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: confirmed ? colors.accent : colors.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {confirmed ? <Check color={colors.onAccent} size={18} strokeWidth={2.6} /> : null}
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.text }}>
            Entendi e quero excluir minha conta
          </Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}
