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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEnterpriseStore } from '../stores/enterpriseStore';
import { EnterpriseFormData } from '../types';
import { colors } from '../../../core/constants/colors';

export default function EnterpriseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { createEnterprise, updateEnterprise, fetchEnterpriseById } = useEnterpriseStore();

  const isEdit = !!route.params?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EnterpriseFormData>({
    name: '',
    contactPhone: '',
    address: '',
    status: 1,
  });

  useEffect(() => {
    if (isEdit) {
      loadEnterprise();
    }
  }, [isEdit]);

  const loadEnterprise = async () => {
    setIsLoading(true);
    const enterprise = await fetchEnterpriseById(route.params.id);
    if (enterprise) {
      setFormData({
        name: enterprise.name,
        contactPhone: enterprise.contactPhone,
        address: enterprise.address,
        status: enterprise.status,
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('错误', '请输入企业名称');
      return;
    }
    if (!formData.contactPhone.trim()) {
      Alert.alert('错误', '请输入联系电话');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateEnterprise(route.params.id, formData);
      } else {
        await createEnterprise(formData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.label}>企业名称 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="请输入企业名称"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>联系电话 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.contactPhone}
            onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
            placeholder="请输入联系电话"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>地址</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="请输入详细地址"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
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
              {isEdit ? '保存修改' : '创建企业'}
            </Text>
          )}
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
});
