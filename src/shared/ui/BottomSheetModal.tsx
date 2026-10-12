import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/shared/ui/Icon';
import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

export interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeButtonTestID: string;
  children: ReactNode;
}

export function BottomSheetModal({
  visible,
  title,
  onClose,
  closeButtonTestID,
  children,
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable testID={`${closeButtonTestID}-overlay`} style={styles.overlay} onPress={onClose}>
        {/* Claims the tap so it doesn't bubble up to the overlay's onClose. */}
        <Pressable testID={`${closeButtonTestID}-sheet`} style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable testID={closeButtonTestID} accessibilityRole="button" onPress={onClose}>
              <Icon name="x" size={iconSize.sm} color={colors.textSecondary} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
