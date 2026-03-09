import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/themeV2';

// 知识库数据
const KNOWLEDGE_CATEGORIES = [
  {
    id: 'safety',
    title: '安全规范',
    icon: 'shield-checkmark',
    color: '#4CAF50',
    articles: [
      { id: 's1', title: '消防安全知识', content: '火灾预防措施：\n1. 定期检查电气线路\n2. 保持消防通道畅通\n3. 配备并定期检查消防器材\n4. 制定并演练火灾应急预案' },
      { id: 's2', title: '用电安全规范', content: '用电安全要点：\n1. 定期检查电气设备\n2. 不超负荷用电\n3. 湿手不接触电器\n4. 及时更换老化线路' },
      { id: 's3', title: '高空作业安全', content: '高空作业要求：\n1. 系好安全带\n2. 设置安全网\n3. 穿戴防滑鞋\n4. 避免向下抛物' },
    ],
  },
  {
    id: 'hazard',
    title: '隐患识别',
    icon: 'warning',
    color: '#FF9800',
    articles: [
      { id: 'h1', title: '常见安全隐患', content: '常见隐患类型：\n1. 消防通道堵塞\n2. 电气线路老化\n3. 危化品存储不当\n4. 安全标识缺失' },
      { id: 'h2', title: '隐患排查方法', content: '排查方法：\n1. 定期巡检\n2. 专项检查\n3. 群众举报\n4. 智能监测' },
    ],
  },
  {
    id: 'inspection',
    title: '巡检知识',
    icon: 'clipboard',
    color: '#2196F3',
    articles: [
      { id: 'i1', title: '巡检要点', content: '巡检内容：\n1. 设备运行状态\n2. 安全防护设施\n3. 作业环境状况\n4. 人员操作规范' },
      { id: 'i2', title: '检查表使用', content: '检查表使用方法：\n1. 按照项目逐项检查\n2. 记录实际情况\n3. 发现问题及时上报\n4. 跟踪整改结果' },
    ],
  },
  {
    id: 'emergency',
    title: '应急处理',
    icon: 'medkit',
    color: '#F44336',
    articles: [
      { id: 'e1', title: '火灾应急', content: '火灾处置步骤：\n1. 发现火情立即报警\n2. 判断火势大小\n3. 使用对应灭火器材\n4. 疏散人员\n5. 等待救援' },
      { id: 'e2', title: '人员急救', content: '急救常识：\n1. 触电：立即断电\n2. 烧伤：冷水冲洗\n3. 骨折：固定伤处\n4. 中毒：转移通风处' },
    ],
  },
];

export default function KnowledgeBaseScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(KNOWLEDGE_CATEGORIES[0]);
  const [searchText, setSearchText] = useState('');

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
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    searchContainer: {
      padding: 16,
    },
    searchInput: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
    },
    categoryList: {
      paddingHorizontal: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    categoryCount: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    articleList: {
      padding: 16,
    },
    articleItem: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    articleTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    articlePreview: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    detailContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    detailContent: {
      padding: 16,
    },
    detailTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 16,
    },
    detailText: {
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 26,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.background,
    },
    tabItem: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 8,
      borderRadius: 20,
    },
    tabItemActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
  }), [theme, selectedCategory, searchText]);

  const filteredArticles = useMemo(() => {
    if (!searchText) return selectedCategory.articles;
    return selectedCategory.articles.filter(article =>
      article.title.includes(searchText) || article.content.includes(searchText)
    );
  }, [selectedCategory, searchText]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>知识库</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索知识库..."
          placeholderTextColor={theme.colors.inputPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 分类Tab */}
      <View style={styles.tabBar}>
        {KNOWLEDGE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tabItem,
              selectedCategory.id === category.id && styles.tabItemActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory.id === category.id && styles.tabTextActive,
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 文章列表 */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.articleList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.articleItem}
            onPress={() => navigation.navigate('KnowledgeDetail', { article: item })}
          >
            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.articlePreview} numberOfLines={2}>
              {item.content.substring(0, 60)}...
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ color: theme.colors.textSecondary }}>暂无相关内容</Text>
          </View>
        }
      />
    </View>
  );
}
