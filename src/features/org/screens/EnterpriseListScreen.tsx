import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { Enterprise } from '../types';
import { colors } from '../../../core/constants/colors';

export default function EnterpriseListScreen() {
  const navigation = useNavigation<any>();
  const { enterprises, isLoading, fetchEnterprises, deleteEnterprise } = useEnterpriseStore();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const filteredEnterprises = enterprises.filter((e) =>
    e.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个企业吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteEnterprise(id);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Enterprise }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EnterpriseDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.enterpriseName}>{item.name}</Text>
        <View style={[styles.statusBadge, item.status === 1 ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.status === 1 ? '正常' : '禁用'}</Text>
        </View>
      </View>
      <Text style={styles.infoText}>📞 {item.contactPhone}</Text>
      <Text style={styles.infoText}>📍 {item.address}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索企业..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredEnterprises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无企业信息</Text>
            <Text style={styles.emptySubText}>点击下方按钮新增企业</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EnterpriseForm')}
      >
        <Text style={styles.fabText}>+ 新增企业</Text>
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
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
  enterpriseName: {
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
