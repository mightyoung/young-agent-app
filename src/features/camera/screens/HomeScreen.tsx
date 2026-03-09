import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, withRepeat, Easing, interpolate } from 'react-native-reanimated';
import { useAuthStore } from '../../auth/stores/authStore';
import { useTheme } from '../../../../constants/themeV2';

function AnimatedChar({ char, delay }: { char: string; delay: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withDelay(delay, withTiming(1, { duration: 200 })); }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={charStyles.char}>{char}</Animated.Text>;
}

function TypewriterText({ text }: { text: string }) {
  return <View style={charStyles.typewriterContainer}>{text.split('').map((char, i) => <AnimatedChar key={i} char={char} delay={i * 100} />)}</View>;
}

function FlowTextEffect({ theme }: { theme: any }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false); }, []);
  const leftGlow = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0]), transform: [{ translateX: interpolate(progress.value, [0, 0.5, 1], [-15, 0, 15]) }] }));
  const rightGlow = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.4, 0]), transform: [{ translateX: interpolate(progress.value, [0, 0.5, 1], [15, 0, -15]) }] }));
  const centerGlow = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.25, 0]) }));
  return (
    <View style={[charStyles.flowContainer]}>
      <Animated.Text style={[charStyles.flowText, { marginRight: -4 }, leftGlow]}>Young-agent</Animated.Text>
      <Animated.Text style={[charStyles.flowText, centerGlow]}>Young-agent</Animated.Text>
      <Animated.Text style={[charStyles.flowText, { marginLeft: -4 }, rightGlow]}>Young-agent</Animated.Text>
      <Text style={[charStyles.logoText, { color: theme.colors.text }]}>Young-agent</Text>
    </View>
  );
}

function AnimatedUnderline() {
  const scaleX = useSharedValue(0);
  useEffect(() => { scaleX.value = withDelay(1500, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })); }, []);
  return <Animated.View style={[charStyles.underline, { opacity: scaleX.value, transform: [{ scaleX: scaleX.value }] }]} />;
}

function TaglineSection({ theme }: { theme: any }) {
  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withDelay(2300, withTiming(1, { duration: 600 })); }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[charStyles.taglineSection, animatedStyle]}><Text style={[charStyles.taglineText, { color: theme.colors.textSecondary }]}>你身边的安全助手</Text></Animated.View>;
}

const charStyles = StyleSheet.create({
  typewriterContainer: { flexDirection: 'row' },
  char: { fontSize: 16, fontWeight: '400' },
  flowContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', height: 80 },
  logoText: { fontSize: 60, fontWeight: '700', letterSpacing: -1 },
  flowText: { position: 'absolute', fontSize: 60, fontWeight: '700', letterSpacing: -1 },
  underline: { width: 45, height: 1, backgroundColor: '#FFFFFF', transformOrigin: 'center' },
  taglineSection: { alignItems: 'center', marginBottom: 80 },
  taglineText: { fontSize: 14, fontWeight: '300', letterSpacing: 4, textTransform: 'uppercase' },
});

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);
  const { theme, isDark } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    background: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.background },
    logoutButtonContainer: { position: 'absolute', top: 60, left: 20, zIndex: 100 },
    logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
    content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
    greetingSection: { marginBottom: 8 },
    logoSection: { alignItems: 'center', marginBottom: 8 },
    underlineSection: { alignItems: 'center', marginBottom: 32 },
    buttonsContainer: { width: '100%', gap: 24 },
    actionButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: isDark ? theme.colors.text : theme.colors.button, borderRadius: theme.borderRadius.lg, paddingVertical: 16, paddingHorizontal: 24 },
    actionText: { fontSize: 16, fontWeight: '500', color: isDark ? '#000000' : theme.colors.buttonText },
    footer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
    footerText: { fontSize: 10, color: theme.colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase' },
  }), [theme, isDark]);

  const username = user?.username || '用户';
  const greetingText = `你好，${username}！`;
  const logoOpacity = useSharedValue(0), logoScale = useSharedValue(0.95), buttonsOpacity = useSharedValue(0), buttonsTranslateY = useSharedValue(30), logoutOpacity = useSharedValue(0);

  useEffect(() => {
    const d = greetingText.length * 100 + 500;
    logoOpacity.value = withDelay(d, withTiming(1, { duration: 1500 }));
    logoScale.value = withDelay(d, withTiming(1, { duration: 1500 }));
    buttonsOpacity.value = withDelay(2900, withTiming(1, { duration: 600 }));
    buttonsTranslateY.value = withDelay(2900, withTiming(0, { duration: 600 }));
    logoutOpacity.value = withDelay(3700, withTiming(1, { duration: 500 }));
  }, []);

  const logoAnim = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const buttonsAnim = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value, transform: [{ translateY: buttonsTranslateY.value }] }));
  const logoutAnim = useAnimatedStyle(() => ({ opacity: logoutOpacity.value }));

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <Animated.View style={[styles.logoutButtonContainer, logoutAnim]}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.content}>
        <View style={styles.greetingSection}><TypewriterText text={greetingText} /></View>
        <Animated.View style={[styles.logoSection, logoAnim]}><FlowTextEffect theme={theme} /></Animated.View>
        <View style={styles.underlineSection}><AnimatedUnderline /></View>
        <TaglineSection theme={theme} />
        <Animated.View style={[styles.buttonsContainer, buttonsAnim]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CameraEntry')} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={20} color={isDark ? '#000000' : theme.colors.buttonText} />
            <Text style={styles.actionText}>随手拍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            // 先导航到Main Tab，然后切换到AI Tab
            navigation.navigate('Main', { screen: 'AI' });
          }} activeOpacity={0.8}>
            <Ionicons name="bulb-outline" size={20} color={isDark ? '#000000' : theme.colors.buttonText} />
            <Text style={styles.actionText}>智能助手</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>Powered by MightYoung</Text></View>
    </View>
  );
}
