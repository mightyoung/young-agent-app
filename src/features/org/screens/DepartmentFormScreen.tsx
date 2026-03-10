import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDepartmentStore } from '../stores/departmentStore';
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { DepartmentFormData } from '../types';
import { colors } from '../../../core/constants/colors';

export default function DepartmentFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { createDepartment, updateDepartment, fetchDepartmentById, departments } = useDepartmentStore();
  const { enterprises, fetchEnterprises } = useEnterpriseStore();

  const isEdit = !!route.params?.id;
  const initialEnterpriseId = route.params?.enterpriseId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    code: '',
    enterpriseId: initialEnterpriseId || '',
    parentId: undefined,
    leaderIds: [],
    leaderNames: [],
    sortOrder: 0,
    status: 1,
  });

  const [showEnterprisePicker, setShowEnterprisePicker] = useState(false);
  const [showParentPicker, setShowParentPicker] = useState(false);

  useEffect(() => {
    fetchEnterprises();
    if (isEdit) {
      loadDepartment();
    }
  }, [isEdit]);

  const loadDepartment = async () => {
    setIsLoading(true);
    const department = await fetchDepartmentById(route.params.id);
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        enterpriseId: department.enterpriseId,
        parentId: department.parentId,
        leaderIds: department.leaderIds,
        leaderNames: department.leaderNames,
        sortOrder: department.sortOrder,
        status: department.status,
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('错误', '请输入部门名称');
      return;
    }
    if (!formData.enterpriseId) {
      Alert.alert('错误', '请选择所属企业');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateDepartment(route.params.id, formData);
      } else {
        await createDepartment(formData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get parent departments (excluding current if editing)
  const parentDepartments = departments.filter(
    (d) => d.enterpriseId === formData.enterpriseId && (!isEdit || d.id !== route.params.id)
  );

  const selectedEnterprise = enterprises.find((e) => e.id === formData.enterpriseId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>部门名称 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="请输入部门名称"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>部门编码</Text>
          <TextInput
            style={styles.input}
            value={formData.code}
            onChangeText={(text) => setFormData({ ...formData, code: text })}
            placeholder="请输入部门编码"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>所属企业 <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowEnterprisePicker(true)}
          >
            <Text style={selectedEnterprise ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedEnterprise?.name || '请选择企业'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>上级部门</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowParentPicker(true)}
          >
            <Text style={formData.parentId ? styles.pickerText : styles.pickerPlaceholder}>
              {parentDepartments.find((d) => d.id === formData.parentId)?.name || '请选择上级部门(可选)'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>负责人</Text>
          <View style={styles.leaderContainer}>
            {formData.leaderNames.map((name, index) => (
              <View key={index} style={styles.leaderChip}>
                <Text style={styles.leaderChipText}>{name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newNames = formData.leaderNames.filter((_, i) => i !== index);
                    const newIds = formData.leaderIds.filter((_, i) => i !== index);
                    setFormData({ ...formData, leaderNames: newNames, leaderIds: newIds });
                  }}
                >
                  <Text style={styles.removeLeader}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addLeaderButton}
              onPress={() => {
                const newLeaderName = prompt('请输入负责人姓名:');
                if (newLeaderName?.trim()) {
                  const newId = `user_${Date.now()}`;
                  setFormData({
                    ...formData,
                    leaderIds: [...formData.leaderIds, newId],
                    leaderNames: [...formData.leaderNames, newLeaderName.trim()],
                  });
                }
              }}
            >
              <Text style={styles.addLeaderText}>+ 添加负责人</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>状态</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>正常</Text>
            <Switch
              value={formData.status === 1}
              onValueChange={(value) => setFormData({ ...formData, status: value ? 1 : 0 })}
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={formData.status === 1 ? '#4CAF50' : '#BDBDBD'}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? '保存修改' : '创建部门'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Enterprise Picker Modal */}
      <Modal visible={showEnterprisePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择企业</Text>
            <FlatList
              data={enterprises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, enterpriseId: item.id, parentId: undefined });
                    setShowEnterprisePicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowEnterprisePicker(false)}
            >
              <Text style={styles.modalCloseText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Parent Department Picker Modal */}
      <Modal visible={showParentPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择上级部门</Text>
            <FlatList
              data={[{ id: '', name: '无' }, ...parentDepartments]}
              keyExtractor={(item) => item.id || 'none'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, parentId: item.id || undefined });
                    setShowParentPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowParentPicker(false)}
            >
              <Text style={styles.modalCloseText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#D32F2F',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  leaderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  leaderChipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeLeader: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 4,
    padding: 4,
  },
  addLeaderButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addLeaderText: {
    color: colors.primary,
    fontSize: 14,
  },
  switchGroup: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  modalClose: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
