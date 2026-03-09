import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import { useInspectionStore } from '../../inspection/stores/inspectionStore';
import { InspectionRecord } from '../../../types';

export default function InspectionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { id } = route.params;

  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [notes, setNotes] = useState('');
  const { fetchRecordById, createRecord } = useInspectionStore();

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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
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
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    notes: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    notesInput: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      minHeight: 100,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      height: 48,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      color: theme.colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [theme]);

  // 提交检查记录
  const handleSubmit = async () => {
    try {
      await createRecord({
        notes,
        result: 'partial',
        type: 'free',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to submit inspection:', error);
    }
  };

  useEffect(() => {
    const loadRecord = async () => {
      // 如果是新建检查
      if (id === 'new') {
        setIsNewRecord(true);
        setRecord(null);
        return;
      }

      const data = await fetchRecordById(id);
      setRecord(data);
    };
    loadRecord();
  }, [id]);

  // 加载中
  if (!isNewRecord && !record) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>检查详情</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  // 新建检查表单
  if (isNewRecord) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>新建检查</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>检查备注</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                placeholder="请输入检查备注..."
                placeholderTextColor={theme.colors.inputPlaceholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>提交检查</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>检查详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>设备名称</Text>
              <Text style={styles.value}>{record?.deviceName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>检查类型</Text>
              <Text style={styles.value}>
                {record?.type === 'scan' ? '扫码检查' : record?.type === 'safety' ? '安全检查' : '任务检查'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>检查人员</Text>
              <Text style={styles.value}>{record?.userName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>检查时间</Text>
              <Text style={styles.value}>
                {record?.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>检查结果</Text>
              <Text style={[styles.value, { color: record?.result === 'pass' ? theme.colors.success : record?.result === 'fail' ? theme.colors.error : theme.colors.warning }]}>
                {record?.result === 'pass' ? '合格' : record?.result === 'fail' ? '不合格' : '部分合格'}
              </Text>
            </View>
          </View>
        </View>

        {record?.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <View style={styles.card}>
              <Text style={styles.notes}>{record.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
