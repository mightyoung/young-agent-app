import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useHazardStore } from '../../hazard/stores/hazardStore';
import { useInspectionStore } from '../../inspection/stores/inspectionStore';
import { useAuthStore } from '../../auth/stores/authStore';

export default function AIDataCenterScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { hazards, fetchHazards } = useHazardStore();
  const { records, fetchRecords } = useInspectionStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchHazards();
    fetchRecords();
  }, []);

  // 判断用户角色权限
  const isAdmin = user?.role === 'admin';
  const isLeader = user?.role === 'leader';

  // 根据权限过滤隐患数据
  const filteredHazards = useMemo(() => {
    if (isAdmin || isLeader) {
      // 管理员或领导可以看到所有隐患
      return hazards;
    }
    // 普通用户只看到自己的
    return hazards.filter(h => h.userId === user?.id);
  }, [hazards, user, isAdmin, isLeader]);

  // 根据权限过滤检查记录
  const filteredRecords = useMemo(() => {
    if (isAdmin || isLeader) {
      return records;
    }
    return records.filter(r => r.userId === user?.id);
  }, [records, user, isAdmin, isLeader]);

  // 统计隐患数据
  const hazardStats = useMemo(() => ({
    total: filteredHazards.length,
    submitted: filteredHazards.filter(h => h.status === 'submitted').length,
    confirmed: filteredHazards.filter(h => h.status === 'confirmed').length,
    rectifying: filteredHazards.filter(h => h.status === 'rectifying').length,
    accepted: filteredHazards.filter(h => h.status === 'accepted').length,
  }), [filteredHazards]);

  // 统计检查记录
  const inspectionStats = useMemo(() => ({
    total: filteredRecords.length,
    completed: filteredRecords.filter(r => r.result === 'pass').length,
    pending: filteredRecords.filter(r => r.result !== 'pass').length,
  }), [filteredRecords]);

  // 样式
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
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    cardStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
  }), [theme, isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>台账管理</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 隐患台账 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('HazardList')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="warning-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>隐患台账</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </View>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{hazardStats.total}</Text>
              <Text style={styles.statLabel}>总计</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{hazardStats.submitted}</Text>
              <Text style={styles.statLabel}>待确认</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.info }]}>{hazardStats.confirmed}</Text>
              <Text style={styles.statLabel}>待整改</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.error }]}>{hazardStats.rectifying}</Text>
              <Text style={styles.statLabel}>待验收</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>{hazardStats.accepted}</Text>
              <Text style={styles.statLabel}>已验收</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 检查台账 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('InspectionHistory')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="clipboard-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>检查台账</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </View>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{inspectionStats.total}</Text>
              <Text style={styles.statLabel}>总计</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>{inspectionStats.completed}</Text>
              <Text style={styles.statLabel}>已完成</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{inspectionStats.pending}</Text>
              <Text style={styles.statLabel}>待执行</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 任务信息 */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SafetyCheck')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="list-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>任务信息</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </View>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>总计</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>-</Text>
              <Text style={styles.statLabel}>已完成</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>-</Text>
              <Text style={styles.statLabel}>进行中</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
