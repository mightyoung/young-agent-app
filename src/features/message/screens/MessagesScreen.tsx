import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../../types';
import { useTheme } from '../../../../constants/themeV2';

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const [messages] = useState<Message[]>([
    { id: '1', type: 'hazard_review', title: '新隐患待审核', content: '有一条新的隐患记录需要审核', userId: '1', readStatus: false, createdAt: Date.now() - 3600000 },
    { id: '2', type: 'task', title: '新任务分配', content: '您有一个新的检查任务', userId: '1', readStatus: true, createdAt: Date.now() - 86400000 },
    { id: '3', type: 'announcement', title: '系统公告', content: '系统维护通知', userId: '1', readStatus: true, createdAt: Date.now() - 172800000 },
  ]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    list: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.cardBorder },
    unreadCard: { backgroundColor: isDark ? theme.colors.backgroundSecondary : theme.colors.backgroundTertiary },
    iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 16, fontWeight: '500', color: theme.colors.text },
    unreadText: { fontWeight: '700' },
    time: { fontSize: 12, color: theme.colors.textTertiary },
    message: { fontSize: 14, color: theme.colors.textSecondary },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error, marginLeft: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, color: theme.colors.textTertiary },
  }), [theme, isDark]);

  const getTypeIcon = (type: string): any => {
    const map: Record<string, string> = { hazard_review: 'warning', task: 'clipboard', announcement: 'notifications', default: 'mail' };
    return map[type] || map.default;
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = { hazard_review: '#F44336', task: '#1E40AF', announcement: '#F59E0B', default: '#3B82F6' };
    return map[type] || map.default;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息中心</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, !item.readStatus && styles.unreadCard]}>
            <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
              <Ionicons name={getTypeIcon(item.type)} size={24} color={getTypeColor(item.type)} />
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !item.readStatus && styles.unreadText]}>{item.title}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.message} numberOfLines={1}>{item.content}</Text>
            </View>
            {!item.readStatus && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>暂无消息</Text></View>}
      />
    </View>
  );
}
