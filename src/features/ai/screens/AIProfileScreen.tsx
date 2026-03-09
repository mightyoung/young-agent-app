import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useAuthStore } from '../../auth/stores/authStore';

export default function AIProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { theme, isDark } = useTheme();

  const menuItems = [
    {
      title: '我的台账',
      icon: 'folder-outline',
      onPress: () => navigation.navigate('HazardList'),
    },
    {
      title: '我的任务',
      icon: 'clipboard-outline',
      onPress: () => navigation.navigate('SafetyCheck'),
    },
    {
      title: '我的隐患',
      icon: 'warning-outline',
      onPress: () => navigation.navigate('HazardList'),
    },
    {
      title: '设置',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 12,
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
    },
    content: {
      padding: 16,
    },
    userCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    username: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    role: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    enterprise: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 4,
    },
    stats: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.divider,
    },
    menu: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 12,
    },
  }), [theme, isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>个人中心</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={theme.colors.primaryText} />
          </View>
          <Text style={styles.username}>{user?.username || '用户'}</Text>
          <Text style={styles.role}>
            {user?.role === 'admin' ? '管理员' : user?.role === 'leader' ? '组长' : user?.role === 'inspector' ? '巡检人员' : '普通用户'}
          </Text>
          {user?.enterpriseName && <Text style={styles.enterprise}>{user.enterpriseName}</Text>}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>-</Text>
            <Text style={styles.statLabel}>检查记录</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>-</Text>
            <Text style={styles.statLabel}>我的隐患</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>-</Text>
            <Text style={styles.statLabel}>待办任务</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
