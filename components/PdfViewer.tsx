import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
// P2-3: migrated from react-native-pdf to react-native-pdf-jsi (drop-in replacement)
// Provides onPageSingleTap, searchTextDirect (for post-MVP bounding-rect word lookup),
// and pdfId for highlight rendering.
import Pdf from 'react-native-pdf-jsi';
import { Colors } from '../constants/theme';

interface Props {
  uri: string;
  page: number;
  /** Unique identifier for this PDF — required by searchTextDirect & highlightRects */
  pdfId: string;
  onLoadComplete: (totalPages: number) => void;
  onPageChanged: (page: number) => void;
  onError?: (error: Error) => void;
  /** P2-1: injected by SelectionOverlay via React.cloneElement */
  onPageSingleTap?: (page: number, x: number, y: number) => void;
}

export function PdfViewer({
  uri,
  page,
  pdfId,
  onLoadComplete,
  onPageChanged,
  onError,
  onPageSingleTap,
}: Props) {
  const source = { uri, cache: true };

  const handleLoadComplete = useCallback(
    (numberOfPages: number) => onLoadComplete(numberOfPages),
    [onLoadComplete]
  );

  const handlePageChanged = useCallback(
    (currentPage: number) => onPageChanged(currentPage),
    [onPageChanged]
  );

  return (
    <View style={styles.container}>
      <Pdf
        source={source}
        page={page}
        pdfId={pdfId}
        onLoadComplete={handleLoadComplete}
        onPageChanged={handlePageChanged}
        onError={(error) => onError?.(error as Error)}
        onPageSingleTap={onPageSingleTap}
        style={styles.pdf}
        enablePaging
        horizontal={false}
        trustAllCerts={false}
        renderActivityIndicator={() => <View />}
        fitPolicy={0} /* 0 = fit-width */
        spacing={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
});
