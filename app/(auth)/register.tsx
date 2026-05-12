import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { UrduText } from '../../components/ui/UrduText';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import Icon from '../../assets/images/android-icon-foreground.png';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('خطا', 'تمام خانے پُر کریں');
      return;
    }
    setLoading(true);
    try {
      const { access_token, refresh_token, user } = await authService.register(
        username.trim(),
        email.trim(),
        password
      );
      await login(access_token, refresh_token, user);
      router.replace('/(app)/(tabs)/library');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'اکاؤنٹ بنانا ناکام ہوا';
      Alert.alert('خطا', msg);
      router.replace('/(app)/(tabs)/library');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <UrduText size="xl" style={styles.appName}>
              تحریر
            </UrduText>
            <Image source={Icon} style={styles.logo} />
          </View>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerBtn}
          />

          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkAccent}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
  },
  heroText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: Spacing.xxl },
  appName: { fontSize: 56, lineHeight: 150, color: Colors.primary },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
    marginTop: Spacing.sm,
  },
  input: {
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  registerBtn: { marginTop: Spacing.lg },
  link: { alignItems: 'center', marginTop: Spacing.md },
  linkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
