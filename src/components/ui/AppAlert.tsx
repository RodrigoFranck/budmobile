import { Modal, Pressable, Text, View } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useAppColors } from '@/lib/colors';

import { createAppAlertStyles } from './AppAlert.styles';
import type { AppAlertButton, AppAlertState } from './AppAlert.types';

type AppAlertProps = {
  alert: AppAlertState | null;
  onDismiss: () => void;
};

function resolveButtons(buttons: AppAlertButton[] | undefined): AppAlertButton[] {
  if (buttons && buttons.length > 0) {
    return buttons;
  }

  return [{ text: 'OK', style: 'default' }];
}

export function AppAlert({ alert, onDismiss }: AppAlertProps) {
  const colors = useAppColors();
  const { isDarkMode } = useTheme();
  const styles = createAppAlertStyles(colors, isDarkMode);

  if (!alert) {
    return null;
  }

  const buttons = resolveButtons(alert.buttons);

  const handlePress = (button: AppAlertButton) => {
    onDismiss();
    button.onPress?.();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{alert.title}</Text>
          {!!alert.message && <Text style={styles.message}>{alert.message}</Text>}

          <View style={styles.buttonsColumn}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';

              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    isDestructive
                      ? styles.buttonDestructive
                      : isCancel
                        ? styles.buttonCancel
                        : styles.buttonPrimary,
                  ]}
                  onPress={() => handlePress(button)}
                  accessibilityRole="button"
                >
                  <Text
                    style={
                      isDestructive
                        ? styles.buttonTextDestructive
                        : isCancel
                          ? styles.buttonTextCancel
                          : styles.buttonTextPrimary
                    }
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
