// ConfigModal - AI配置弹窗组件
// Provider选择、API Key输入、连接测试

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';
import type { ProviderType } from '../services/types';
import { providerFactory, DEFAULT_PROVIDERS } from '../services/provider/factory';
import { secureStorage } from '../services/secureStorage';

interface ConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function ConfigModal({ visible, onClose, onSuccess }: ConfigModalProps) {
  const { theme, isDark } = useTheme();
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 动态样式
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    providerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    providerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    providerItemSelected: {
      backgroundColor: isDark ? '#FFFFFF20' : `${theme.colors.primary}15`,
      borderColor: theme.colors.primary,
    },
    providerText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    providerTextSelected: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    streamingBadge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: '#52C41A',
      borderRadius: 8,
    },
    streamingBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
    },
    input: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.colors.text,
    },
    eyeButton: {
      padding: 12,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      gap: 8,
    },
    testButtonSuccess: {
      backgroundColor: '#52C41A',
    },
    testButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      padding: 12,
      backgroundColor: isDark ? '#FF000020' : '#FFF2F0',
      borderRadius: 8,
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.error,
    },
    footer: {
      padding: 16,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
    saveButton: {
      paddingVertical: 14,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.buttonDisabled,
    },
    saveButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  }), [theme, isDark]);

  // Provider列表
  const providers = Object.values(DEFAULT_PROVIDERS).filter(p => p.type !== 'custom');

  // 测试连接
  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestError('请输入API Key');
      return;
    }

    setTestStatus('testing');
    setTestError(null);

    try {
      // 临时保存API Key用于测试
      await secureStorage.setApiKey(apiKey, selectedProvider);

      // 尝试调用
      const provider = providerFactory.getProvider(selectedProvider);
      await provider.chat(
        [{ id: '1', role: 'user', content: 'hi', timestamp: Date.now() }],
        { maxTokens: 5 }
      );

      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : '连接失败');
      // 删除无效的API Key
      await secureStorage.deleteApiKey(selectedProvider);
    }
  };

  // 保存并使用
  const handleSave = async () => {
    if (!apiKey.trim()) {
      setTestError('请输入API Key');
      return;
    }

    if (testStatus !== 'success') {
      // 如果没有测试过，先测试
      await handleTest();
      if (testStatus === 'error') return;
    }

    setIsSaving(true);
    try {
      // 切换Provider
      await providerFactory.switchProvider(selectedProvider);
      onSuccess();
      onClose();
    } catch (error) {
      setTestError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 关闭时重置状态
  const handleClose = () => {
    setApiKey('');
    setTestStatus('idle');
    setTestError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>AI 配置</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* 选择模型 */}
          <Text style={styles.sectionTitle}>选择模型</Text>
          <View style={styles.providerGrid}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.type}
                style={[
                  styles.providerItem,
                  selectedProvider === provider.type && styles.providerItemSelected,
                ]}
                onPress={() => {
                  setSelectedProvider(provider.type);
                  setTestStatus('idle');
                  setTestError(null);
                }}
              >
                <Text
                  style={[
                    styles.providerText,
                    selectedProvider === provider.type && styles.providerTextSelected,
                  ]}
                >
                  {provider.name}
                </Text>
                {provider.supportsStreaming && (
                  <View style={styles.streamingBadge}>
                    <Text style={styles.streamingBadgeText}>流式</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* API Key输入 */}
          <Text style={styles.sectionTitle}>API Key</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="请输入API Key"
              placeholderTextColor={theme.colors.inputPlaceholder}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* 测试连接 */}
          <TouchableOpacity
            style={[
              styles.testButton,
              testStatus === 'success' && styles.testButtonSuccess,
            ]}
            onPress={handleTest}
            disabled={testStatus === 'testing'}
          >
            {testStatus === 'testing' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : testStatus === 'success' ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.testButtonText}>连接成功</Text>
              </>
            ) : (
              <Text style={styles.testButtonText}>测试连接</Text>
            )}
          </TouchableOpacity>

          {/* 错误信息 */}
          {testError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{testError}</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部保存按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!apiKey.trim() || isSaving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!apiKey.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>保存并使用</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default ConfigModal;
