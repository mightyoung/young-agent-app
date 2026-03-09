import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../../../../constants/themeV2';

// Flow风格动态模糊特效
function FlowTextEffect({ theme }: { theme: any }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const leftGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0]);
    const translateX = interpolate(progress.value, [0, 0.5, 1], [-15, 0, 15]);
    return { opacity, transform: [{ translateX }] };
  });

  const rightGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.4, 0]);
    const translateX = interpolate(progress.value, [0, 0.5, 1], [15, 0, -15]);
    return { opacity, transform: [{ translateX }] };
  });

  const centerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.25, 0]),
  }));

  return (
    <View style={flowStyles.flowContainer}>
      <Animated.Text style={[flowStyles.flowText, { marginRight: -4 }, leftGlowStyle]}>
        Young-agent
      </Animated.Text>
      <Animated.Text style={[flowStyles.flowText, centerGlowStyle]}>
        Young-agent
      </Animated.Text>
      <Animated.Text style={[flowStyles.flowText, { marginLeft: -4 }, rightGlowStyle]}>
        Young-agent
      </Animated.Text>
      <Text style={[flowStyles.logoText, { color: theme.colors.text }]}>Young-agent</Text>
    </View>
  );
}

const flowStyles = StyleSheet.create({
  flowContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 3,
  },
  flowText: {
    position: 'absolute',
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 3,
  },
});

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const { theme, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    backgroundGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.background },
    content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
    logoSection: { alignItems: 'center', marginBottom: 56 },
    subtitle: { fontSize: 17, color: theme.colors.textSecondary, marginTop: 14, letterSpacing: 1 },
    form: { width: '100%' },
    input: {
      height: 58, backgroundColor: theme.colors.inputBackground, borderRadius: theme.borderRadius.lg,
      paddingHorizontal: 20, fontSize: theme.typography.body, color: theme.colors.text, marginBottom: 14,
      borderWidth: 1, borderColor: theme.colors.inputBorder,
    },
    loginButton: {
      height: 58, backgroundColor: theme.colors.button, borderRadius: theme.borderRadius.lg,
      justifyContent: 'center', alignItems: 'center', marginTop: 10,
    },
    loginButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.buttonText, letterSpacing: 1 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 26 },
    footerText: { fontSize: 14, color: theme.colors.textTertiary },
    registerText: { fontSize: 14, color: theme.colors.text, fontWeight: '600', marginLeft: 4 },
  }), [theme]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { Alert.alert('提示', '请输入用户名和密码'); return; }
    try { await login(username.trim(), password); } catch (error: any) { Alert.alert('登录失败', error.message || '请检查用户名和密码'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGradient} />
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <FlowTextEffect theme={theme} />
          <Text style={styles.subtitle}>你身边的安全助手</Text>
        </View>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="用户名或手机号" placeholderTextColor={theme.colors.inputPlaceholder} value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="密码" placeholderTextColor={theme.colors.inputPlaceholder} value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color={theme.colors.buttonText} /> : <Text style={styles.loginButtonText}>登录</Text>}
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.footerText}>没有账号？</Text>
            <TouchableOpacity><Text style={styles.registerText}>立即注册</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
