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
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { Enterprise } from '../types';
import { colors } from '../../../core/constants/colors';

export default function EnterpriseDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fetchEnterpriseById, deleteEnterprise } = useEnterpriseStore();
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnterprise();
  }, [route.params.id]);

  const loadEnterprise = async () => {
    setIsLoading(true);
    const data = await fetchEnterpriseById(route.params.id);
    setEnterprise(data);
    setIsLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这个企业吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteEnterprise(route.params.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading || !enterprise) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{enterprise.name}</Text>
        <View style={[styles.statusBadge, enterprise.status === 1 ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{enterprise.status === 1 ? '正常' : '禁用'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>企业名称</Text>
          <Text style={styles.value}>{enterprise.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>联系电话</Text>
          <Text style={styles.value}>{enterprise.contactPhone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>地址</Text>
          <Text style={styles.value}>{enterprise.address || '未设置'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>创建时间</Text>
          <Text style={styles.value}>
            {enterprise.createdAt ? new Date(enterprise.createdAt).toLocaleDateString() : '未知'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EnterpriseForm', { id: enterprise.id })}
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
