import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { borderRadius, colors, fontSize, iconSize, spacing } from '@/shared/ui/theme';

import type { CreateDocumentInput } from '../domain/document';
import type { ValidationErrors } from '../domain/validateCreateDocumentInput';
import { validateCreateDocumentInput } from '../domain/validateCreateDocumentInput';

const FILE_NAME_DISPLAY_LIMIT = 30;

export interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDocumentInput) => void;
}

function truncateFileName(fileName: string): string {
  return fileName.length > FILE_NAME_DISPLAY_LIMIT
    ? `${fileName.slice(0, FILE_NAME_DISPLAY_LIMIT)}…`
    : fileName;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function AddDocumentModal({ visible, onClose, onSubmit }: AddDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  function resetForm() {
    setTitle('');
    setVersion('');
    setFileName('');
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function pickFile() {
    // Picked files are never read or uploaded (no POST /documents, no local
    // persistence), so the name is all we keep — copyToCacheDirectory: false
    // avoids writing an unused copy of the user's file to the app's cache.
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
    if (result.canceled) {
      return;
    }
    setFileName(result.assets[0]?.name ?? '');
  }

  function handleSubmit() {
    const input: CreateDocumentInput = { title, version, fileName };
    const result = validateCreateDocumentInput(input);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    onSubmit(input);
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add document</Text>
            <Pressable
              testID="add-document-close-button"
              accessibilityRole="button"
              onPress={handleClose}
            >
              <Feather name="x" size={iconSize.sm} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Document informations</Text>

          <Field label="Name" error={errors.title}>
            <TextInput
              testID="add-document-title-input"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Placeholder"
            />
          </Field>

          <Field label="Version" error={errors.version}>
            <TextInput
              testID="add-document-version-input"
              style={styles.input}
              value={version}
              onChangeText={setVersion}
              placeholder="Placeholder"
            />
          </Field>

          <Field label="File" error={errors.fileName}>
            <Pressable
              testID="add-document-choose-file-button"
              accessibilityRole="button"
              onPress={() => void pickFile()}
              style={styles.chooseFileButton}
            >
              <Feather name="file-text" size={iconSize.sm} color={colors.accent} />
              <Text style={styles.chooseFileText}>
                {fileName ? truncateFileName(fileName) : 'Choose file'}
              </Text>
            </Pressable>
          </Field>

          <Pressable
            testID="add-document-submit-button"
            accessibilityRole="button"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      </View>
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  field: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  chooseFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chooseFileText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
