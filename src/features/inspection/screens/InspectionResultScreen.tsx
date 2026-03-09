import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';

export default function InspectionResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { recordId } = route.params;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 32,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
    },
    actions: {
      padding: 16,
      gap: 12,
    },
    primaryButton: {
      height: 48,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primaryText,
    },
    secondaryButton: {
      height: 48,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
        </View>
        <Text style={styles.title}>提交成功</Text>
        <Text style={styles.subtitle}>检查记录已保存</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>记录编号</Text>
          <Text style={styles.infoValue}>{recordId}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.getParent()?.navigate('Home')}
        >
          <Text style={styles.primaryButtonText}>返回首页</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('InspectionHistory')}
        >
          <Text style={styles.secondaryButtonText}>查看记录</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
