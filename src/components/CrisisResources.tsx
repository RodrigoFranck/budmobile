import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

import { CRISIS_RESOURCES } from '@/constants/healthSafety';

type CrisisResourcesProps = {
  textColor?: string;
  subtextColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
};

export function CrisisResources({
  textColor = '#FFFFFF',
  subtextColor = 'rgba(255,255,255,0.7)',
  buttonBackground = 'rgba(255,255,255,0.12)',
  buttonTextColor = '#FFFFFF',
}: CrisisResourcesProps) {
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>Precisa de ajuda agora?</Text>
      <Text style={[styles.subtitle, { color: subtextColor }]}>
        Se você está em crise ou corre perigo, procure ajuda profissional imediatamente.
      </Text>
      {CRISIS_RESOURCES.map((resource) => (
        <View key={resource.id} style={styles.resourceBlock}>
          <Text style={[styles.resourceLabel, { color: textColor }]}>{resource.label}</Text>
          <Text style={[styles.resourceDescription, { color: subtextColor }]}>
            {resource.description}
          </Text>
          <View style={styles.actions}>
            {'phone' in resource && resource.phone ? (
              <TouchableOpacity
                onPress={() => handleCall(resource.phone!)}
                style={[styles.button, { backgroundColor: buttonBackground }]}
                accessibilityRole="button"
                accessibilityLabel={`Ligar ${resource.label}`}
              >
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>
                  Ligar {resource.phone}
                </Text>
              </TouchableOpacity>
            ) : null}
            {'url' in resource && resource.url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(resource.url!)}
                style={[styles.button, { backgroundColor: buttonBackground }]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir chat ${resource.label}`}
              >
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>Chat online</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'InriaSerif-Regular',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  resourceBlock: {
    gap: 6,
    marginTop: 4,
  },
  resourceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resourceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
