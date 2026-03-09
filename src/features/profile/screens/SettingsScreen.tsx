import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../auth/stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme, ThemeMode } from '../../../../constants/themeV2';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  const { theme, isDark, setThemeMode, themeMode } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    content: { padding: 16 },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.cardBorder },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    userInfo: { marginLeft: 16 },
    username: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    role: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.cardBorder, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuText: { fontSize: 16, color: theme.colors.text, marginLeft: 12 },
    version: { fontSize: 14, color: theme.colors.textTertiary },
    logoutButton: { backgroundColor: theme.colors.error, borderRadius: theme.borderRadius.lg, padding: 16, alignItems: 'center' },
    logoutText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    themeLabel: { fontSize: 16, color: theme.colors.text },
    themeSwitch: { flexDirection: 'row', alignItems: 'center' },
    themeOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 8 },
    themeOptionActive: { backgroundColor: theme.colors.primary },
    themeOptionText: { fontSize: 12, fontWeight: '600' },
  }), [theme]);

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { title: '离线模式', icon: 'cloud-offline-outline', right: (
      <Switch value={settings.offlineEnabled} onValueChange={(v) => updateSettings({ offlineEnabled: v })}
        trackColor={{ false: '#D9D9D9', true: theme.colors.primary + '60' }}
        thumbColor={settings.offlineEnabled ? theme.colors.primary : '#F5F5F5'} />
    )},
    { title: 'WiFi下同步', icon: 'wifi-outline', right: (
      <Switch value={settings.syncOnWifiOnly} onValueChange={(v) => updateSettings({ syncOnWifiOnly: v })}
        trackColor={{ false: '#D9D9D9', true: theme.colors.primary + '60' }}
        thumbColor={settings.syncOnWifiOnly ? theme.colors.primary : '#F5F5F5'} />
    )},
  ];

  const toggleTheme = () => {
    setThemeMode(isDark ? 'blue' : 'bw');
  };

  const getRoleText = (role?: string) => {
    const map: Record<string, string> = { admin: '管理员', leader: '组长', inspector: '巡检人员' };
    return map[role || ''] || '普通用户';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.username || '用户'}</Text>
            <Text style={styles.role}>{getRoleText(user?.role)}</Text>
          </View>
        </View>

        {/* 主题风格切换 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.themeRow} onPress={toggleTheme}>
              <View style={styles.menuLeft}>
                <Ionicons name={themeMode === 'bw' ? 'moon' : 'sunny'} size={20} color={theme.colors.primary} />
                <Text style={styles.menuText}>主题风格</Text>
              </View>
              <View style={styles.themeSwitch}>
                <View style={[styles.themeOption, themeMode === 'bw' && styles.themeOptionActive]}>
                  <Text style={[styles.themeOptionText, { color: themeMode === 'bw' ? '#FFF' : theme.colors.text }]}>黑白</Text>
                </View>
                <View style={[styles.themeOption, themeMode === 'blue' && styles.themeOptionActive]}>
                  <Text style={[styles.themeOptionText, { color: themeMode === 'blue' ? '#FFF' : theme.colors.text }]}>白蓝</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能设置</Text>
          <View style={styles.card}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                {item.right || <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.card}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.menuText}>版本信息</Text>
              </View>
              <Text style={styles.version}>v1.0.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
