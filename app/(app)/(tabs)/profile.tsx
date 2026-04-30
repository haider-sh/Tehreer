import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme';
import { useAuthStore } from '../../../store/auth.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeScreen>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.signInPrompt}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.promptTitle}>Not signed in</Text>
          <Text style={styles.promptSub}>
            Sign in to save words to your dictionary and sync across devices.
          </Text>
          <Button label="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.actionBtn} />
          <Button label="Create Account" onPress={() => router.push('/(auth)/register')} variant="secondary" style={styles.actionBtn} />
        </View>
      </SafeScreen>
    );
  }

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.avatarSection}>
        <View style={styles.avatarFilled}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <View style={styles.section}>
        <Card>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
            <Text style={styles.infoText}>Signed in — words saved to your dictionary are synced with the server.</Text>
          </View>
        </Card>
      </View>
      <View style={styles.section}>
        <Button label="Log Out" onPress={handleLogout} variant="secondary" />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  signInPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  promptTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  promptSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  actionBtn: { width: '100%' },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  avatarFilled: {
    width: 72, height: 72, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  username: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
