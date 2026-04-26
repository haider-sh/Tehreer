import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UrduText } from '../../../../components/ui/UrduText';
import { Button } from '../../../../components/ui/Button';
import { Colors, Spacing, Radius, FontSize } from '../../../../constants/theme';
import { meaningService } from '../../../../services/meaning.service';
import { dictionaryService } from '../../../../services/dictionary.service';
import { useDictionaryStore } from '../../../../store/dictionary.store';
import { useAuthStore } from '../../../../store/auth.store';

interface Props {
  visible: boolean;
  selectedText: string;
  localPdfPath: string; // kept for future context enrichment; not sent to backend yet
  page: number;
  onClose: () => void;
}

export function MeaningDrawer({ visible, selectedText, localPdfPath, page, onClose }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addEntry } = useDictionaryStore();

  const [meaning, setMeaning] = useState('');
  const [pos, setPos] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Fetch meaning when drawer opens with selected text
  React.useEffect(() => {
    if (!visible || !selectedText) return;
    setMeaning('');
    setPos('');
    setError('');
    setSaved(false);
    setLoading(true);

    meaningService
      .getMeaning({
        page,
        selected_text: selectedText,
        context: selectedText, // context will be enriched once SelectionOverlay is complete
        selection_type: 'word',
      })
      .then((res) => {
        setMeaning(res.meaning);
        setPos(res.pos);
      })
      .catch(() => setError('معنی حاصل نہیں ہو سکا'))
      .finally(() => setLoading(false));
  }, [visible, selectedText]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Save words to your personal dictionary by signing in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    setSaving(true);
    try {
      const entry = await dictionaryService.add({
        word: selectedText,
        meaning,
        context_sentence: selectedText,
      });
      addEntry(entry);
      setSaved(true);
    } catch {
      Alert.alert('خطا', 'لفظ محفوظ نہیں ہو سکا');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.drawer}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.drawerHeader}>
          <UrduText size="lg" style={styles.selectedWord}>
            {selectedText || '—'}
          </UrduText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.loadingText}>معنی تلاش ہو رہا ہے…</Text>
            </View>
          )}

          {!!error && !loading && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {!!meaning && !loading && (
            <>
              {!!pos && <Text style={styles.posLabel}>{pos}</Text>}
              <UrduText size="md" style={styles.meaningText}>
                {meaning}
              </UrduText>
            </>
          )}
        </ScrollView>

        {/* Actions */}
        {!!meaning && !loading && (
          <View style={styles.actions}>
            <Button
              label={saved ? '✓ Saved' : 'Add to Dictionary'}
              onPress={handleSave}
              variant={saved ? 'secondary' : 'primary'}
              loading={saving}
              disabled={saved}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '60%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedWord: { flex: 1, color: Colors.primary },
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  posLabel: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  meaningText: { lineHeight: 44 },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
