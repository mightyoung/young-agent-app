// VoiceInputButton - 语音输入按钮组件
// 提供语音输入功能

import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onResult, disabled = false }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Grok style colors
  const GROK_COLORS = {
    background: '#1A1A1A',
    textSecondary: '#B0B0B0',
    error: '#F44336',
  };

  const handlePressIn = () => {
    if (disabled) return;
    setIsRecording(true);

    // 脉冲动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    // 模拟语音识别结果
    // 实际实现需要集成语音识别库
    // 这里预留接口，用户可以实现实际功能
    // onResult('模拟语音输入');
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.button,
          isRecording && styles.recording,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Ionicons
          name={isRecording ? 'mic' : 'mic-outline'}
          size={24}
          color={isRecording ? '#FFFFFF' : GROK_COLORS.textSecondary}
        />
      </Animated.View>
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>录音中...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    backgroundColor: '#F44336',
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: -24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
});

export default VoiceInputButton;
