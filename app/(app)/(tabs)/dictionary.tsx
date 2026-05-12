import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { UrduText } from '../../../components/ui/UrduText';
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme';
import { dictionaryService } from '../../../services/dictionary.service';
import { useDictionaryStore, DictionaryEntry } from '../../../store/dictionary.store';
import { useAuthStore } from '../../../store/auth.store';

export default function DictionaryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { entries, setEntries, removeEntry, setLoading, loading } = useDictionaryStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    dictionaryService.list().then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleDelete = (entry: DictionaryEntry) => {
    Alert.alert('Remove Word', `Remove "${entry.word}" from your dictionary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await dictionaryService.remove(entry.id);
            removeEntry(entry.id);
          } catch {
            Alert.alert('Error', 'Could not remove the word.');
          }
        },
      },
    ]);
  };

  const filtered = entries.filter(
    (e) => e.word.includes(search) || e.meanings.map((m) => m.meaning).includes(search)
  );

  if (!isAuthenticated) {
    return (
      <SafeScreen>
        <View style={styles.header}>
          <Text style={styles.title}>Dictionary</Text>
        </View>
        <View style={styles.signInPrompt}>
          <Ionicons name="language-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.promptTitle}>Your Personal Dictionary</Text>
          <Text style={styles.promptSub}>
            Sign in to save words and build your vocabulary as you read.
          </Text>
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.signInBtn} />
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>
              Don't have an account? <Text style={styles.registerLinkAccent}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Dictionary</Text>
        <Text style={styles.count}>{entries.length} words</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.entryCard} padded={false}>
              <View style={styles.entryBody}>
                <UrduText size="md" style={styles.word}>{item.word}</UrduText>
                {item.meanings.map((m) => <UrduText size="sm" color={Colors.textSecondary} numberOfLines={2}>{m.meaning}</UrduText>)}
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </Card>
          )}
          contentContainerStyle={[styles.list, !filtered.length && styles.emptyList]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="language-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No words saved yet</Text>
              <Text style={styles.emptySubtitle}>Tap a word while reading to add it here</Text>
            </View>
          }
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: FontSize.sm, color: Colors.textMuted },
  signInPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  promptTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  promptSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  signInBtn: { width: '100%', marginTop: Spacing.sm },
  registerLink: { fontSize: FontSize.sm, color: Colors.textSecondary },
  registerLinkAccent: { color: Colors.accent, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', margin: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 42, fontSize: FontSize.md, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  emptyList: { flex: 1 },
  entryCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  entryBody: { flex: 1 },
  word: { marginBottom: 4 },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  deleteBtn: { padding: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
