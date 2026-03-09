import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../../../core/constants/config';
import { useTheme } from '../../../../constants/themeV2';

// 从配置中获取审批流节点
const PROCESS_FLOW_STEPS = config.hazardStatusFlow.flowSteps;

export default function HazardResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();

  // 支持 businessNo（新）或 hazardId（兼容旧版）
  const { hazardId, businessNo } = route.params;

  // 优先显示业务编号
  const displayNo = businessNo || hazardId;

  // 动态样式
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, alignItems: 'center', padding: 32 },
    iconContainer: { marginTop: 80, marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
    subtitle: { fontSize: 18, color: theme.colors.textSecondary, marginBottom: 40 },
    infoCard: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 20, width: '100%', marginBottom: 40, borderWidth: 1, borderColor: theme.colors.cardBorder },
    infoLabel: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 8 },
    infoValue: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
    processContainer: { width: '100%', backgroundColor: theme.colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.cardBorder },
    processTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 20 },
    processItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    processDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CCCCCC', marginRight: 16 },
    processDotActive: { backgroundColor: theme.colors.text },
    processText: { fontSize: 18, color: theme.colors.textSecondary },
    actions: { padding: 24, gap: 16 },
    primaryButton: { height: 56, backgroundColor: theme.colors.text, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.textInverse },
    secondaryButton: { height: 56, backgroundColor: theme.colors.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.text },
    secondaryButtonText: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.mode === 'bw' ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color={theme.colors.text} />
        </View>
        <Text style={styles.title}>上报成功</Text>
        <Text style={styles.subtitle}>隐患已提交，等待审核</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>隐患编号</Text>
          <Text style={styles.infoValue}>{displayNo}</Text>
        </View>

        <View style={styles.processContainer}>
          <Text style={styles.processTitle}>处理流程</Text>
          {PROCESS_FLOW_STEPS.map((step, index) => (
            <View key={step.key} style={styles.processItem}>
              <View style={[
                styles.processDot,
                index === 0 && styles.processDotActive
              ]} />
              <Text style={styles.processText}>{step.label}</Text>
            </View>
          ))}
        </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            // 返回到根导航并跳转到首页
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          }}
        >
          <Text style={styles.primaryButtonText}>返回首页</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('HazardList')}
        >
          <Text style={styles.secondaryButtonText}>查看隐患</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
