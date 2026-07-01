import { useMemo } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import type { BudConfirmDialogProps } from '@/components/ui/BudConfirmDialog.types';
import {
  createBudConfirmDialogStyles,
  useBudConfirmDialogColors,
} from '@/components/ui/BudConfirmDialog.styles';

const DEFAULT_CANCEL_LABEL = 'Cancelar';

export function BudConfirmDialog({
  visible,
  title,
  message,
  cancelLabel = DEFAULT_CANCEL_LABEL,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: BudConfirmDialogProps) {
  const colors = useBudConfirmDialogColors();
  const styles = useMemo(() => createBudConfirmDialogStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Fechar diálogo"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          accessibilityViewIsModal
          style={styles.card}
        >
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text
                style={[
                  styles.confirmLabel,
                  destructive ? styles.confirmDestructive : styles.confirmDefault,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
