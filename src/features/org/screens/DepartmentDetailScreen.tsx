import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDepartmentStore } from '../stores/departmentStore';
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { Department } from '../types';
import { colors } from '../../../core/constants/colors';

export default function DepartmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fetchDepartmentById, deleteDepartment } = useDepartmentStore();
  const { enterprises, fetchEnterprises } = useEnterpriseStore();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [route.params.id]);

  const loadData = async () => {
    setIsLoading(true);
    await fetchEnterprises();
    const data = await fetchDepartmentById(route.params.id);
    setDepartment(data);
    setIsLoading(false);
  };

  const getEnterpriseName = (enterpriseId: string) => {
    const enterprise = enterprises.find((e) => e.id === enterpriseId);
    return enterprise?.name || '未知企业';
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这个部门吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteDepartment(route.params.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading || !department) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{department.name}</Text>
        <View style={[styles.statusBadge, department.status === 1 ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{department.status === 1 ? '正常' : '禁用'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>部门名称</Text>
          <Text style={styles.value}>{department.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>部门编码</Text>
          <Text style={styles.value}>{department.code || '未设置'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>所属企业</Text>
          <Text style={styles.value}>{getEnterpriseName(department.enterpriseId)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>创建时间</Text>
          <Text style={styles.value}>
            {department.createdAt ? new Date(department.createdAt).toLocaleDateString() : '未知'}
          </Text>
        </View>
      </View>

      {department.leaderNames && department.leaderNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>负责人</Text>
          {department.leaderNames.map((name, index) => (
            <View key={index} style={styles.leaderItem}>
              <Text style={styles.leaderName}>👤 {name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('DepartmentForm', { id: department.id })}
        >
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  leaderItem: {
    paddingVertical: 8,
  },
  leaderName: {
    fontSize: 14,
    color: colors.text,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
