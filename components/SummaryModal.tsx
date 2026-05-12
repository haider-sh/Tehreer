import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { readAsStringAsync } from 'expo-file-system/legacy';

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

  const [extracting, setExtracting] = useState(false);
  const webViewRef = React.useRef<WebView>(null);

  // b64Data and parsedPage are stored in state so useMemo can depend on
  // their current values — not on the stale values from the initial render.
  const [b64Data, setB64Data] = useState<string | null>(null);
  const [parsedPage, setParsedPage] = useState(1);

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
      const b64 = await readAsStringAsync(localPdfPath, { encoding: 'base64' });
      // Store page first so useMemo sees the correct value when b64Data triggers
      // a re-render and the WebView is mounted.
      setParsedPage(page);
      setB64Data(b64);
      setExtracting(true);
    } catch {
      setError('فائل پڑھنے میں خطا ہوئی۔');
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success') {
        const res = await meaningService.getSummary({ text: msg.text });
        setSummary(res.summary);
      } else {
        setError('خلاصہ حاصل نہیں ہو سکا۔');
      }
    } catch {
      setError('خلاصہ حاصل نہیں ہو سکا۔');
    } finally {
      setLoading(false);
      setExtracting(false);
      setB64Data(null);
    }
  };

  const extractionHtml = React.useMemo(() => {
    if (!b64Data) return '';

    const safeB64 = JSON.stringify(b64Data); // produces a safely-quoted JS string

    return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
</head>
<body>
<script>
(async function () {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function post(obj) { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  try {
    var bytes = b64ToBytes(${safeB64});
    var pdf   = await pdfjsLib.getDocument({ data: bytes }).promise;
    var last  = Math.min(${parsedPage}, pdf.numPages);
    var text  = '';

    for (var p = 1; p <= last; p++) {
      var page = await pdf.getPage(p);
      var tc   = await page.getTextContent();
      text += tc.items.map(function (it) { return it.str; }).join(' ') + '\\n\\n';
    }

    post({ type: 'success', text: text });
  } catch (err) {
    post({ type: 'error', message: err.message });
  }
})();
<\/script>
</body>
</html>`;
  }, [b64Data, parsedPage]);

  const handleClose = () => {
    setSummary('');
    setToPage('');
    setError('');
    setExtracting(false);
    setB64Data(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/*
        Single overlay fills the whole screen and anchors the sheet to the
        bottom. This gives every child inside `sheet` a proper height context
        so `flex:1` on summaryContainer actually works and the nav bar from
        the reader screen cannot bleed through.
      */}
      <View style={styles.overlay}>
        {/* Dimmed backdrop — tapping dismisses the modal */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, !!summary && !loading && styles.sheetExpanded]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Summarise</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Input row — hidden once the summary is ready */}
            {!summary && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Summarise from page 1 to page:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.pageInput}
                    value={toPage}
                    onChangeText={setToPage}
                    keyboardType="number-pad"
                    placeholder={`${totalPages}`}
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
              <View style={styles.summaryContainer}>
                <ScrollView
                  contentContainerStyle={styles.summaryBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.summaryMeta}>Pages 1 - {toPage}</Text>
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
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Hidden extractor — 1×1 px off-screen so Android mounts the WebView process */}
      {extracting && !!extractionHtml && (
        <View style={styles.hiddenWebView}>
          <WebView
            ref={webViewRef}
            source={{ html: extractionHtml, baseUrl: 'about:blank' }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen dimmed overlay — anchors the sheet at the bottom and ensures
  // the reader's nav bar cannot bleed through the modal.
  overlay: {
    flex: 1,
    minHeight: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    // KeyboardAvoidingView needs to shrink, not fill, so the sheet stays at bottom
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  // When the summary is displayed we need the sheet to fill up to its maxHeight
  // so that summaryContainer's flex:1 has a defined parent height to expand into.
  sheetExpanded: {
    height: '70%',
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  // flex:1 expands to fill the sheet height (defined by sheetExpanded)
  summaryContainer: {
    flex: 1,
  },
  summaryBody: { padding: Spacing.lg, gap: Spacing.md },
  summaryMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  summaryText: { lineHeight: 44 },
  summaryActions: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // 1×1 px off-screen — Android needs real dimensions to mount the WebView
  // process; zero-size prevents onMessage from ever firing.
  hiddenWebView: {
    position: 'absolute',
    width: 1,
    height: 1,
    top: -1000,
    left: -1000,
    opacity: 0,
  },
});
