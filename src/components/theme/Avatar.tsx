/**
 * 主题化头像组件
 * 支持两套主题：黑白(Grok) 和 白蓝(Telegram)
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../constants/themeV2';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'medium',
  style,
}: AvatarProps) {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 56;
      case 'xlarge':
        return 80;
      default:
        return 40;
    }
  };

  const avatarSize = getSize();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 20;
      case 'xlarge':
        return 28;
      default:
        return 14;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: theme.colors.backgroundSecondary,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: getFontSize(),
              color: theme.colors.textSecondary,
            },
          ]}
        >
          {name ? getInitials(name) : '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});

export default Avatar;
