import React from 'react';
import { StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { Colors } from '../constants/theme';

interface Props {
  uri: string;
  page: number;
  onLoadComplete: (totalPages: number) => void;
  onPageChanged: (page: number) => void;
  onError?: (error: Error) => void;
}

export function PdfViewer({ uri, page, onLoadComplete, onPageChanged, onError }: Props) {
  const source = { uri, cache: true };

  return (
    <View style={styles.container}>
      <Pdf
        source={source}
        page={page}
        onLoadComplete={(numberOfPages) => onLoadComplete(numberOfPages)}
        onPageChanged={(currentPage) => onPageChanged(currentPage)}
        onError={(error) => onError?.(error as Error)}
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
