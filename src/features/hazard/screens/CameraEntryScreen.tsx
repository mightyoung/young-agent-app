import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../constants/themeV2';

const { width, height } = Dimensions.get('window');

// 扫描线动画组件
function ScanningLine({ themeColor }: { themeColor: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value * 268 }],
  }));

  return (
    <Animated.View style={[styles.scannerLine, { backgroundColor: themeColor }, animatedStyle]} />
  );
}

export default function CameraEntryScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  // Theme-aware colors for camera UI
  const themeColor = theme.colors.primary;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    cameraBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#1a1a1a',
    },
    scannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scannerFrame: {
      width: 272,
      height: 272,
      position: 'relative',
      borderWidth: 2,
      borderColor: themeColor + '66',
      borderRadius: 16,
    },
    corner: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderColor: themeColor,
    },
    topLeft: {
      top: -2,
      left: -2,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: 16,
    },
    topRight: {
      top: -2,
      right: -2,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: 16,
    },
    bottomLeft: {
      bottom: -2,
      left: -2,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 16,
    },
    bottomRight: {
      bottom: -2,
      right: -2,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 16,
    },
    scannerLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      shadowColor: themeColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 15,
    },
    topBar: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    topButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    bottomControls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 30,
    },
    promptContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    glassPanel: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(34, 22, 16, 0.6)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    promptText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      width: '100%',
    },
    sideButtonContainer: {
      alignItems: 'center',
      width: 60,
    },
    sideButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideButtonInner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(34, 22, 16, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sideButtonText: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: 4,
      textTransform: 'uppercase',
    },
    shutterButton: {
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    shutterOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    shutterInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    rightButtons: {
      position: 'absolute',
      right: 24,
    },
    safeAreaIndicator: {
      position: 'absolute',
      bottom: 8,
      left: width / 2 - 64,
      width: 128,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 2,
    },
  }), [theme, themeColor]);

  // 处理拍照
  const handleTakePhoto = async () => {
    try {
      // 请求相机权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera permission denied');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        // 拍照成功，跳转到隐患上报页面
        navigation.navigate('HazardReport', { photo: result.assets[0].uri });
      }
    } catch (error) {
      console.log('Camera error:', error);
    }
  };

  // 处理从相册选择
  const handlePickFromAlbum = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Media library permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        // 选择成功，跳转到隐患上报页面
        navigation.navigate('HazardReport', { photo: result.assets[0].uri });
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  // 扫码检查
  const handleQRCodeScan = () => {
    navigation.navigate('ScanCheck', { deviceId: '' });
  };

  // 填报检查（手动填写）
  const handleManualEntry = () => {
    navigation.navigate('SafetyCheck', {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 相机预览背景区域 */}
      <View style={styles.cameraBackground}>
        {/* 扫描框 UI */}
        <View style={styles.scannerOverlay}>
          {/* 扫描框 */}
          <View style={styles.scannerFrame}>
            {/* 四个角落 */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* 扫描线 */}
            <ScanningLine themeColor={themeColor} />
          </View>
        </View>
      </View>

      {/* 顶部导航栏 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.topButton}>
          <Ionicons name="flash" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 底部控制区域 */}
      <View style={styles.bottomControls}>
        {/* 提示文字 */}
        <View style={styles.promptContainer}>
          <View style={styles.glassPanel}>
            <Text style={styles.promptText}>请将台账或条码放入框内</Text>
          </View>
        </View>

        {/* 主控制栏 */}
        <View style={styles.controlBar}>
          {/* 左侧占位符 */}
          <View style={styles.sideButtonContainer} />

          {/* 拍照按钮 - 居中 */}
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>

          {/* 填报按钮 - 右侧 */}
          <View style={styles.sideButtonContainer}>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={handleManualEntry}
            >
              <View style={styles.sideButtonInner}>
                <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.sideButtonText}>填报</Text>
          </View>
        </View>
      </View>

      {/* 底部安全区域指示器 */}
      <View style={styles.safeAreaIndicator} />
    </View>
  );
}
