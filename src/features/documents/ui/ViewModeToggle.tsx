import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/shared/ui/Icon';
import type { IconName } from '@/shared/ui/Icon';
import { borderRadius, colors, iconSize, spacing } from '@/shared/ui/theme';

import type { ViewMode } from '../state/useDocuments';

export interface ViewModeToggleProps {
  selected: ViewMode;
  onChange: (viewMode: ViewMode) => void;
}

const VIEW_MODE_ICON: Record<ViewMode, IconName> = {
  list: 'list',
  grid: 'grid',
};

function ViewModeButton({ mode, selected, onChange }: ViewModeToggleProps & { mode: ViewMode }) {
  const isSelected = mode === selected;

  return (
    <Pressable
      testID={`view-mode-button-${mode}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onChange(mode)}
      style={[styles.segment, isSelected && styles.segmentSelected]}
    >
      <Icon
        name={VIEW_MODE_ICON[mode]}
        size={iconSize.sm}
        color={isSelected ? colors.accent : colors.textSecondary}
      />
    </Pressable>
  );
}

export function ViewModeToggle({ selected, onChange }: ViewModeToggleProps) {
  return (
    <View style={styles.container}>
      <ViewModeButton mode="list" selected={selected} onChange={onChange} />
      <ViewModeButton mode="grid" selected={selected} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
});
