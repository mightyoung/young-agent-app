import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useDeviceStore } from '../../device/stores/deviceStore';
import { useInspectionStore } from '../../inspection/stores/inspectionStore';
import { useAuthStore } from '../../auth/stores/authStore';

export default function ScanCheckScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { deviceId } = route.params || {};

  const [inputDeviceId, setInputDeviceId] = useState(deviceId || '');
  const { fetchDeviceByQR, currentDevice } = useDeviceStore();
  const { createRecord } = useInspectionStore();
  const user = useAuthStore((state) => state.user);

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
      flex: 1,
      padding: 16,
    },
    scanArea: {
      alignItems: 'center',
      marginBottom: 32,
    },
    scanButton: {
      width: 200,
      height: 200,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    scanText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.primary,
      marginTop: 12,
    },
    scanHint: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 4,
    },
    inputArea: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
    },
    searchButton: {
      height: 44,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    searchButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primaryText,
    },
    hint: {
      marginTop: 24,
      padding: 16,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
    },
    hintTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    hintText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 4,
    },
  }), [theme]);

  useEffect(() => {
    if (deviceId) {
      handleSearch(deviceId);
    }
  }, [deviceId]);

  const handleSearch = async (qrCode: string) => {
    const device = await fetchDeviceByQR(qrCode);
    if (device) {
      const record = await createRecord({
        deviceId: device.id,
        deviceName: device.name,
        userId: user?.id,
        userName: user?.username,
        type: 'scan',
      });
      navigation.navigate('InspectionDetail', { id: record.id });
    }
  };

  const handleScan = () => {
    if (inputDeviceId) {
      handleSearch(inputDeviceId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>扫码检查</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scanArea}>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Ionicons name="qr-code" size={64} color={theme.colors.primary} />
            <Text style={styles.scanText}>点击扫描二维码</Text>
            <Text style={styles.scanHint}>或输入设备编号</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputArea}>
          <Text style={styles.label}>设备编号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入或扫描设备二维码"
            value={inputDeviceId}
            onChangeText={setInputDeviceId}
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(inputDeviceId)}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintTitle}>测试设备编号：</Text>
          <Text style={styles.hintText}>dev1_loc1_type1_dept1</Text>
          <Text style={styles.hintText}>dev2_loc2_type1_dept1</Text>
          <Text style={styles.hintText}>dev3_loc3_type2_dept1</Text>
        </View>
      </ScrollView>
    </View>
  );
}
