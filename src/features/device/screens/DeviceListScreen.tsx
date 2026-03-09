import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceStore } from '../stores/deviceStore';
import { useTheme } from '../../../../constants/themeV2';

export default function DeviceListScreen() {
  const navigation = useNavigation<any>();
  const { devices, fetchDevices, isLoading } = useDeviceStore();
  const { theme, isDark } = useTheme();

  useEffect(() => { fetchDevices(); }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
    list: { padding: 16 },
    card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.cardBorder },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    deviceName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusText: { fontSize: 12, color: '#FFFFFF' },
    cardContent: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { fontSize: 12, color: theme.colors.textSecondary },
    cardFooter: { borderTopWidth: 1, borderTopColor: theme.colors.divider, paddingTop: 8 },
    qrCode: { fontSize: 12, color: theme.colors.textTertiary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 16, color: theme.colors.textTertiary },
  }), [theme]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#8C8C8C';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = { normal: '正常', warning: '警告', error: '异常', offline: '离线' };
    return map[status] || status;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设备台账</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={() => fetchDevices()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DeviceDetail', { id: item.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoItem}>
                <Ionicons name="pricetag-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>{item.typeName || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>{item.locationName || '-'}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.qrCode}>编号: {item.qrCode}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>暂无设备</Text></View>}
      />
    </View>
  );
}
