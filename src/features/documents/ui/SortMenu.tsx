import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

import type { SortKey } from '../domain/sortDocuments';

export interface SortMenuProps {
  selected: SortKey;
  onChange: (sortBy: SortKey) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'title', label: 'Title' },
  { key: 'version', label: 'Version' },
];

export function SortMenu({ selected, onChange }: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  function selectOption(sortBy: SortKey) {
    onChange(sortBy);
    setIsOpen(false);
  }

  return (
    <>
      <Pressable
        testID="sort-menu-button"
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>Sort by</Text>
        <Feather name="chevron-down" size={iconSize.sm} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          testID="sort-menu-overlay"
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.optionsCard}>
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.key === selected;
              return (
                <Pressable
                  key={option.key}
                  testID={`sort-menu-option-${option.key}`}
                  accessibilityRole="button"
                  onPress={() => selectOption(option.key)}
                  style={styles.option}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && <Feather name="check" size={iconSize.sm} color={colors.accent} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  triggerText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    minWidth: 160,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
});
