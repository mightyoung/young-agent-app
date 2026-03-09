// ImageUploadButton - 图像上传按钮组件
// 提供图像上传和分析功能

import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { imageService } from '../services/imageAnalysis';

// Grok style colors
const GROK_COLORS = {
  background: '#1A1A1A',
  textSecondary: '#B0B0B0',
  primary: '#FFFFFF',
};

// 动态导入 expo-image-picker
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.warn('[ImageUpload] expo-image-picker not available');
}

interface ImageUploadButtonProps {
  onImageSelected: (uri: string) => void;
  onAnalyze?: (uri: string, result: any) => void;
  multiple?: boolean;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploadButton({
  onImageSelected,
  onAnalyze,
  multiple = false,
  maxImages = 4,
  disabled = false,
}: ImageUploadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analyzingImages, setAnalyzingImages] = useState<string[]>([]);

  const pickImage = async () => {
    if (disabled) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('权限不足', '需要访问相册权限来选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        ...(multiple && { selectionLimit: maxImages }),
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          // 验证图像大小
          if (!imageService.validateSize(asset.fileSize || 0)) {
            Alert.alert('图片过大', '图片大小不能超过 5MB');
            continue;
          }

          onImageSelected(asset.uri);

          // 如果需要自动分析
          if (onAnalyze) {
            setAnalyzingImages(prev => [...prev, asset.uri]);
            try {
              const analysisResult = await imageService.analyze(asset.uri);
              onAnalyze(asset.uri, analysisResult);
            } catch (error) {
              console.error('[ImageUpload] Analysis failed:', error);
            } finally {
              setAnalyzingImages(prev => prev.filter(uri => uri !== asset.uri));
            }
          }
        }
      }
    } catch (error) {
      console.error('[ImageUpload] Pick failed:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  const takePhoto = async () => {
    if (disabled) return;

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('权限不足', '需要访问相机权限来拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];

        if (!imageService.validateSize(asset.fileSize || 0)) {
          Alert.alert('图片过大', '图片大小不能超过 5MB');
          return;
        }

        onImageSelected(asset.uri);

        if (onAnalyze) {
          setAnalyzingImages(prev => [...prev, asset.uri]);
          try {
            const analysisResult = await imageService.analyze(asset.uri);
            onAnalyze(asset.uri, analysisResult);
          } catch (error) {
            console.error('[ImageUpload] Analysis failed:', error);
          } finally {
            setAnalyzingImages(prev => prev.filter(uri => uri !== asset.uri));
          }
        }
      }
    } catch (error) {
      console.error('[ImageUpload] Camera failed:', error);
      Alert.alert('错误', '拍照失败');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '选择图片来源',
      '',
      [
        { text: '拍照', onPress: takePhoto },
        { text: '相册', onPress: pickImage },
        { text: '取消', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={showImagePicker}
        disabled={disabled}
      >
        <Ionicons name="image-outline" size={24} color={GROK_COLORS.textSecondary} />
      </TouchableOpacity>

      {/* 分析中的加载指示器 */}
      {analyzingImages.length > 0 && (
        <View style={styles.analyzingBadge}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GROK_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GROK_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImageUploadButton;
