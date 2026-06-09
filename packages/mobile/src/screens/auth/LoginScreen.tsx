import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, FONTS } from '../../utils/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!password) { Alert.alert('Error', 'Password is required'); return; }
    if (!email && !phone) { Alert.alert('Error', 'Email or phone is required'); return; }

    setLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email: !usePhone ? email.toLowerCase() : undefined, phone: usePhone ? phone : undefined, password });
      await setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);

      if (res.data.user.role === 'RIDER') {
        router.replace('/(rider)/dashboard');
      } else {
        router.replace('/(customer)/home');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🏍️</Text>
          <Text style={styles.brand}>Quick Rider GH</Text>
          <Text style={styles.tagline}>Fast. Reliable. Local.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>

          {/* Toggle email/phone */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !usePhone && styles.toggleActive]}
              onPress={() => setUsePhone(false)}
            >
              <Text style={[styles.toggleText, !usePhone && styles.toggleTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, usePhone && styles.toggleActive]}
              onPress={() => setUsePhone(true)}
            >
              <Text style={[styles.toggleText, usePhone && styles.toggleTextActive]}>Phone</Text>
            </TouchableOpacity>
          </View>

          {usePhone ? (
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={COLORS.textMuted}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={COLORS.textMuted}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerBtnText}>Create an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.riderLink} onPress={() => router.push('/auth/register?role=RIDER')}>
            <Text style={styles.riderLinkText}>Register as a Rider →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.green },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 56, marginBottom: 12 },
  brand: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  toggleRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: 10, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: COLORS.green },
  toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  toggleTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: COLORS.text, marginBottom: 12, backgroundColor: COLORS.bg },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: COLORS.green, fontWeight: '500' },
  loginBtn: { backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 13 },
  registerBtn: { borderWidth: 1.5, borderColor: COLORS.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  registerBtnText: { color: COLORS.green, fontSize: 15, fontWeight: '600' },
  riderLink: { alignItems: 'center', marginTop: 16 },
  riderLinkText: { color: COLORS.gold, fontSize: 14, fontWeight: '600' },
});
