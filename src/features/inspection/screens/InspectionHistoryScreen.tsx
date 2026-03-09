import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInspectionStore } from '../stores/inspectionStore';
import { useTheme } from '../../../../constants/themeV2';

export default function InspectionHistoryScreen() {
  const navigation = useNavigation<any>();
  const { records, fetchRecords, isLoading } = useInspectionStore();
  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const { theme, isDark } = useTheme();

  useEffect(() => { fetchRecords(); }, []);

  const filteredRecords = filter === 'all' ? records : records.filter((r) => r.status === 'completed');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    filter: { flexDirection: 'row', padding: 16, gap: 12 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.card },
    filterButtonActive: { backgroundColor: isDark ? theme.colors.text : theme.colors.primary },
    filterText: { fontSize: 14, color: theme.colors.textSecondary },
    filterTextActive: { color: isDark ? theme.colors.background : theme.colors.textInverse },
    list: { padding: 16 },
    card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.cardBorder },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    deviceName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 12, color: '#FFFFFF' },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    typeText: { fontSize: 14, color: theme.colors.textSecondary },
    dateText: { fontSize: 12, color: theme.colors.textTertiary },
    resultRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.divider },
    resultLabel: { fontSize: 12, color: theme.colors.textTertiary },
    resultValue: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, color: theme.colors.textTertiary },
  }), [theme, isDark]);

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { completed: '#4CAF50', draft: '#FF9800', in_progress: '#2196F3' };
    return map[status] || '#8C8C8C';
  };

  const getResultColor = (result?: string) => {
    const map: Record<string, string> = { pass: '#4CAF50', fail: '#F44336', partial: '#FF9800' };
    return map[result || ''] || '#8C8C8C';
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { completed: '已完成', draft: '草稿', in_progress: '进行中' };
    return map[status] || status;
  };

  const getResultText = (result?: string) => {
    const map: Record<string, string> = { pass: '合格', fail: '不合格', partial: '部分合格' };
    return map[result || ''] || result;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>检查历史</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.filter}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]} onPress={() => setFilter('completed')}>
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>已完成</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={fetchRecords}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('InspectionDetail', { id: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.deviceName}>{item.deviceName || '未知设备'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.typeText}>{item.type === 'scan' ? '扫码检查' : item.type === 'safety' ? '安全检查' : '任务检查'}</Text>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.result && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>检查结果：</Text>
                <Text style={[styles.resultValue, { color: getResultColor(item.result) }]}>{getResultText(item.result)}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>暂无检查记录</Text></View>}
      />
    </View>
  );
}
