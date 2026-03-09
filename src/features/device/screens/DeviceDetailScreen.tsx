import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useDeviceStore } from '../stores/deviceStore';
import { Device } from '../../../types';

export default function DeviceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { id } = route.params;

  const [device, setDevice] = useState<Device | null>(null);
  const { fetchDeviceById } = useDeviceStore();

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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
    },
    actionButton: {
      flexDirection: 'row',
      height: 48,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primaryText,
    },
  }), [theme]);

  useEffect(() => {
    const loadDevice = async () => {
      const data = await fetchDeviceById(id);
      setDevice(data);
    };
    loadDevice();
  }, [id]);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.colors.textSecondary }}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设备详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>设备名称</Text>
              <Text style={styles.value}>{device.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>设备类型</Text>
              <Text style={styles.value}>{device.typeName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>位置</Text>
              <Text style={styles.value}>{device.locationName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>设备编号</Text>
              <Text style={styles.value}>{device.qrCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>状态</Text>
              <Text style={[styles.value, { color: device.status === 'normal' ? theme.colors.success : theme.colors.warning }]}>
                {device.status === 'normal' ? '正常' : device.status === 'warning' ? '警告' : '异常'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ScanCheck', { deviceId: device.id })}>
          <Ionicons name="qr-code-outline" size={20} color={theme.colors.primaryText} />
          <Text style={styles.actionButtonText}>扫码检查</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
