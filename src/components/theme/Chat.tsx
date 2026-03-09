/**
 * 主题化聊天消息组件
 * 黑白主题(Grok): 深色背景，用户消息白色，AI消息深灰
 * 白蓝主题(Telegram): 白色背景，用户消息浅绿(#DCF8C6)，AI消息白色
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../constants/themeV2';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  time?: string;
  status?: 'sending' | 'sent' | 'read';
  style?: ViewStyle;
}

export function ChatBubble({ message, isUser, time, status, style }: ChatBubbleProps) {
  const { theme, themeMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: theme.animation.duration.normal, useNativeDriver: true }).start();
  }, []);

  // Telegram风格气泡样式
  const isTelegram = themeMode === 'blue';
  const bubbleColor = isUser ? theme.colors.userBubble : theme.colors.aiBubble;

  const getBubbleStyle = (): ViewStyle => ({
    backgroundColor: bubbleColor,
    borderRadius: 18,
    borderBottomLeftRadius: isUser ? 18 : 4,
    borderBottomRightRadius: isUser ? 4 : 18,
  });

  const getTextColor = () => {
    if (themeMode === 'bw') return isUser ? '#000000' : '#FFFFFF';
    return '#000000'; // Telegram始终黑字
  };

  return (
    <Animated.View style={[styles.container, { alignItems: isUser ? 'flex-end' : 'flex-start', opacity: fadeAnim }, style]}>
      <View style={[styles.bubble, getBubbleStyle(), { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 16, marginVertical: 4 }]}>
        <Text style={[styles.message, { color: getTextColor(), fontSize: theme.typography.chatMessage }]}>{message}</Text>
      </View>
      {time && (
        <Text style={[styles.time, { color: theme.colors.textTertiary, fontSize: theme.typography.chatTime, marginHorizontal: 20, marginTop: 2 }]}>
          {time}
          {isUser && status === 'read' && ' ✓✓'}
          {isUser && status === 'sent' && ' ✓'}
        </Text>
      )}
    </Animated.View>
  );
}

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  onVoicePress?: () => void;
  onAttachmentPress?: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChangeText, onSend, placeholder = '输入消息...', onVoicePress, onAttachmentPress, disabled = false }: ChatInputProps) {
  const { theme, themeMode } = useTheme();
  const isTelegram = themeMode === 'blue';

  return (
    <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.divider, paddingHorizontal: 12, paddingVertical: 8 }]}>
      {/* 附件按钮 - Telegram风格显示 */}
      {isTelegram && onAttachmentPress && (
        <TouchableOpacity style={styles.iconButton} onPress={onAttachmentPress}>
          <Ionicons name="attach" size={22} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      )}

      <View style={[styles.inputWrapper, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderRadius: 20 }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text, fontSize: theme.typography.body }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.inputPlaceholder}
          multiline
          maxLength={5000}
          editable={!disabled}
        />
      </View>

      {/* 发送按钮 */}
      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: theme.colors.primary, borderRadius: 20 }, !value.trim() && styles.sendButtonDisabled]}
        onPress={() => value.trim() && onSend()}
        disabled={disabled || !value.trim()}
      >
        <Ionicons name="send" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// 聊天头部组件
interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  avatar?: string;
}

export function ChatHeader({ title, subtitle, onBack }: ChatHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.divider }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      )}
      <View style={styles.headerContent}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  bubble: { overflow: 'hidden' },
  message: { lineHeight: 22 },
  time: {},
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 0.5, minHeight: 60 },
  inputWrapper: { flex: 1, borderWidth: 1, minHeight: 40, maxHeight: 120 },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  iconButton: { padding: 8, marginRight: 4 },
  sendButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1 },
  headerBack: { marginRight: 8 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
});

export default ChatBubble;
