import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useHazardStore } from '../stores/hazardStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { HazardType } from '../../../types';
import { useTheme } from '../../../../constants/themeV2';

const { width, height } = Dimensions.get('window');

// 隐患类型选项
const HAZARD_TYPES = [
  { code: 'fire', name: '火灾安全' },
  { code: 'electric', name: '电力设施' },
  { code: 'construction', name: '违章施工' },
  { code: 'other', name: '其他' },
];

// 语音录制弹窗组件
function VoiceRecordingModal({
  visible,
  onClose,
  onComplete,
}: {
  visible: boolean;
  onClose: () => void;
  onComplete: (uri: string, duration: number) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRecordingTime(0);
      setIsRecording(true);
      startRecording();

      // 脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulseAnim.setValue(1);
    }

    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.log('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recording) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      setRecording(null);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onClose();
  };

  const handleSave = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      // 保存录音URI和时长，不转文字
      if (uri) {
        onComplete(uri, recordingTime);
      }
    }
    setRecording(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.voiceModalContainer}>
        <TouchableOpacity style={styles.voiceOverlay} onPress={handleCancel} />

        {/* 录音动画区域 */}
        <View style={styles.voiceContent}>
          {/* 麦克风按钮 - 黑框白底 */}
          <Animated.View
            style={[
              styles.micButton,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.micButtonInner}>
              <Ionicons name="mic" size={56} color="#000000" />
            </View>
          </Animated.View>

          {/* 波形动画 */}
          <View style={styles.waveformContainer}>
            <View style={[styles.waveBar, styles.waveBarBW, { height: 16 }]} />
            <View style={[styles.waveBar, styles.waveBarActiveBW, { height: 40 }]} />
            <View style={[styles.waveBar, styles.waveBarBW, { height: 56 }]} />
            <View style={[styles.waveBar, styles.waveBarActiveBW, { height: 48 }]} />
            <View style={[styles.waveBar, styles.waveBarBW, { height: 32 }]} />
            <View style={[styles.waveBar, styles.waveBarActiveBW, { height: 56 }]} />
            <View style={[styles.waveBar, styles.waveBarBW, { height: 24 }]} />
            <View style={[styles.waveBar, styles.waveBarActiveBW, { height: 40 }]} />
          </View>

          {/* 录音时间 */}
          <Text style={styles.recordingTextBW}>
            {isRecording ? '正在录音...' : formatTime(recordingTime)}
          </Text>

          {/* 操作按钮 */}
          <View style={styles.voiceActions}>
            <TouchableOpacity style={styles.voiceActionButton} onPress={handleCancel}>
              <View style={styles.voiceActionCircleBWLarger}>
                <Ionicons name="close" size={36} color="#000000" />
              </View>
              <Text style={styles.voiceActionTextBW}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.voiceActionButton} onPress={handleSave}>
              <View style={styles.voiceActionCircleBWLarger}>
                <Ionicons name="checkmark" size={40} color="#000000" />
              </View>
              <Text style={styles.voiceActionTextBW}>保存</Text>
            </TouchableOpacity>
          </View>

          {/* 提示文字 */}
          <Text style={styles.voiceHintBW}>点击保存语音</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function HazardReportScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { createHazard, submitHazard } = useHazardStore();
  const user = useAuthStore((state) => state.user);
  const { theme } = useTheme();

  // 从相机入口传入的照片
  const initialPhoto = route.params?.photo;

  const [photos, setPhotos] = useState<string[]>(initialPhoto ? [initialPhoto] : []);
  const [type, setType] = useState<HazardType>('fire');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // 语音录音状态
  const [voiceRecordings, setVoiceRecordings] = useState<{ uri: string; duration: number }[]>([]);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);

  // 添加照片
  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  // 删除照片
  const handleDeletePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // 获取当前位置
  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要定位权限才能获取位置');
        setLocationLoading(false);
        return;
      }

      // 获取当前位置
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 使用逆地理编码获取地址
      const results = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (results.length > 0) {
        const address = results[0];
        const locationStr = [
          address.region,
          address.city,
          address.district,
          address.street,
        ].filter(Boolean).join('');
        setLocation(locationStr);
      } else {
        // 如果没有逆地理编码结果，使用坐标
        setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch (error: any) {
      console.log('Location error:', error);
      // 提供更详细的错误信息
      if (error?.code === 'E_LOCATION_SERVICES_DISABLED') {
        Alert.alert('提示', '请开启手机定位服务');
      } else if (error?.code === 'E_LOCATION_TIMEOUT') {
        Alert.alert('提示', '获取位置超时，请重试');
      } else {
        Alert.alert('提示', '获取位置失败，请检查网络和定位设置');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  // 语音录制完成 - 只保存录音，不转文字
  const handleVoiceComplete = (uri: string, duration: number = 30) => {
    // 添加新的语音录音
    const newRecording = {
      uri: uri,
      duration: duration,
    };
    setVoiceRecordings([...voiceRecordings, newRecording]);
    setShowVoiceModal(false);
  };

  // 删除语音
  const handleDeleteVoice = (index: number) => {
    const newRecordings = [...voiceRecordings];
    newRecordings.splice(index, 1);
    setVoiceRecordings(newRecordings);
  };

  const soundRef = useRef<Audio.Sound | null>(null);

  // 播放/暂停语音
  const handlePlayVoice = async (index: number) => {
    try {
      // 如果正在播放当前语音，暂停它
      if (currentPlayingIndex === index && isPlayingVoice) {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
        }
        setIsPlayingVoice(false);
        return;
      }

      // 先停止之前的播放
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // 加载并播放新语音
      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceRecordings[index].uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingVoice(false);
            setCurrentPlayingIndex(-1);
          }
        }
      );
      soundRef.current = sound;
      setCurrentPlayingIndex(index);
      setIsPlayingVoice(true);
    } catch (error) {
      console.log('Playback error:', error);
      Alert.alert('提示', '播放录音失败');
    }
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}'${secs.toString().padStart(2, '0')}`;
  };

  // 提交
  const handleSubmit = async () => {
    if (photos.length === 0) {
      Alert.alert('提示', '请至少上传一张照片');
      return;
    }

    if (!description.trim() && voiceRecordings.length === 0) {
      Alert.alert('提示', '请输入隐患描述或录制语音');
      return;
    }

    // 获取第一个语音录音的信息
    const firstVoice = voiceRecordings[0];

    const hazard = await createHazard({
      photos,
      type,
      source: 'photo',
      description: description.trim(),
      locationName: location.trim() || undefined,
      userId: user?.id,
      userName: user?.username,
      voiceNote: firstVoice?.uri, // 保存语音URI
      voiceDuration: firstVoice?.duration, // 保存语音时长
    });

    await submitHazard(hazard);
    navigation.navigate('HazardResult', { hazardId: hazard.id, businessNo: hazard.businessNo });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐患随手拍</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 照片区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>拍摄现场图片</Text>
            <View style={styles.photoGrid}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(index)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Ionicons name="add" size={36} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 发现地点 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>发现地点</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="请输入详细地址"
                placeholderTextColor="#999999"
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Ionicons name="hourglass-outline" size={22} color="#666666" />
                ) : (
                  <Ionicons name="location-outline" size={22} color="#666666" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 隐患类型 - 胶囊点选 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>隐患类型</Text>
            <View style={styles.typeContainer}>
              {HAZARD_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.code}
                  style={[
                    styles.typeCapsule,
                    type === t.code && styles.typeCapsuleActive,
                  ]}
                  onPress={() => setType(t.code as HazardType)}
                >
                  <Text
                    style={[
                      styles.typeCapsuleText,
                      type === t.code && styles.typeCapsuleTextActive,
                    ]}
                  >
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 隐患描述 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>隐患描述</Text>

            {/* 语音录音胶囊列表 */}
            {voiceRecordings.length > 0 && (
              <View style={styles.voiceCapsuleList}>
                {voiceRecordings.map((voice, index) => (
                  <View key={index} style={styles.voiceCapsule}>
                    <TouchableOpacity
                      style={styles.voiceCapsuleContent}
                      onPress={() => handlePlayVoice(index)}
                    >
                      <Ionicons
                        name={currentPlayingIndex === index && isPlayingVoice ? 'pause' : 'play'}
                        size={16}
                        color="#000000"
                      />
                      <View style={styles.voiceWaveform}>
                        {[...Array(8)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.voiceWaveBar,
                              currentPlayingIndex === index && isPlayingVoice && styles.voiceWaveBarActive,
                              { height: 8 + Math.random() * 12 },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.voiceDuration}>{formatDuration(voice.duration)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.voiceDeleteButton}
                      onPress={() => handleDeleteVoice(index)}
                    >
                      <Ionicons name="close" size={12} color="#666666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.descriptionContainer}>
              <TextInput
                style={styles.descriptionInput}
                placeholder="请详细描述隐患情况..."
                placeholderTextColor="#999999"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.voiceButtonContainer}>
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => setShowVoiceModal(true)}
                >
                  <Ionicons name="mic" size={22} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <View style={styles.submitSection}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 语音录制弹窗 */}
      <VoiceRecordingModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onComplete={handleVoiceComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    paddingVertical: 14,
  },
  locationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCapsule: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  typeCapsuleActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  typeCapsuleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  typeCapsuleTextActive: {
    color: '#FFFFFF',
  },
  descriptionContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    minHeight: 120,
    position: 'relative',
  },
  descriptionInput: {
    fontSize: 17,
    color: '#000000',
    minHeight: 100,
    padding: 0,
    paddingRight: 40,
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 8,
    left: 12,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 微信风格语音胶囊
  voiceCapsuleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  voiceCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
  },
  voiceCapsuleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
  },
  voiceWaveBar: {
    width: 3,
    backgroundColor: '#999999',
    borderRadius: 1.5,
  },
  voiceWaveBarActive: {
    backgroundColor: '#000000',
  },
  voiceDuration: {
    fontSize: 14,
    color: '#000000',
    minWidth: 40,
  },
  voiceDeleteButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    alignItems: 'center',
  },
  submitButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Voice Modal Styles - 黑白配色
  voiceModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  voiceContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  micButton: {
    width: 144,
    height: 144,
    borderRadius: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  micButtonInner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 64,
    marginBottom: 32,
  },
  waveBar: {
    width: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  waveBarActive: {
    backgroundColor: '#000000',
  },
  // 黑白配色版本
  waveBarBW: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  waveBarActiveBW: {
    backgroundColor: '#000000',
  },
  recordingText: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 48,
  },
  recordingTextBW: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 48,
  },
  voiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 48,
    marginBottom: 32,
  },
  voiceActionButton: {
    alignItems: 'center',
  },
  voiceActionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  // 黑白配色版本
  voiceActionCircleBW: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  // 黑白配色版本 - 放大
  voiceActionCircleBWLarger: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceActionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  voiceActionTextBW: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  voiceHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 40,
  },
  voiceHintBW: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 40,
  },
  voiceBottom: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  voiceInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  keyboardButton: {
    padding: 8,
  },
  releaseText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: '#0088CC',
    fontWeight: '500',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0088CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
