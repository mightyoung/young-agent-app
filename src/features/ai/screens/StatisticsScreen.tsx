import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useHazardStore } from '../../hazard/stores/hazardStore';
import { useInspectionStore } from '../../inspection/stores/inspectionStore';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark, themeMode } = useTheme();
  const { hazards, fetchHazards } = useHazardStore();
  const { records, fetchRecords } = useInspectionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHazards();
    fetchRecords();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchHazards(), fetchRecords()]);
    setRefreshing(false);
  };

  // 计算统计数据
  const stats = useMemo(() => {
    const totalHazards = hazards.length;
    const pendingHazards = hazards.filter(h => h.status === 'submitted').length;
    const confirmedHazards = hazards.filter(h => h.status === 'confirmed').length;
    const rectifyingHazards = hazards.filter(h => h.status === 'rectifying').length;
    const acceptedHazards = hazards.filter(h => h.status === 'accepted').length;

    const totalInspections = records.length;
    const passInspections = records.filter(r => r.result === 'pass').length;
    const failInspections = records.filter(r => r.result === 'fail').length;
    const partialInspections = records.filter(r => r.result === 'partial').length;

    return {
      totalHazards,
      pendingHazards,
      confirmedHazards,
      rectifyingHazards,
      acceptedHazards,
      totalInspections,
      passInspections,
      failInspections,
      partialInspections,
    };
  }, [hazards, records]);

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
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    statItem: {
      width: (width - 52) / 2,
      backgroundColor: theme.colors.backgroundTertiary,
      borderRadius: theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 6,
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.divider,
      borderRadius: 4,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    summaryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    dangerRate: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 16,
    },
    dangerRateLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
  }), [theme, themeMode]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>统计分析</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 隐患统计 */}
        <Text style={styles.sectionTitle}>隐患统计</Text>
        <View style={styles.card}>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalHazards}</Text>
              <Text style={styles.statLabel}>隐患总数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.pendingHazards}</Text>
              <Text style={styles.statLabel}>待确认</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.info }]}>{stats.confirmedHazards}</Text>
              <Text style={styles.statLabel}>已确认</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.rectifyingHazards}</Text>
              <Text style={styles.statLabel}>整改中</Text>
            </View>
          </View>
        </View>

        {/* 安全检查统计 */}
        <Text style={styles.sectionTitle}>安全检查统计</Text>
        <View style={styles.card}>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalInspections}</Text>
              <Text style={styles.statLabel}>检查总数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.passInspections}</Text>
              <Text style={styles.statLabel}>合格</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.failInspections}</Text>
              <Text style={styles.statLabel}>不合格</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.partialInspections}</Text>
              <Text style={styles.statLabel}>部分合格</Text>
            </View>
          </View>
        </View>

        {/* 综合分析 */}
        <Text style={styles.sectionTitle}>综合分析</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>隐患处理情况</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>总隐患数</Text>
            <Text style={styles.summaryValue}>{stats.totalHazards}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>已验收</Text>
            <Text style={styles.summaryValue}>{stats.acceptedHazards}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>处理中</Text>
            <Text style={styles.summaryValue}>{stats.confirmedHazards + stats.rectifyingHazards}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>待处理</Text>
            <Text style={styles.summaryValue}>{stats.pendingHazards}</Text>
          </View>

          {stats.totalHazards > 0 && (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((stats.acceptedHazards + stats.confirmedHazards + stats.rectifyingHazards) / stats.totalHazards * 100)}%`,
                      backgroundColor: theme.colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dangerRateLabel}>
                处理完成率: {Math.round((stats.acceptedHazards + stats.confirmedHazards + stats.rectifyingHazards) / stats.totalHazards * 100)}%
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
