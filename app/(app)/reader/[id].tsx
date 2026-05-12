import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MeaningDrawer from '../../../components/MeaningDrawer';
import { PdfWebViewer, WordTapPayload } from '../../../components/PdfWebViewer';
import SummaryModal from '../../../components/SummaryModal';
import { Colors, FontSize, Spacing } from '../../../constants/theme';
import { LocalPdf, localPdfService } from '../../../services/local-pdf.service';
import { useReaderStore } from '../../../store/reader.store';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setDoc, currentPage, totalPages, setPage, reset } = useReaderStore();

  const [pdfMeta, setPdfMeta] = useState<LocalPdf | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [pageContext, setPageContext] = useState('');
  const [jumpToPage, setJumpToPage] = useState(1);

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

  const handleLoadComplete = useCallback(
    (pages: number) => {
      setDoc(id as string, pages);
      localPdfService.updatePageCount(id as string, pages);
    },
    [id]
  );

  const handlePageChanged = useCallback(
    (page: number) => setPage(page),
    [setPage]
  );

  /**
   * P2-W1 — Word tap from PDF.js text layer.
   * `word` is the exact tapped text item; `fullPageText` is all text items
   * joined — sent as context to the meaning API (never equals word alone).
   */
  const handleWordTap = useCallback(({ word, fullPageText }: WordTapPayload) => {
    if (!word) return;
    setSelectedText(word);
    setPageContext(fullPageText !== word ? fullPageText : '');
    setMeaningVisible(true);
  }, []);

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

      {/* PDF */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : pdfError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{pdfError}</Text>
        </View>
      ) : pdfMeta ? (
        <PdfWebViewer
          uri={pdfMeta.localPath}
          page={jumpToPage}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onWordTap={handleWordTap}
          onError={(msg) => setPdfError(msg)}
        />
      ) : null}

      {/* Page navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
          onPress={() => {
            const prev = Math.max(1, currentPage - 1);
            setPage(prev);
            setJumpToPage(prev);
          }}
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
          style={[
            styles.navBtn,
            (currentPage >= totalPages || totalPages === 0) && styles.navBtnDisabled,
          ]}
          onPress={() => {
            const next = currentPage + 1;
            setPage(next);
            setJumpToPage(next);
          }}
          disabled={currentPage >= totalPages || totalPages === 0}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              currentPage >= totalPages || totalPages === 0
                ? Colors.textMuted
                : Colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Meaning Drawer */}
      <MeaningDrawer
        visible={meaningVisible}
        selectedText={selectedText}
        context={pageContext}
        localPdfPath={pdfMeta?.localPath ?? ''}
        page={currentPage}
        onClose={() => {
          setMeaningVisible(false);
          setSelectedText('');
          setPageContext('');
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  errorText: { fontSize: FontSize.md, color: Colors.error, fontWeight: '500' },
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
