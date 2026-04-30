import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import { meaningService } from '../services/meaning.service';
import { Button } from './ui/Button';
import { UrduText } from './ui/UrduText';

interface Props {
  visible: boolean;
  localPdfPath: string;  // file:// URI of the local PDF
  totalPages: number;
  onClose: () => void;
}

export default function SummaryModal({ visible, localPdfPath, totalPages, onClose }: Props) {
  const [toPage, setToPage] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarise = async () => {
    const page = parseInt(toPage, 10);
    if (!page || page < 1 || page > totalPages) {
      setError(`Please enter a page between 1 and ${totalPages}`);
      return;
    }
    setError('');
    setSummary('');
    setLoading(true);
    try {
      const res = await meaningService.getSummary({
        local_pdf_path: localPdfPath,
        from_page: 1,
        to_page: page,
      });
      setSummary(res.summary);
    } catch {
      setError('خلاصہ حاصل نہیں ہو سکا۔ دوبارہ کوشش کریں۔');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSummary('');
    setToPage('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Summarise</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Input row */}
        {!summary && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Summarise from page 1 to page:</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.pageInput}
                value={toPage}
                onChangeText={setToPage}
                keyboardType="number-pad"
                placeholder={`1–${totalPages}`}
                placeholderTextColor={Colors.textMuted}
                maxLength={4}
              />
              <Button
                label="Go"
                onPress={handleSummarise}
                loading={loading}
                style={styles.goBtn}
              />
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loadingText}>خلاصہ تیار ہو رہا ہے…</Text>
          </View>
        )}

        {/* Summary result */}
        {!!summary && !loading && (
          <>
            <ScrollView contentContainerStyle={styles.summaryBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.summaryMeta}>Pages 1 – {toPage}</Text>
              <UrduText size="md" style={styles.summaryText}>
                {summary}
              </UrduText>
            </ScrollView>
            <View style={styles.summaryActions}>
              <Button
                label="Summarise Again"
                onPress={() => setSummary('')}
                variant="secondary"
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '75%',
    paddingBottom: Spacing.xxl,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  inputSection: { padding: Spacing.lg, gap: Spacing.sm },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  pageInput: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  goBtn: { width: 80 },
  errorText: { fontSize: FontSize.sm, color: Colors.error },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryBody: { padding: Spacing.lg, gap: Spacing.md },
  summaryMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  summaryText: { lineHeight: 44 },
  summaryActions: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
});
