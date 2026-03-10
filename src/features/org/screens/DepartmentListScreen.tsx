import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDepartmentStore } from '../stores/departmentStore';
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { Department } from '../types';
import { colors } from '../../../core/constants/colors';

interface DepartmentWithEnterprise extends Department {
  enterpriseName?: string;
}

export default function DepartmentListScreen() {
  const navigation = useNavigation<any>();
  const { departments, isLoading, fetchDepartments } = useDepartmentStore();
  const { enterprises, fetchEnterprises } = useEnterpriseStore();
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchEnterprises();
  }, []);

  const getEnterpriseName = (enterpriseId: string) => {
    const enterprise = enterprises.find((e) => e.id === enterpriseId);
    return enterprise?.name || '未知企业';
  };

  const filteredDepartments = selectedEnterpriseId
    ? departments.filter((d) => d.enterpriseId === selectedEnterpriseId)
    : departments;

  // Build tree structure
  const rootDepartments = filteredDepartments.filter((d) => !d.parentId);

  const renderDepartment = (department: DepartmentWithEnterprise, level: number = 0) => {
    const subDepartments = filteredDepartments.filter((d) => d.parentId === department.id);

    return (
      <View key={department.id}>
        <TouchableOpacity
          style={[styles.card, { marginLeft: level * 20 }]}
          onPress={() => navigation.navigate('DepartmentDetail', { id: department.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.departmentName}>{department.name}</Text>
            <View style={[styles.statusBadge, department.status === 1 ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusText}>{department.status === 1 ? '正常' : '禁用'}</Text>
            </View>
          </View>
          <Text style={styles.infoText}>🏢 {getEnterpriseName(department.enterpriseId)}</Text>
          {department.code && <Text style={styles.infoText}>📋 编码: {department.code}</Text>}
          {department.leaderNames && department.leaderNames.length > 0 && (
            <Text style={styles.infoText}>👤 负责人: {department.leaderNames.join(', ')}</Text>
          )}
        </TouchableOpacity>
        {subDepartments.map((sub) => renderDepartment({ ...sub, enterpriseName: getEnterpriseName(sub.enterpriseId) }, level + 1))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !selectedEnterpriseId && styles.filterButtonActive]}
          onPress={() => setSelectedEnterpriseId(null)}
        >
          <Text style={[styles.filterText, !selectedEnterpriseId && styles.filterTextActive]}>
            全部
          </Text>
        </TouchableOpacity>
        {enterprises.map((enterprise) => (
          <TouchableOpacity
            key={enterprise.id}
            style={[styles.filterButton, selectedEnterpriseId === enterprise.id && styles.filterButtonActive]}
            onPress={() => setSelectedEnterpriseId(enterprise.id)}
          >
            <Text style={[styles.filterText, selectedEnterpriseId === enterprise.id && styles.filterTextActive]}>
              {enterprise.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rootDepartments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderDepartment({ ...item, enterpriseName: getEnterpriseName(item.enterpriseId) })}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无部门信息</Text>
            <Text style={styles.emptySubText}>点击下方按钮新增部门</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DepartmentForm', { enterpriseId: selectedEnterpriseId })}
      >
        <Text style={styles.fabText}>+ 新增部门</Text>
      </TouchableOpacity>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
