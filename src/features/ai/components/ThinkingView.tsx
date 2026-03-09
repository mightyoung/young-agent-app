// ThinkingView - 思考模式显示组件
// DeepSeek风格: 灰色背景 + 斜体文字 + 固定2行高度 + 滚动查看

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';

interface ThinkingViewProps {
  /** 思考内容 */
  content: string;
  /** 进度百分比 (0-100) */
  progress: number;
  /** 是否完成思考 */
  isComplete?: boolean;
}

export function ThinkingView({ content, progress, isComplete = false }: ThinkingViewProps) {
  const { theme, themeMode } = useTheme();

  const isTelegram = themeMode === 'blue';

  // 主题化样式
  const styles = useMemo(() => {
    const bgColor = isTelegram ? theme.colors.backgroundTertiary : theme.colors.backgroundSecondary;
    return StyleSheet.create({
      container: {
        backgroundColor: bgColor,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        maxHeight: 100,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
      },
      label: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        marginLeft: 4,
      },
      progressBar: {
        flex: 1,
        height: 3,
        backgroundColor: theme.colors.divider,
        borderRadius: 2,
        marginLeft: 8,
        overflow: 'hidden',
      },
      progressFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
        borderRadius: 2,
      },
      progressText: {
        fontSize: 10,
        color: theme.colors.textTertiary,
        marginLeft: 6,
        minWidth: 28,
      },
      scroll: {
        maxHeight: 60,
      },
      content: {
        fontStyle: 'italic',
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
      },
    });
  }, [theme, isTelegram]);
  if (!content && !isComplete) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 头部: 进度指示 */}
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={14} color={theme.colors.textTertiary} />
        <Text style={styles.label}>
          {isComplete ? '思考完成' : '思考中'}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        {!isComplete && (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        )}
      </View>

      {/* 内容: 可滚动 */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <Text style={styles.content}>
          {content || '正在思考...'}
        </Text>
      </ScrollView>
    </View>
  );
}

export default ThinkingView;
