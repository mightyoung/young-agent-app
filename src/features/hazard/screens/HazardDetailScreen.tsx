import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../../../constants/themeV2';
import { useHazardStore } from '../stores/hazardStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { HazardRecord, HazardStatus } from '../../../types';
import { config } from '../../../core/constants/config';

// 从配置中获取审批流节点
const PROCESS_FLOW_STEPS = config.hazardStatusFlow.flowSteps;

export default function HazardDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { id } = route.params;

  const [hazard, setHazard] = useState<HazardRecord | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { fetchHazardById, confirmHazard, rectifyHazard, acceptHazard, rejectHazard } = useHazardStore();
  const user = useAuthStore((state) => state.user);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.colors.navbarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primaryText,
    },
    content: {
      padding: 20,
    },
    processContainer: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.lg,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    processTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 20,
    },
    processSteps: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    processStep: {
      alignItems: 'center',
    },
    processIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 2,
      borderColor: theme.colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    processIconCompleted: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    processIconCurrent: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    processLabel: {
      fontSize: 14,
      color: theme.colors.textTertiary,
    },
    processLabelCompleted: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    processLabelCurrent: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    processLine: {
      flex: 1,
      height: 2,
      backgroundColor: theme.colors.divider,
      marginHorizontal: 4,
      marginBottom: 24,
    },
    processLineCompleted: {
      backgroundColor: theme.colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    card: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    label: {
      fontSize: 18,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: 18,
      color: theme.colors.text,
      fontWeight: '500',
    },
    description: {
      fontSize: 18,
      color: theme.colors.text,
      lineHeight: 28,
      marginBottom: 16,
    },
    voiceCapsule: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingLeft: 16,
      paddingRight: 8,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    voiceCapsuleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    voiceWaveform: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      height: 24,
    },
    voiceWaveBar: {
      width: 3,
      backgroundColor: theme.colors.textTertiary,
      borderRadius: 1.5,
    },
    voiceWaveBarActive: {
      backgroundColor: theme.colors.text,
    },
    voiceDuration: {
      fontSize: 16,
      color: theme.colors.text,
      minWidth: 40,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    photo: {
      width: 110,
      height: 110,
      borderRadius: theme.borderRadius.lg,
    },
    actionButton: {
      height: 56,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.primaryText,
    },
  }), [theme]);

  useEffect(() => {
    const loadHazard = async () => {
      const data = await fetchHazardById(id);
      setHazard(data);
    };
    loadHazard();
  }, [id]);

  if (!hazard) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const handleAction = async () => {
    if (!user) return;

    switch (hazard.status) {
      case 'submitted':
        await confirmHazard(hazard.id, user.id);
        break;
      case 'confirmed':
        break;
      case 'rectifying':
        break;
    }
    const data = await fetchHazardById(id);
    setHazard(data);
  };

  // 使用集中配置获取状态显示
  const getStatusConfig = (status: string) => {
    return config.hazardStatusFlow.statusConfig[status as keyof typeof config.hazardStatusFlow.statusConfig]
      || { text: status, color: '#8C8C8C' };
  };

  const statusConfig = getStatusConfig(hazard.status);

  // 使用集中配置获取当前审批流步骤索引
  const currentFlowStepIndex = config.hazardStatusFlow.getCurrentFlowStepIndex(hazard.status);

  // 播放语音
  const handlePlayVoice = async () => {
    if (!hazard?.voiceNote) return;

    try {
      if (isPlayingVoice) {
        // 暂停播放
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
        }
        setIsPlayingVoice(false);
      } else {
        // 开始播放
        setIsLoadingVoice(true);
        // 先停止之前的播放
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: hazard.voiceNote },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingVoice(false);
            }
          }
        );
        soundRef.current = sound;
        setIsPlayingVoice(true);
        setIsLoadingVoice(false);
      }
    } catch (error) {
      console.log('Playback error:', error);
      Alert.alert('提示', '播放录音失败');
      setIsLoadingVoice(false);
    }
  };

  // 格式化语音时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.mode === 'bw' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.navbarBackground} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐患详情</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 审批流显示 */}
        <View style={styles.processContainer}>
          <Text style={styles.processTitle}>处理流程</Text>
          <View style={styles.processSteps}>
            {PROCESS_FLOW_STEPS.map((step, index) => {
              const isCompleted = index < currentFlowStepIndex;
              const isCurrent = index === currentFlowStepIndex;
              const isLast = index === PROCESS_FLOW_STEPS.length - 1;

              return (
                <React.Fragment key={step.key}>
                  <View style={styles.processStep}>
                    <View style={[
                      styles.processIconContainer,
                      isCompleted && styles.processIconCompleted,
                      isCurrent && styles.processIconCurrent,
                    ]}>
                      <Ionicons
                        name={isCompleted ? 'checkmark' : 'ellipse-outline'}
                        size={18}
                        color={isCompleted || isCurrent ? theme.colors.primaryText : theme.colors.textTertiary}
                      />
                    </View>
                    <Text style={[
                      styles.processLabel,
                      isCompleted && styles.processLabelCompleted,
                      isCurrent && styles.processLabelCurrent,
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.processLine,
                      index < currentFlowStepIndex && styles.processLineCompleted,
                    ]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>隐患编号</Text>
              <Text style={styles.value}>{hazard.businessNo || hazard.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>隐患类型</Text>
              <Text style={styles.value}>{hazard.typeName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>位置</Text>
              <Text style={styles.value}>{hazard.locationName || '未指定'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>上报人</Text>
              <Text style={styles.value}>{hazard.userName || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>上报时间</Text>
              <Text style={styles.value}>{new Date(hazard.createdAt).toLocaleString('zh-CN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐患描述</Text>
          <View style={styles.card}>
            {hazard.description && (
              <Text style={styles.description}>{hazard.description}</Text>
            )}
            {/* 语音文件 - 使用实际的录音数据 */}
            {hazard.voiceNote && (
              <View style={styles.voiceCapsule}>
                <TouchableOpacity
                  style={styles.voiceCapsuleContent}
                  onPress={handlePlayVoice}
                  disabled={isLoadingVoice}
                >
                  <Ionicons
                    name={isLoadingVoice ? 'hourglass' : (isPlayingVoice ? 'pause' : 'play')}
                    size={18}
                    color={theme.colors.text}
                  />
                  <View style={styles.voiceWaveform}>
                    {[12, 24, 36, 28, 16, 32, 20, 28].map((height, i) => (
                      <View
                        key={i}
                        style={[
                          styles.voiceWaveBar,
                          isPlayingVoice && styles.voiceWaveBarActive,
                          { height },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.voiceDuration}>
                    {hazard.voiceDuration ? formatDuration(hazard.voiceDuration) : "0'30"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {hazard.photos && hazard.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>照片</Text>
            <View style={styles.photoGrid}>
              {hazard.photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        {hazard.status === 'submitted' && user?.role === 'admin' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
            <Text style={styles.actionButtonText}>确认隐患</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
