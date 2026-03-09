// StreamingMessage - 流式消息组件
// 支持打字机效果和思考模式显示

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ThinkingView } from './ThinkingView';
import { useTheme } from '../../../../constants/themeV2';

interface StreamingMessageProps {
  /** 消息内容 */
  content: string;
  /** 思考内容 */
  thinking?: string;
  /** 是否正在流式传输 */
  isStreaming: boolean;
  /** 思考进度 */
  thinkingProgress: number;
  /** 思考是否完成 */
  thinkingComplete: boolean;
  /** 是否是用户消息 */
  isUser?: boolean;
}

export function StreamingMessage({
  content,
  thinking = '',
  isStreaming,
  thinkingProgress,
  thinkingComplete,
  isUser = false,
}: StreamingMessageProps) {
  const { theme, themeMode } = useTheme();

  const isTelegram = themeMode === 'blue';

  // 主题化样式
  const styles = useMemo(() => {
    const userBubbleColor = isTelegram ? theme.colors.userBubble : (isUser ? '#FFFFFF' : theme.colors.aiBubble);
    const aiBubbleColor = isTelegram ? theme.colors.aiBubble : theme.colors.aiBubble;
    const userTextColor = isTelegram ? '#000000' : (isUser ? '#000000' : '#FFFFFF');
    const aiTextColor = isTelegram ? '#000000' : '#FFFFFF';

    return StyleSheet.create({
      messageContainer: {
        marginBottom: 12,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      },
      userMessageContainer: {
        alignItems: 'flex-end',
      },
      messageBubble: {
        maxWidth: '80%',
        backgroundColor: isUser ? userBubbleColor : aiBubbleColor,
        borderRadius: 18,
        borderBottomLeftRadius: isUser ? 18 : 4,
        borderBottomRightRadius: isUser ? 4 : 18,
        padding: 12,
      },
      userMessageBubble: {
        maxWidth: '80%',
        backgroundColor: userBubbleColor,
        borderRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 4,
        padding: 12,
      },
      messageText: {
        fontSize: theme.typography.chatMessage || 14,
        color: isUser ? userTextColor : aiTextColor,
        lineHeight: 22,
      },
      userMessageText: {
        fontSize: theme.typography.chatMessage || 14,
        color: userTextColor,
        lineHeight: 22,
      },
      cursor: {
        color: theme.colors.primary,
      },
    });
  }, [theme, themeMode, isUser, isTelegram]);
  // 打字机效果状态
  const [displayContent, setDisplayContent] = useState('');
  const [displayThinking, setDisplayThinking] = useState('');
  const cursorAnim = useRef(new Animated.Value(1)).current;

  // 光标闪烁动画
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    if (isStreaming) {
      animation.start();
    } else {
      animation.stop();
    }

    return () => animation.stop();
  }, [isStreaming, cursorAnim]);

  // 内容打字机效果 - 词组模式
  useEffect(() => {
    if (content === displayContent) return;

    const words = content.split(/(\s+|[，。！？、；：""''（）])/);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= words.length) {
        clearInterval(interval);
        return;
      }

      setDisplayContent(prev => prev + words[currentIndex]);
      currentIndex++;
    }, 80); // 80ms间隔

    return () => clearInterval(interval);
  }, [content]);

  // 思考内容打字机效果
  useEffect(() => {
    if (thinking === displayThinking) return;

    const words = thinking.split(/(\s+|[，。！？、；：""''（）])/);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= words.length) {
        clearInterval(interval);
        return;
      }

      setDisplayThinking(prev => prev + words[currentIndex]);
      currentIndex++;
    }, 60); // 思考内容稍微快一点

    return () => clearInterval(interval);
  }, [thinking]);

  // 用户消息直接显示
  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <View style={styles.userMessageBubble}>
          <Text style={styles.userMessageText}>{content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.messageContainer}>
      {/* 思考区域 - 仅在有思考内容时显示 */}
      {(displayThinking.length > 0 || isStreaming) && (
        <ThinkingView
          content={displayThinking}
          progress={thinkingProgress}
          isComplete={thinkingComplete}
        />
      )}

      {/* 回复内容 */}
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>
          {displayContent}
          {isStreaming && (
            <Animated.Text
              style={[
                styles.cursor,
                { opacity: cursorAnim },
              ]}
            >
              ▌
            </Animated.Text>
          )}
        </Text>
      </View>
    </View>
  );
}

export default StreamingMessage;
