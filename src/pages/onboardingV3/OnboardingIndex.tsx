import { Pressable, Text, View } from 'react-native';

import { BudButton } from '@/components/v3';
import type { OnboardingFlowState } from '@/contexts/OnboardingFlowContext';
import {
  ABOUT_ME_ROWS,
  MOTIVE_ROWS,
  formatPrefValue,
} from '@/pages/menu/menuCatalog';
import {
  AccentTitle,
  MenuHeader,
  PrefGroup,
  PrefRow,
  ScreenScaffold,
  SectionLabel,
} from '@/pages/menu/menuUi';
import {
  ONBOARDING_V3_STEPS,
  type OnboardingField,
} from '@/pages/onboardingV3/onboardingSteps';
import { fonts, useV3Colors, voiceOptions } from '@/theme';

type FlowSlice = Pick<
  OnboardingFlowState,
  'displayName' | 'ageRange' | 'answers' | 'initialThoughts'
>;

type IndexRow = {
  stepKey: string;
  field: OnboardingField;
  label: string;
};

const PREF_ROWS: { field: OnboardingField; label: string }[] = [
  { field: 'voice', label: 'Voz' },
  { field: 'interests', label: 'Interesses' },
  { field: 'anythingElse', label: 'Algo mais' },
  { field: 'origin', label: 'Como conheceu o Bud' },
];

function stepKeyForField(field: OnboardingField) {
  return ONBOARDING_V3_STEPS.find((step) => step.field === field)?.key ?? field;
}

function rowsFrom(items: { field: OnboardingField; label: string }[]): IndexRow[] {
  return items.map((row) => ({
    field: row.field,
    label: row.label,
    stepKey: stepKeyForField(row.field),
  }));
}

const INDEX_SECTIONS: { key: string; label: string; rows: IndexRow[] }[] = [
  { key: 'core', label: 'Sobre você', rows: rowsFrom(ABOUT_ME_ROWS) },
  { key: 'deep', label: 'O que te trouxe aqui', rows: rowsFrom(MOTIVE_ROWS) },
  { key: 'prefs', label: 'Seu jeito', rows: rowsFrom(PREF_ROWS) },
];

export function stepIndexForKey(stepKey: string) {
  return ONBOARDING_V3_STEPS.findIndex((step) => step.key === stepKey);
}

function indexValue(field: OnboardingField, flow: FlowSlice) {
  if (field === 'displayName') return flow.displayName.trim();
  if (field === 'ageRange') return flow.ageRange ?? '';
  if (field === 'anythingElse') {
    return (flow.answers.anythingElse || flow.initialThoughts).trim();
  }
  if (field === 'voice') {
    const id = flow.answers.voice;
    return voiceOptions.find((item) => item.id === id)?.label ?? id ?? '';
  }
  return (flow.answers[field] ?? '').trim();
}

function formatIndexValue(field: OnboardingField, flow: FlowSlice) {
  return formatPrefValue(indexValue(field, flow), flow.answers.gender);
}

export function OnboardingIndexList({
  flow,
  onSelect,
}: {
  flow: FlowSlice;
  onSelect: (stepKey: string) => void;
}) {
  return (
    <>
      {INDEX_SECTIONS.map((section, sectionIndex) => (
        <View key={section.key}>
          <SectionLabel label={section.label} style={{ marginTop: sectionIndex === 0 ? 18 : 22 }} />
          <PrefGroup style={{ marginTop: 10 }}>
            {section.rows.map((row, index) => (
              <PrefRow
                key={row.stepKey}
                label={row.label}
                hint={formatIndexValue(row.field, flow)}
                tall
                last={index === section.rows.length - 1}
                onPress={() => onSelect(row.stepKey)}
              />
            ))}
          </PrefGroup>
        </View>
      ))}
    </>
  );
}

export function OnboardingHub({
  flow,
  saving,
  onBack,
  onSelect,
  onSave,
  onReplayAll,
}: {
  flow: FlowSlice;
  saving?: boolean;
  onBack: () => void;
  onSelect: (stepKey: string) => void;
  onSave: () => void;
  onReplayAll: () => void;
}) {
  const colors = useV3Colors();

  return (
    <ScreenScaffold
      bottom={<BudButton label="Salvar e voltar" onPress={onSave} loading={saving} />}
    >
      <MenuHeader onBack={onBack} />
      <AccentTitle before="O que você quer " accent="atualizar" after="?" />
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 25,
          color: colors.text2,
          marginTop: 10,
          paddingHorizontal: 4,
        }}
      >
        Toque na pergunta. As respostas de agora já vêm marcadas, e o resto fica como está.
      </Text>
      <OnboardingIndexList flow={flow} onSelect={onSelect} />
      <Pressable
        onPress={onReplayAll}
        accessibilityRole="button"
        accessibilityLabel="Rever o caminho inteiro"
        style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 8 }}
      >
        <Text style={{ fontFamily: fonts.sansSemi, fontSize: 16, lineHeight: 16, color: colors.text2 }}>
          Rever o caminho inteiro
        </Text>
      </Pressable>
    </ScreenScaffold>
  );
}
