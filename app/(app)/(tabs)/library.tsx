import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Card } from '../../../components/ui/Card';
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme';
import { localPdfService, LocalPdf } from '../../../services/local-pdf.service';

export default function LibraryScreen() {
  const router = useRouter();

  const [docs, setDocs] = useState<LocalPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await localPdfService.list();
      setDocs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleAdd = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setAdding(true);
    try {
      const doc = await localPdfService.add(asset.uri, asset.name);
      setDocs((prev) => [doc, ...prev]);
    } catch {
      Alert.alert('Error', 'Could not open the PDF. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (doc: LocalPdf) => {
    Alert.alert('Remove PDF', `Remove "${doc.name}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await localPdfService.remove(doc.id);
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
          } catch {
            Alert.alert('Error', 'Could not remove the PDF.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: LocalPdf }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/reader/${item.id}`)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.docCard} padded={false}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text" size={28} color={Colors.accent} />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.docMeta}>
            {item.pageCount > 0 ? `${item.pageCount} pages · ` : ''}
            {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="add" size={22} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.hintText}>PDFs are stored on your device. Long-press to remove.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, !docs.length && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDocs(); }}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No PDFs yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to open a PDF from your device</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    width: 38, height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  hintText: { fontSize: FontSize.xs, color: Colors.textMuted },
  list: { padding: Spacing.lg },
  emptyList: { flex: 1 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  docIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  docMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
