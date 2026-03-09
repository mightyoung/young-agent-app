import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAIService } from '../services/aiService';
import { initializeAIService, isAIServiceReady } from '../services/init';
import { toolRegistry } from '../services/tools';
import { StreamingMessage } from '../components/StreamingMessage';
import { ActionCard } from '../components/ActionCard';
import { ConfigModal } from '../components/ConfigModal';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { ImageUploadButton } from '../components/ImageUploadButton';
import { useTheme } from '../../../../constants/themeV2';
import { useHazardStore } from '../../hazard/stores/hazardStore';
import type { Message, QuickAction, ErrorType } from '../services/types';

export default function AIAssistantScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark, themeMode } = useTheme();

  // 主题化样式
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    errorType,
    thinkingContent,
    displayContent,
    streamingProgress,
    currentMessageId,
    sendMessage,
    executeQuickAction,
    loadHistory,
    clearHistory,
    stopStreaming,
    setError,
    failedMessages,
    retryMessage,
    clearFailedMessage,
    currentIntent,
    currentAnalysis,
    analyzeHazardData,
    clearAnalysis,
  } = useAIService();

  const [input, setInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showActionCard, setShowActionCard] = useState(false);
  const [actionCardConfig, setActionCardConfig] = useState<{
    content: string;
    variant: 'init' | 'expired';
    actions: { label: string; action: 'navigate' | 'dismiss' | 'retry' }[];
  } | null>(null);

  // R5: 语音和图像状态
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 隐患选择弹窗
  const [showHazardSelectModal, setShowHazardSelectModal] = useState(false);
  const { hazards, fetchHazards } = useHazardStore();

  const flatListRef = useRef<FlatList>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        const ready = await initializeAIService();
        if (ready) {
          setIsInitialized(true);
          loadHistory();
        } else {
          // 未配置 API Key，显示引导卡片
          setActionCardConfig({
            content: '您好！我是Young-agentAI助手。为了更好地为您服务，请先配置AI模型。',
            variant: 'init',
            actions: [
              { label: '去配置', action: 'navigate' },
              { label: '稍后再说', action: 'dismiss' },
            ],
          });
          setShowActionCard(true);
        }
      } catch (err) {
        setInitError(err instanceof Error ? err.message : '初始化失败');
      }
    };
    init();
  }, []);

  // R3.1: 错误处理 - 检测 API Key 失效、网络错误、速率限制
  useEffect(() => {
    if (!error) return;

    // R3.1.1: API Key 失效
    if (errorType === 'API_KEY_EXPIRED') {
      setActionCardConfig({
        content: 'AI服务连接失败，API Key可能已失效。请重新配置后继续使用。',
        variant: 'expired',
        actions: [
          { label: '重新配置', action: 'navigate' },
          { label: '重试连接', action: 'retry' },
        ],
      });
      setShowActionCard(true);
      setError(null);
    }
    // R3.1.2: 网络错误
    else if (errorType === 'NETWORK_ERROR') {
      setActionCardConfig({
        content: '网络连接失败，请检查您的网络设置后重试。',
        variant: 'expired',
        actions: [
          { label: '重新配置', action: 'navigate' },
          { label: '重试', action: 'retry' },
        ],
      });
      setShowActionCard(true);
      setError(null);
    }
    // R3.1.3: 速率限制
    else if (errorType === 'RATE_LIMIT') {
      setActionCardConfig({
        content: 'AI服务请求过于频繁，请稍后再试。',
        variant: 'expired',
        actions: [
          { label: '重新配置', action: 'navigate' },
          { label: '稍后重试', action: 'dismiss' },
        ],
      });
      setShowActionCard(true);
      setError(null);
    }
  }, [error, errorType]);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, displayContent, thinkingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');

    // Demo mode: 如果未初始化，使用模拟回复
    if (!isInitialized) {
      const demoResponses = [
        '您好！感谢您的消息。当前处于演示模式，您可以体验AI助手的基本功能。请在设置中配置API Key以解锁完整功能。',
        '我已收到您的消息。这是演示模式的回复，您可以体验对话功能。配置API Key后，我可以为您提供更专业的服务。',
        '演示模式已启用。我可以模拟回复，但无法访问真实数据。请配置API Key以使用完整功能。',
      ];
      const demoResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: userInput,
        timestamp: Date.now(),
      };

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: demoResponse,
        timestamp: Date.now(),
      };

      useAIService.setState((state) => ({
        messages: [...state.messages, userMessage, assistantMessage],
      }));
      return;
    }

    const tools = toolRegistry.getToolsForLLM() as any;
    await sendMessage(userInput, tools);
  };

  // R5.1: 语音输入处理
  const handleVoiceInput = (text: string) => {
    if (text) {
      setInput((prev) => prev + text);
    }
  };

  // R5.2: 图像选择处理
  const handleImageSelected = (uri: string) => {
    setSelectedImages((prev) => [...prev, uri]);
  };

  // R5.2: 图像分析结果处理
  const handleImageAnalyzed = (uri: string, result: any) => {
    setIsAnalyzing(false);
    if (result.success && result.description) {
      // 将分析结果添加到输入框
      setInput((prev) => prev + `\n[图片分析: ${result.description}]`);
    }
  };

  // R5.2: 清除已选图像
  const clearSelectedImages = () => {
    setSelectedImages([]);
  };

  const quickActions: QuickAction[] = [
    { id: '1', text: '本周任务', icon: 'clipboard', action: 'weeklyTask' },
    { id: '2', text: '知识库', icon: 'book', action: 'knowledgeBase' },
    { id: '3', text: '统计分析', icon: 'stats-chart', action: 'statistics' },
    { id: '4', text: '分析隐患', icon: 'analytics', action: 'analyzeHazard' },
  ];

  const handleQuickAction = async (action: QuickAction) => {
    // Demo mode: 如果未初始化，显示提示
    if (!isInitialized) {
      Alert.alert('提示', '当前为演示模式，配置API Key后可使用完整功能');
      return;
    }

    // R4.2: 处理隐患分析快捷操作 - 弹出选择框
    if (action.action === 'analyzeHazard') {
      // 先获取隐患列表
      await fetchHazards();
      if (hazards.length === 0) {
        Alert.alert('提示', '暂无隐患记录可分析');
        return;
      }
      setShowHazardSelectModal(true);
      return;
    }

    // 统计分析 - 跳转到统计页面
    if (action.action === 'statistics') {
      navigation.navigate('Statistics');
      return;
    }

    // 知识库 - 跳转到知识库页面
    if (action.action === 'knowledgeBase') {
      navigation.navigate('KnowledgeBase');
      return;
    }

    await executeQuickAction(action);
  };

  // R2.1: 替换消息渲染 - 使用 StreamingMessage
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isCurrentStreaming = item.id === currentMessageId && isStreaming;

    // 当前正在流式回复的消息，使用动态内容
    if (isCurrentStreaming) {
      return (
        <StreamingMessage
          content={displayContent}
          thinking={thinkingContent}
          isStreaming={isStreaming}
          thinkingProgress={streamingProgress}
          thinkingComplete={!isStreaming}
          isUser={isUser}
        />
      );
    }

    // 其他消息，直接显示内容
    return (
      <StreamingMessage
        content={item.content}
        thinking=""
        isStreaming={false}
        thinkingProgress={0}
        thinkingComplete={true}
        isUser={isUser}
      />
    );
  };

  // R2.3: ActionCard 动作处理
  const handleActionCardAction = async (action: 'navigate' | 'dismiss' | 'retry') => {
    setShowActionCard(false);

    if (action === 'navigate') {
      setShowConfigModal(true);
    } else if (action === 'retry') {
      setShowActionCard(false);
      const ready = await initializeAIService();
      if (!ready) {
        setActionCardConfig({
          content: 'AI服务连接失败，请重新配置API Key。',
          variant: 'expired',
          actions: [
            { label: '去配置', action: 'navigate' },
          ],
        });
        setShowActionCard(true);
      }
    }
  };

  // 配置成功回调
  const handleConfigSuccess = async () => {
    // 重新初始化AI服务以加载新保存的API Key
    const ready = await initializeAIService();
    if (ready) {
      setIsInitialized(true);
      loadHistory();
    }
    setShowConfigModal(false);
  };

  // Show initialization error
  if (initError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI助手</Text>
        </View>
        <ErrorState error={initError} onRetry={async () => {
          setInitError(null);
          const ready = await initializeAIService();
          setIsInitialized(ready);
          if (!ready) {
            setInitError('API Key 未配置');
          }
        }} theme={theme} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI助手</Text>
        <View style={styles.headerRight}>
          {isStreaming && (
            <TouchableOpacity onPress={stopStreaming} style={styles.stopButton}>
              <Ionicons name="stop-circle-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearHistory}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickAction}
            onPress={() => handleQuickAction(action)}
          >
            <Ionicons name={action.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>{action.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListFooterComponent={
          isStreaming ? (
            <View style={styles.streamingIndicator}>
              <Text style={styles.streamingText}>AI正在思考... {streamingProgress}%</Text>
            </View>
          ) : null
        }
      />

      {/* R3.2: 失败消息显示区域 */}
      {failedMessages.length > 0 && (
        <View style={styles.failedMessagesContainer}>
          <Text style={styles.failedMessagesTitle}>
            发送失败的消息 ({failedMessages.length})
          </Text>
          {failedMessages.map((msg) => (
            <View key={msg.id} style={styles.failedMessageItem}>
              <View style={styles.failedMessageContent}>
                <Text style={styles.failedMessageText} numberOfLines={2}>
                  {msg.content}
                </Text>
                <Text style={styles.failedMessageError}>
                  {msg.errorType === 'API_KEY_EXPIRED' && 'API Key 失效'}
                  {msg.errorType === 'NETWORK_ERROR' && '网络错误'}
                  {msg.errorType === 'RATE_LIMIT' && '请求过于频繁'}
                  {msg.errorType === 'UNKNOWN' && '未知错误'}
                </Text>
              </View>
              <View style={styles.failedMessageActions}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => retryMessage(msg.id)}
                >
                  <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                  <Text style={styles.retryButtonText}>重试</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => clearFailedMessage(msg.id)}
                >
                  <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* R4.2: 隐患分析结果显示 */}
      {currentAnalysis && (
        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>隐患分析结果</Text>
            <TouchableOpacity onPress={clearAnalysis}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 风险等级 */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisLabel}>风险等级</Text>
            <View style={styles.riskBadgeContainer}>
              <View style={[
                styles.riskBadge,
                currentAnalysis.riskAssessment.overallLevel === 'critical' && styles.riskBadgeCritical,
                currentAnalysis.riskAssessment.overallLevel === 'high' && styles.riskBadgeHigh,
                currentAnalysis.riskAssessment.overallLevel === 'medium' && styles.riskBadgeMedium,
                currentAnalysis.riskAssessment.overallLevel === 'low' && styles.riskBadgeLow,
              ]}>
                <Text style={styles.riskBadgeText}>
                  {currentAnalysis.riskAssessment.overallLevel === 'critical' && '重大'}
                  {currentAnalysis.riskAssessment.overallLevel === 'high' && '高'}
                  {currentAnalysis.riskAssessment.overallLevel === 'medium' && '中'}
                  {currentAnalysis.riskAssessment.overallLevel === 'low' && '低'}
                </Text>
              </View>
              <Text style={styles.trendText}>
                {currentAnalysis.riskAssessment.trend === 'improving' && '↑ 改善中'}
                {currentAnalysis.riskAssessment.trend === 'stable' && '→ 稳定'}
                {currentAnalysis.riskAssessment.trend === 'worsening' && '↓ 恶化'}
              </Text>
            </View>
          </View>

          {/* 摘要 */}
          <View style={styles.analysisSection}>
            <Text style={styles.analysisLabel}>摘要</Text>
            <Text style={styles.analysisText}>{currentAnalysis.summary}</Text>
          </View>

          {/* 建议 */}
          {currentAnalysis.recommendations.length > 0 && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisLabel}>整改建议</Text>
              {currentAnalysis.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>{rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* R5.1: 语音输入按钮 */}
        <VoiceInputButton
          onResult={handleVoiceInput}
          disabled={!isInitialized || isLoading}
        />

        {/* R5.2: 图像上传按钮 */}
        <ImageUploadButton
          onImageSelected={handleImageSelected}
          onAnalyze={handleImageAnalyzed}
          disabled={!isInitialized || isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder={isInitialized ? "请输入您的问题..." : "AI 服务初始化中..."}
          value={input}
          onChangeText={setInput}
          placeholderTextColor={theme.colors.inputPlaceholder}
          multiline
          editable={isInitialized && !isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!isInitialized || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!isInitialized || isLoading}
        >
          <Ionicons name="send" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* R2.3: ActionCard 引导卡片 */}
      <Modal visible={showActionCard} transparent animationType="fade">
        <View style={styles.actionCardOverlay}>
          {actionCardConfig && (
            <ActionCard
              content={actionCardConfig.content}
              variant={actionCardConfig.variant}
              actions={actionCardConfig.actions}
              onAction={(action) => handleActionCardAction(action.action)}
            />
          )}
        </View>
      </Modal>

      {/* R3: 配置 Modal */}
      <ConfigModal
        visible={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSuccess={handleConfigSuccess}
      />

      {/* R4.3: 隐患选择弹窗 */}
      <Modal visible={showHazardSelectModal} transparent animationType="slide">
        <View style={styles.hazardModalOverlay}>
          <View style={[styles.hazardModalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.hazardModalHeader}>
              <Text style={[styles.hazardModalTitle, { color: theme.colors.text }]}>选择要分析的隐患</Text>
              <TouchableOpacity onPress={() => setShowHazardSelectModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={hazards}
              keyExtractor={(item) => item.id}
              style={styles.hazardModalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.hazardModalItem, { borderBottomColor: theme.colors.divider }]}
                  onPress={async () => {
                    setShowHazardSelectModal(false);
                    await analyzeHazardData(item.id);
                  }}
                >
                  <View style={styles.hazardModalItemContent}>
                    <Text style={[styles.hazardModalItemTitle, { color: theme.colors.text }]}>
                      {item.businessNo || item.typeName}
                    </Text>
                    <Text style={[styles.hazardModalItemDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.hazardModalEmpty}>
                  <Text style={{ color: theme.colors.textSecondary }}>暂无隐患记录</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// 错误状态组件
const ErrorState = ({ error, onRetry, theme }: { error: string; onRetry: () => void; theme: any }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
    <Ionicons name="warning-outline" size={48} color={theme.colors.warning} />
    <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16, marginBottom: 24 }}>{error}</Text>
    <TouchableOpacity
      style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
      onPress={onRetry}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>重试</Text>
    </TouchableOpacity>
  </View>
);

// 主题化样式
const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  quickAction: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  messageList: {
    padding: 16,
  },
  typingIndicator: {
    padding: 8,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  streamingIndicator: {
    padding: 8,
    alignItems: 'center',
  },
  streamingText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  failedMessagesContainer: {
    backgroundColor: theme.colors.backgroundTertiary,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  failedMessagesTitle: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  failedMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  failedMessageContent: {
    flex: 1,
    marginRight: 10,
  },
  failedMessageText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  failedMessageError: {
    fontSize: 11,
    color: theme.colors.error,
    marginTop: 4,
  },
  failedMessageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: 14,
  },
  retryButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 6,
  },
  analysisContainer: {
    backgroundColor: theme.colors.card,
    margin: 12,
    borderRadius: 12,
    padding: 16,
    ...theme.shadow.md,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  analysisSection: {
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  riskBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundTertiary,
  },
  riskBadgeCritical: {
    backgroundColor: theme.colors.error + '30',
  },
  riskBadgeHigh: {
    backgroundColor: theme.colors.warning + '30',
  },
  riskBadgeMedium: {
    backgroundColor: '#FFF9C4',
  },
  riskBadgeLow: {
    backgroundColor: theme.colors.success + '30',
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  trendText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  recommendationText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#FFFFFF' : theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: isDark ? '#333333' : theme.colors.buttonDisabled,
  },
  actionCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  // 隐患选择弹窗样式
  hazardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  hazardModalContainer: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  hazardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  hazardModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  hazardModalList: {
    paddingHorizontal: 16,
  },
  hazardModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  hazardModalItemContent: {
    flex: 1,
  },
  hazardModalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  hazardModalItemDesc: {
    fontSize: 13,
  },
  hazardModalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
});

