// PhotoGrid Component - 照片网格组件

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoGridProps {
  /** 图片URI列表 */
  photos: string[];
  /** 最大显示数量 (超出显示更多按钮) */
  maxShow?: number;
  /** 点击事件 */
  onPress?: (index: number) => void;
  /** 预览模式 */
  editable?: boolean;
  /** 删除事件 */
  onDelete?: (index: number) => void;
  /** 添加事件 */
  onAdd?: () => void;
  /** 列数 */
  columns?: number;
  /** 自定义样式 */
  style?: ViewStyle;
}

/** 照片网格组件 */
export function PhotoGrid({
  photos,
  maxShow = 4,
  onPress,
  editable = false,
  onDelete,
  onAdd,
  columns = 3,
  style,
}: PhotoGridProps) {
  const showPhotos = photos.slice(0, maxShow);
  const remaining = photos.length - maxShow;
  const showMore = remaining > 0;
  const itemWidth = (screenWidth - 40 - (columns - 1) * 8) / columns;

  const handlePress = (index: number) => {
    onPress?.(index);
  };

  const handleDelete = (index: number, e: any) => {
    e.stopPropagation();
    onDelete?.(index);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.grid, { marginRight: -(itemWidth + 8) }]}>
        {showPhotos.map((photo, index) => (
          <View key={index} style={[styles.itemWrapper, { width: itemWidth }]}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => handlePress(index)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />

              {/* 更多标记 */}
              {showMore && index === maxShow - 1 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{remaining}</Text>
                </View>
              )}

              {/* 删除按钮 */}
              {editable && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => handleDelete(index, e)}
                >
                  <Ionicons name="close-circle" size={24} color="#F5222D" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* 添加按钮 */}
        {editable && photos.length < 9 && (
          <View style={[styles.itemWrapper, { width: itemWidth }]}>
            <TouchableOpacity style={styles.addButton} onPress={onAdd}>
              <Ionicons name="add" size={32} color="#999999" />
              <Text style={styles.addText}>添加</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// 单张图片查看器
interface PhotoViewerProps {
  visible: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (index: number) => void;
}

export function PhotoViewer({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  onDelete,
}: PhotoViewerProps) {
  // TODO: 实现全屏图片查看器
  // 可使用 Modal + FlatList 实现滑动查看

  if (!visible) return null;

  return (
    <View style={styles.viewer}>
      {/* TODO: 实现完整的图片查看器 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemWrapper: {
    marginRight: 8,
    marginBottom: 8,
    aspectRatio: 1,
  },
  item: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  addText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  viewer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
});

export default PhotoGrid;
