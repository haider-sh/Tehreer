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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('خطا', 'ای میل اور پاس ورڈ درج کریں');
      return;
    }
    setLoading(true);
    try {
      const { access_token, refresh_token, user } = await authService.login(email.trim(), password);
      await login(access_token, refresh_token, user);
      router.replace('/(app)/(tabs)/library');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'لاگ ان ناکام ہوا';
      Alert.alert('خطا', msg);
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
        {/* Logo / Branding */}
        <View style={styles.hero}>
          <UrduText size="xl" style={styles.appName}>
            تحریر
          </UrduText>
          <Image source={Icon} style={styles.logo} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
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

          <Button label="Log In" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkAccent}>Register</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>
              Just browsing? <Text style={styles.linkAccent}>Skip for now</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontSize: 56,
    lineHeight: 150,
    color: Colors.primary,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  form: {
    gap: Spacing.sm,
  },
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
  loginBtn: { marginTop: Spacing.lg },
  link: { alignItems: 'center', marginTop: Spacing.md },
  linkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
