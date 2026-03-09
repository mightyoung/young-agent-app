// Steps Component - 步骤指示器组件

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type StepStatus = 'wait' | 'process' | 'finish' | 'error';

export interface Step {
  /** 步骤key */
  key: string;
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description?: string;
  /** 步骤状态 */
  status?: StepStatus;
}

interface StepsProps {
  /** 步骤列表 */
  steps: Step[];
  /** 当前进行中的步骤索引 */
  current?: number;
  /** 步骤方向 */
  direction?: 'horizontal' | 'vertical';
  /** 自定义样式 */
  style?: ViewStyle;
}

/** 审批流程步骤指示器 */
export function Steps({
  steps,
  current = 0,
  direction = 'horizontal',
  style,
}: StepsProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <View style={[styles.container, isHorizontal ? styles.horizontal : styles.vertical, style]}>
      {steps.map((step, index) => {
        let status: StepStatus = step.status || 'wait';

        // 根据索引自动计算状态
        if (!step.status) {
          if (index < current) {
            status = 'finish';
          } else if (index === current) {
            status = 'process';
          } else {
            status = 'wait';
          }
        }

        const isLast = index === steps.length - 1;

        return (
          <View
            key={step.key}
            style={[
              styles.stepWrapper,
              isHorizontal && styles.stepWrapperHorizontal,
              isLast && styles.stepWrapperLast,
            ]}
          >
            {/* 步骤标识 */}
            <View style={styles.stepHeader}>
              <View
                style={[
                  styles.iconContainer,
                  styles[`icon_${status}`],
                ]}
              >
                {status === 'finish' ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : status === 'error' ? (
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>

              {/* 连接线 */}
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    status === 'finish' && styles.lineFinished,
                  ]}
                />
              )}
            </View>

            {/* 步骤内容 */}
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepTitle,
                  status === 'process' && styles.stepTitleActive,
                  status === 'finish' && styles.stepTitleFinished,
                ]}
              >
                {step.title}
              </Text>
              {step.description && (
                <Text style={styles.stepDescription}>{step.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// 便捷函数：从状态获取步骤
export function getStepsFromStatus(
  status: string,
  stepTitles: string[]
): { steps: Step[]; current: number } {
  const statusMap: Record<string, number> = {
    draft: 0,
    submitted: 0,
    confirmed: 1,
    rectifying: 2,
    accepted: 3,
    rejected: -1,
  };

  const current = statusMap[status] ?? 0;
  const steps = stepTitles.map((title, index) => ({
    key: `step_${index}`,
    title,
    status: index < current ? 'finish' : index === current ? 'process' : 'wait',
  }));

  return { steps, current: Math.max(0, current) };
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vertical: {
    flexDirection: 'column',
  },
  stepWrapper: {
    flex: 1,
  },
  stepWrapperHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrapperLast: {
    flex: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon_wait: {
    backgroundColor: '#E5E5E5',
    borderWidth: 2,
    borderColor: '#999999',
  },
  icon_process: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  icon_finish: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
  },
  icon_error: {
    backgroundColor: '#F5222D',
    borderWidth: 2,
    borderColor: '#F5222D',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 4,
    marginBottom: 24,
  },
  lineFinished: {
    backgroundColor: '#000000',
  },
  stepContent: {
    marginTop: 8,
  },
  stepTitle: {
    fontSize: 14,
    color: '#999999',
  },
  stepTitleActive: {
    color: '#000000',
    fontWeight: '600',
  },
  stepTitleFinished: {
    color: '#000000',
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
});

export default Steps;
