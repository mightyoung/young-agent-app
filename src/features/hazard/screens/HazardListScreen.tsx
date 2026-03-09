import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useHazardStore } from '../stores/hazardStore';
import { HazardStatus } from '../../../types';
import { config } from '../../../core/constants/config';
import { useTheme } from '../../../../constants/themeV2';

export default function HazardListScreen() {
  const navigation = useNavigation<any>();
  const { hazards, fetchHazards, isLoading } = useHazardStore();
  const [filter, setFilter] = useState<HazardStatus | 'all'>('all');
  const { theme, isDark } = useTheme();

  useEffect(() => {
    fetchHazards();
  }, []);

  const filteredHazards = filter === 'all' ? hazards : hazards.filter((h) => h.status === filter);

  const getStatusConfig = (status: HazardStatus) => {
    return config.hazardStatusFlow.statusConfig[status as keyof typeof config.hazardStatusFlow.statusConfig]
      || { text: status, color: '#8C8C8C' };
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
    },
    filter: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      flexWrap: 'wrap',
    },
    filterButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: isDark ? theme.colors.text : theme.colors.primary,
      borderColor: isDark ? theme.colors.text : theme.colors.primary,
    },
    filterText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    filterTextActive: {
      color: isDark ? theme.colors.background : theme.colors.textInverse,
    },
    list: {
      padding: 20,
      paddingTop: 0,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.xl,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    description: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 26,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    locationText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.textTertiary,
    },
  }), [theme, isDark]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐患记录</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filter}>
        {(['all', 'submitted', 'confirmed', 'rectifying', 'accepted'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filter === status && styles.filterButtonActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'all' ? '全部' : status === 'submitted' ? '待确认' : status === 'confirmed' ? '已确认' : status === 'rectifying' ? '整改中' : '已验收'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredHazards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => fetchHazards()}
        renderItem={({ item }) => {
          const statusConfig = getStatusConfig(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('HazardDetail', { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.typeText}>{item.businessNo || item.typeName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                  <Text style={styles.statusText}>{statusConfig.text}</Text>
                </View>
              </View>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.locationText}>{item.locationName || '未指定位置'}</Text>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无隐患记录</Text>
          </View>
        }
      />
    </View>
  );
}
