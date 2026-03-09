import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';

export default function SafetyCheckScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { taskId } = route.params || {};

  // Mock tasks - 后续应从数据库加载
  const [tasks] = useState([
    {
      id: 'task1',
      name: '月度消防检查',
      description: '对全厂消防设备进行月度检查',
      dueDate: '2026-03-15',
      deviceCount: 5,
    },
    {
      id: 'task2',
      name: '电气安全检查',
      description: '对全厂电气设备进行安全检查',
      dueDate: '2026-03-20',
      deviceCount: 3,
    },
  ]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    taskCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    taskName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statusBadge: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      color: '#FFFFFF',
    },
    taskDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    taskFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    taskInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    taskInfoText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    freeCheckButton: {
      marginTop: 16,
      padding: 16,
      alignItems: 'center',
    },
    freeCheckText: {
      fontSize: 14,
      color: theme.colors.primary,
    },
  }), [theme]);

  const handleSelectTask = (task: any) => {
    navigation.navigate('InspectionDetail', { id: task.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>安全检查</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>选择检查任务</Text>

        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => handleSelectTask(task)}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskName}>{task.name}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>待执行</Text>
              </View>
            </View>
            <Text style={styles.taskDesc}>{task.description}</Text>
            <View style={styles.taskFooter}>
              <View style={styles.taskInfo}>
                <Ionicons name="server-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.taskInfoText}>{task.deviceCount} 个设备</Text>
              </View>
              <View style={styles.taskInfo}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.taskInfoText}>截止 {task.dueDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.freeCheckButton} onPress={() => navigation.navigate('InspectionDetail', { id: 'new' })}>
          <Text style={styles.freeCheckText}>自由检查（不关联任务）</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
