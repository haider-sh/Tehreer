import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';

interface Props {
  /** Current PDF page number */
  currentPage: number;
  /**
   * P2-2: Reference to page text cache (keyed by page number).
   * Used to pre-fill the lookup bubble with the guessed tapped word.
   * If empty for the current page, bubble opens with an empty field.
   */
  pageTextRef: React.RefObject<Map<number, string>>;
  /** Called when the user confirms a word/phrase to look up */
  onSelectionConfirmed: (params: {
    selectedText: string;
    context: string;
    page: number;
  }) => void;
  /** Render prop — renders PdfViewer (or any children) below the overlay */
  children: React.ReactNode;
}

export default function SelectionOverlay({
  currentPage,
  pageTextRef,
  onSelectionConfirmed,
  children,
}: Props) {
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Track the rendered width of the PDF area so we can map tap X → word index
  const pdfWidthRef = useRef<number>(0);

  // Track keyboard height so the bubble shifts above it when the keyboard opens
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    pdfWidthRef.current = e.nativeEvent.layout.width;
  };

  /**
   * P2-1b — Guess tapped word from page text cache using tap X coordinate.
   *
   * Urdu is RTL, so we invert the X axis before mapping to word index:
   *   wordIndex = floor(((pageWidth - tapX) / pageWidth) * wordCount)
   *
   * This is an approximation — words have varying widths, and multi-column
   * layouts will confuse it. It's accurate enough as a pre-fill that the
   * user can confirm or correct.
   */
  const guessTappedWord = (tapX: number, pageText: string): string => {
    const words = pageText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const pageWidth = pdfWidthRef.current;
    if (pageWidth <= 0) return words[0];

    // RTL correction: Urdu reads right-to-left, so rightmost tap = first word
    const rtlX = pageWidth - tapX;
    const wordIndex = Math.min(
      Math.max(0, Math.floor((rtlX / pageWidth) * words.length)),
      words.length - 1
    );
    return words[wordIndex] ?? '';
  };

  /**
   * Build a context window of ±10 words around the tapped word.
   * This is more precise than sending the entire page, but still satisfies
   * the "context must not equal selected_text" rule.
   */
  const buildContextWindow = (tapX: number, pageText: string): string => {
    const words = pageText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    const pageWidth = pdfWidthRef.current;
    if (pageWidth <= 0) return pageText;

    const rtlX = pageWidth - tapX;
    const wordIndex = Math.min(
      Math.max(0, Math.floor((rtlX / pageWidth) * words.length)),
      words.length - 1
    );
    const contextStart = Math.max(0, wordIndex - 10);
    const contextEnd = Math.min(words.length, wordIndex + 10);
    return words.slice(contextStart, contextEnd).join(' ');
  };

  /** Called by PdfViewer via onPageSingleTap (injected via React.cloneElement) */
  const handlePageTap = (_page: number, tapX: number, _tapY: number) => {
    const pageText = pageTextRef.current?.get(currentPage) ?? '';
    const guessedWord = guessTappedWord(tapX, pageText);

    setInputText(guessedWord);
    setBubbleVisible(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleConfirm = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const pageText = pageTextRef.current?.get(currentPage) ?? '';
    // Context = surrounding page window; fall back to full page text, then empty string.
    // Context must NOT equal selected_text (enforced here).
    const context =
      pageText && pageText !== trimmed
        ? buildContextWindow(0, pageText) // reuse full-page for context on confirm
        : '';

    Keyboard.dismiss();
    setBubbleVisible(false);
    setInputText('');

    onSelectionConfirmed({ selectedText: trimmed, context, page: currentPage });
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    setBubbleVisible(false);
    setInputText('');
  };

  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      {/* PDF content — inject onPageSingleTap via cloneElement */}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          onPageSingleTap: handlePageTap,
        });
      })}

      {/* Lookup bubble */}
      {bubbleVisible && (
        <View style={[styles.bubble, { bottom: keyboardHeight }]}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.bubbleHint}>لفظ یا جملہ لکھیں</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="مثلاً: تحریر"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleConfirm}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.confirmBtn, !inputText.trim() && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!inputText.trim()}
            >
              <Ionicons name="search" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.pageHint}>صفحہ {currentPage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  bubble: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
    gap: Spacing.sm,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    backgroundColor: Colors.accentLight,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  confirmBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  pageHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
