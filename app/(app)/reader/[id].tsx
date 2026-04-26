import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { useReaderStore } from '../../../store/reader.store';
import { localPdfService, LocalPdf } from '../../../services/local-pdf.service';
import { MeaningDrawer } from './components/MeaningDrawer';
import { SummaryModal } from './components/SummaryModal';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setDoc, currentPage, totalPages, setPage, setPendingSelection, reset } = useReaderStore();

  const [pdfMeta, setPdfMeta] = useState<LocalPdf | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (!id) return;
    localPdfService.getById(id as string).then((meta) => {
      if (meta) {
        setPdfMeta(meta);
        setDoc(meta.id, meta.pageCount);
      }
      setLoading(false);
    });
    return () => reset();
  }, [id]);

  // Called by PdfViewer (once native build is active) to update page count
  const handleLoadComplete = (pages: number) => {
    setDoc(id as string, pages);
    localPdfService.updatePageCount(id as string, pages);
  };

  // Placeholder: PDF rendering requires a custom dev build (react-native-pdf).
  // PdfViewer will use pdfMeta.localPath as its source URI.
  // Run: npx expo run:android  (or npx expo run:ios)
  const renderPdfArea = () => (
    <View style={styles.pdfPlaceholder}>
      <Ionicons name="document-text-outline" size={56} color={Colors.textMuted} />
      <Text style={styles.placeholderTitle}>PDF Viewer</Text>
      <Text style={styles.placeholderSub}>
        Native rendering requires a custom dev build.
      </Text>
      <Text style={styles.placeholderSub}>
        Run: <Text style={styles.code}>npx expo run:android</Text>
      </Text>
      {pdfMeta && (
        <Text style={styles.placeholderFile} numberOfLines={1}>
          {pdfMeta.name}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.toolbarBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.docTitle} numberOfLines={1}>
          {pdfMeta?.name ?? ''}
        </Text>

        <TouchableOpacity onPress={() => setShowSummary(true)} style={styles.toolbarBtn}>
          <Ionicons name="document-text-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Page indicator */}
      {totalPages > 0 && (
        <View style={styles.pageBar}>
          <Text style={styles.pageText}>{currentPage} / {totalPages}</Text>
        </View>
      )}

      {/* PDF Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        renderPdfArea()
      )}

      {/* Page Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
          onPress={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage <= 1 ? Colors.textMuted : Colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.pageLabel}>Page {currentPage}</Text>

        <TouchableOpacity
          style={[styles.navBtn, (currentPage >= totalPages || totalPages === 0) && styles.navBtnDisabled]}
          onPress={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentPage >= totalPages || totalPages === 0 ? Colors.textMuted : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Meaning Drawer */}
      <MeaningDrawer
        visible={meaningVisible}
        selectedText={selectedText}
        localPdfPath={pdfMeta?.localPath ?? ''}
        page={currentPage}
        onClose={() => {
          setMeaningVisible(false);
          setSelectedText('');
        }}
      />

      {/* Summary Modal */}
      <SummaryModal
        visible={showSummary}
        localPdfPath={pdfMeta?.localPath ?? ''}
        totalPages={totalPages || 1}
        onClose={() => setShowSummary(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  toolbarBtn: { padding: Spacing.sm },
  docTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  pageBar: {
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pdfPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  placeholderTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textSecondary },
  placeholderSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholderFile: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    marginTop: Spacing.sm,
    maxWidth: '90%',
  },
  code: { fontFamily: 'monospace', color: Colors.accent },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navBtn: {
    padding: Spacing.sm,
    borderRadius: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  navBtnDisabled: { opacity: 0.4 },
  pageLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
});
