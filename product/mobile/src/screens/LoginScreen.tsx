import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiErrorMessage } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function LoginScreen() {
  const { login, unlock } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    unlock().catch(() => undefined);
  }, [unlock]);

  async function submit() {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await login(email.trim(), password, rememberMe);
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Sign in failed. Check your details and try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={['#0B1020', '#151B36', '#243B6B']} style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <View style={styles.brand}>
          <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
          <Text style={styles.eyebrow}>AEC INSTITUTIONAL PLATFORM</Text>
          <Text style={styles.title}>CampusOS</Text>
          <Text style={styles.subtitle}>Your secure academic workspace, wherever you are.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in with your existing CampusOS account</Text>
          <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email, username, or ID" placeholderTextColor="#8490AB" value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#8490AB" value={password} onChangeText={setPassword} style={styles.input} />
          <Pressable onPress={() => setRememberMe((value) => !value)} style={styles.remember}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>{rememberMe && <Text style={styles.check}>✓</Text>}</View>
            <Text style={styles.rememberText}>Remember this device</Text>
          </Pressable>
          {!!message && <Text style={styles.error}>{message}</Text>}
          <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign in securely</Text>}
          </Pressable>
          <Text style={styles.securityNote}>JWT session • secure device storage • biometric unlock</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  mark: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#9BD8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  markText: { color: '#0B1020', fontSize: 30, fontWeight: '900' },
  eyebrow: { color: '#A8B9DF', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', letterSpacing: -1.5, marginTop: 4 },
  subtitle: { color: '#CAD3EA', textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 300 },
  card: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  cardTitle: { color: '#11182B', fontSize: 24, fontWeight: '800' },
  cardSubtitle: { color: '#66718A', fontSize: 13, marginTop: 6, marginBottom: 22 },
  input: { backgroundColor: '#F2F5FA', borderRadius: 14, color: '#11182B', fontSize: 15, paddingHorizontal: 16, paddingVertical: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E7EBF2' },
  remember: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#B6C0D1', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  checkboxOn: { backgroundColor: '#1C6FE8', borderColor: '#1C6FE8' },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  rememberText: { color: '#4D5870', fontSize: 13 },
  error: { color: '#C23B52', fontSize: 13, marginTop: 8, lineHeight: 19 },
  button: { alignItems: 'center', backgroundColor: '#1C6FE8', borderRadius: 14, paddingVertical: 16, marginTop: 18 },
  pressed: { opacity: 0.8 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  securityNote: { color: '#8B96AA', fontSize: 10, textAlign: 'center', marginTop: 18 },
});