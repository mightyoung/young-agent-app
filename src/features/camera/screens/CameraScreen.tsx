import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../../constants/themeV2';
import { useAuthStore } from '../../auth/stores/authStore';
import { useSettingsStore } from '../../profile/stores/settingsStore';

const { width, height } = Dimensions.get('window');

// Classic Design (Original Card-based) - Theme supported
function ClassicHomeContent() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state: any) => state.user);
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.colors.navbarBackground,
    },
    greeting: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    subGreeting: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    notificationButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
    },
    actionCard: {
      width: '47%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    scanCard: {
      backgroundColor: theme.colors.primary,
    },
    hazardCard: {
      backgroundColor: theme.colors.error,
    },
    safetyCard: {
      backgroundColor: theme.colors.success,
    },
    actionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    actionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    actionDesc: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },
    quickLinks: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 24,
      backgroundColor: theme.colors.card,
      marginTop: 12,
    },
    quickLink: {
      alignItems: 'center',
    },
    quickLinkText: {
      fontSize: 12,
      color: theme.colors.text,
      marginTop: 8,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好，{user?.username || '用户'}</Text>
          <Text style={styles.subGreeting}>工业安全检查专家</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Messages')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Action Buttons */}
      <View style={styles.actionContainer}>
        {/* Scan QR */}
        <TouchableOpacity
          style={[styles.actionCard, styles.scanCard]}
          onPress={() => navigation.navigate('ScanCheck', { deviceId: '' })}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="qr-code-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>扫码检查</Text>
          <Text style={styles.actionDesc}>扫描设备二维码进行巡检</Text>
        </TouchableOpacity>

        {/* Hazard Report */}
        <TouchableOpacity
          style={[styles.actionCard, styles.hazardCard]}
          onPress={() => navigation.navigate('HazardReport')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="camera-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>隐患随手拍</Text>
          <Text style={styles.actionDesc}>拍照上报安全隐患</Text>
        </TouchableOpacity>

        {/* Safety Check */}
        <TouchableOpacity
          style={[styles.actionCard, styles.safetyCard]}
          onPress={() => navigation.navigate('SafetyCheck', {})}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="clipboard-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>安全检查</Text>
          <Text style={styles.actionDesc}>执行检查任务</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('InspectionHistory')}
        >
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.quickLinkText}>检查历史</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('HazardList')}
        >
          <Ionicons name="warning-outline" size={24} color={theme.colors.warning} />
          <Text style={styles.quickLinkText}>隐患记录</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate('DeviceList')}
        >
          <Ionicons name="server-outline" size={24} color={theme.colors.success} />
          <Text style={styles.quickLinkText}>设备台账</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Modern Design (Dark theme with animations) - Theme aware
function ModernHomeContent() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state: any) => state.user);
  const { settings, toggleHomeScreenMode } = useSettingsStore();
  const { theme, isDark } = useTheme();

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.95);
  const taglineOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);
  const glow1Opacity = useSharedValue(0.3);
  const glow2Opacity = useSharedValue(0.2);
  const glow3Opacity = useSharedValue(0.25);

  useEffect(() => {
    // Logo reveal animation
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // Tagline animation
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // Buttons animation
    buttonsOpacity.value = withDelay(1400, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    buttonsTranslateY.value = withDelay(1400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Glow animations (looping)
    glow1Opacity.value = withSequence(
      withTiming(0.4, { duration: 5000 }),
      withTiming(0.2, { duration: 5000 })
    );
    glow2Opacity.value = withSequence(
      withTiming(0.3, { duration: 4000 }),
      withTiming(0.1, { duration: 4000 })
    );
    glow3Opacity.value = withSequence(
      withTiming(0.35, { duration: 4500 }),
      withTiming(0.15, { duration: 4500 })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const glow1Style = useAnimatedStyle(() => ({
    opacity: glow1Opacity.value,
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: glow2Opacity.value,
  }));

  const glow3Style = useAnimatedStyle(() => ({
    opacity: glow3Opacity.value,
  }));

  // Modern mode always uses dark theme (intentional design)
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A',
    },
    backgroundContainer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    glowBlob1: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: theme.colors.primary,
      top: -50,
      left: -50,
    },
    glowBlob2: {
      position: 'absolute',
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: '#4C1D95',
      bottom: -100,
      right: -50,
    },
    glowBlob3: {
      position: 'absolute',
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: '#3730A3',
      top: height * 0.25,
      right: width * 0.25,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      zIndex: 10,
    },
    greeting: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    subGreeting: {
      fontSize: 12,
      color: '#A1A1AA',
      marginTop: 4,
    },
    modeToggle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logoSection: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 32,
    },
    logoText: {
      fontSize: 42,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -1,
    },
    logoUnderline: {
      width: 48,
      height: 2,
      backgroundColor: theme.colors.primary,
      marginTop: 8,
    },
    taglineSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    taglineText: {
      fontSize: 14,
      fontWeight: '300',
      color: '#A1A1AA',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    buttonsContainer: {
      width: '100%',
      maxWidth: 320,
      gap: 12,
    },
    glassButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    glassButtonPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    quickLinks: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 32,
      width: '100%',
    },
    quickLink: {
      alignItems: 'center',
      padding: 12,
    },
    quickLinkText: {
      fontSize: 12,
      color: '#A1A1AA',
      marginTop: 6,
    },
    footer: {
      alignItems: 'center',
      paddingBottom: 24,
    },
    footerText: {
      fontSize: 10,
      color: '#52525B',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      {/* Background with animated glows */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.glowBlob1, glow1Style]} />
        <Animated.View style={[styles.glowBlob2, glow2Style]} />
        <Animated.View style={[styles.glowBlob3, glow3Style]} />
      </View>

      {/* Header with toggle */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好，{user?.username || '用户'}</Text>
          <Text style={styles.subGreeting}>工业安全检查专家</Text>
        </View>
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={toggleHomeScreenMode}
        >
          <Ionicons name="layers" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
          <Text style={styles.logoText}>Young-agent</Text>
          <View style={styles.logoUnderline} />
        </Animated.View>

        {/* Tagline Section */}
        <Animated.View style={[styles.taglineSection, taglineAnimatedStyle]}>
          <Text style={styles.taglineText}>你身边的安全助手</Text>
          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.primary, opacity: glow1Opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.primary, opacity: glow2Opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.primary, opacity: glow3Opacity },
              ]}
            />
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
          <TouchableOpacity
            style={styles.glassButton}
            onPress={() => navigation.navigate('ScanCheck', { deviceId: '' })}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>扫码检查</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassButton}
            onPress={() => navigation.navigate('HazardReport')}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>随手拍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassButtonPrimary}
            onPress={() => navigation.navigate('SafetyCheck', {})}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard-outline" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>安全检查</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('InspectionHistory')}
          >
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.quickLinkText}>检查历史</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('HazardList')}
          >
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <Text style={styles.quickLinkText}>隐患记录</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate('DeviceList')}
          >
            <Ionicons name="server-outline" size={20} color="#10B981" />
            <Text style={styles.quickLinkText}>设备台账</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by MightYoung</Text>
      </View>
    </View>
  );
}

// Main Component that conditionally renders based on settings
export default function CameraScreen() {
  const { settings } = useSettingsStore();

  return settings.homeScreenMode === 'modern' ? <ModernHomeContent /> : <ClassicHomeContent />;
}
