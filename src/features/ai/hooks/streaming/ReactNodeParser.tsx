/**
 * ReactNodeParser - React 节点解析器
 * 解析 AI 返回的 JSON 描述，转换为 React 组件
 *
 * 支持：
 * - 内联组件 (Text, View, Button, Image, Card 等)
 * - 动态列表渲染
 * - 条件渲染
 * - 嵌套组件
 */

import React from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';

// ===== 类型定义 =====

/**
 * 组件节点类型
 */
export type NodeType =
  | 'text'
  | 'view'
  | 'button'
  | 'image'
  | 'card'
  | 'list'
  | 'listItem'
  | 'input'
  | 'icon'
  | 'divider'
  | 'spacer'
  | 'custom';

/**
 * 组件属性
 */
export interface NodeProps {
  [key: string]: unknown;
}

/**
 * 组件节点
 */
export interface ComponentNode {
  type: NodeType | string;
  props?: NodeProps;
  children?: ComponentNode | ComponentNode[] | string;
  /** 条件渲染 */
  if?: boolean;
  /** 循环渲染 */
  for?: {
    items: unknown[];
    render: (item: unknown, index: number) => ComponentNode;
  };
}

/**
 * 解析结果
 */
export interface ParseResult {
  node: React.ReactNode;
  metadata?: Record<string, unknown>;
}

/**
 * 解析选项
 */
export interface ParserOptions {
  /** 自定义组件映射 */
  customComponents?: Record<string, React.ComponentType<any>>;
  /** 默认样式 */
  defaultStyles?: Record<string, any>;
  /** 错误处理 */
  onError?: (error: Error) => void;
}

// ===== 内置组件映射 =====

/**
 * 内置简单组件注册表
 */
const builtInComponents: Record<string, React.ComponentType<any>> = {
  // 文本组件
  text: (props: { children?: string; style?: any }) => (
    <Text style={props.style}>{props.children}</Text>
  ),

  // 视图容器
  view: (props: { children?: React.ReactNode; style?: any; [key: string]: any }) => {
    const { children, style, ...rest } = props;
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  },

  // 按钮组件
  button: (props: {
    children?: React.ReactNode;
    onPress?: () => void;
    style?: any;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
  }) => {
    const buttonStyle = [
      styles.button,
      props.variant === 'primary' && styles.buttonPrimary,
      props.variant === 'secondary' && styles.buttonSecondary,
      props.variant === 'outline' && styles.buttonOutline,
      props.disabled && styles.buttonDisabled,
      props.style,
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={props.onPress}
        disabled={props.disabled}
        activeOpacity={0.7}
      >
        <Text style={props.variant === 'outline' ? styles.buttonTextOutline : styles.buttonText}>
          {props.children}
        </Text>
      </TouchableOpacity>
    );
  },

  // 图片组件
  image: (props: { source?: string; style?: any; alt?: string }) => (
    <Image
      source={props.source ? { uri: props.source } : undefined}
      style={props.style}
      alt={props.alt}
    />
  ),

  // 卡片组件
  card: (props: { children?: React.ReactNode; style?: any; title?: string }) => (
    <View style={[styles.card, props.style]}>
      {props.title && <Text style={styles.cardTitle}>{props.title}</Text>}
      {props.children}
    </View>
  ),

  // 列表组件
  list: (props: { children?: React.ReactNode; style?: any }) => (
    <View style={[styles.list, props.style]}>{props.children}</View>
  ),

  // 列表项
  listItem: (props: { children?: React.ReactNode; style?: any; onPress?: () => void }) => (
    <TouchableOpacity
      style={[styles.listItem, props.style]}
      onPress={props.onPress}
      activeOpacity={0.7}
    >
      {props.children}
    </TouchableOpacity>
  ),

  // 输入框
  input: (props: {
    value?: string;
    placeholder?: string;
    onChangeText?: (text: string) => void;
    style?: any;
    multiline?: boolean;
  }) => (
    <TextInput
      style={[styles.input, props.multiline && styles.inputMultiline, props.style]}
      value={props.value}
      placeholder={props.placeholder}
      onChangeText={props.onChangeText}
      multiline={props.multiline}
      placeholderTextColor="#999"
    />
  ),

  // 分割线
  divider: (props: { style?: any }) => <View style={[styles.divider, props.style]} />,

  // 间距
  spacer: (props: { size?: number }) => <View style={{ height: props.size || 10 }} />,

  // 图标占位 (使用 Text 模拟)
  icon: (props: { name?: string; size?: number; color?: string }) => (
    <Text style={{ fontSize: props.size || 16, color: props.color || '#000' }}>
      {props.name || '●'}
    </Text>
  ),
};

// ===== 解析器类 =====

class ReactNodeParserImpl {
  private customComponents: Record<string, React.ComponentType<any>>;
  private defaultStyles: Record<string, any>;
  private onError?: (error: Error) => void;

  constructor(options: ParserOptions = {}) {
    this.customComponents = options.customComponents || {};
    this.defaultStyles = options.defaultStyles || {};
    this.onError = options.onError;
  }

  /**
   * 解析 JSON 字符串为 React 节点
   */
  parse(jsonString: string): ParseResult {
    try {
      const data = JSON.parse(jsonString);
      return this.parseNode(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to parse JSON');
      this.onError?.(err);
      return { node: null, metadata: { error: err.message } };
    }
  }

  /**
   * 解析对象为 React 节点
   */
  parseNode(node: ComponentNode | string | number | boolean | null | undefined): ParseResult {
    // 原始类型直接返回
    if (node === null || node === undefined) {
      return { node: null };
    }

    if (typeof node !== 'object') {
      return { node: String(node) };
    }

    // 字符串类型
    if (typeof node === 'string') {
      return { node: node };
    }

    // 数组类型 - 渲染多个子节点
    if (Array.isArray(node)) {
      const children = node
        .map((item, index) => this.parseNode(item))
        .filter((r) => r.node !== null)
        .map((r) => r.node);

      return { node: <>{children}</> };
    }

    // 对象类型 - 组件节点
    const componentNode = node as ComponentNode;

    // 条件渲染
    if (componentNode.if === false) {
      return { node: null };
    }

    // 循环渲染
    if (componentNode.for) {
      const { items, render } = componentNode.for;
      const renderedItems = items.map((item, index) => {
        const rendered = this.parseNode(render(item, index));
        return rendered.node;
      });
      return { node: <>{renderedItems}</> };
    }

    // 获取组件
    const Component = this.resolveComponent(componentNode.type);

    // 解析子节点
    let children: React.ReactNode = null;
    if (componentNode.children !== undefined) {
      if (typeof componentNode.children === 'string' || typeof componentNode.children === 'number') {
        children = String(componentNode.children);
      } else if (Array.isArray(componentNode.children)) {
        const childResults = componentNode.children.map((child) => this.parseNode(child));
        children = childResults
          .filter((r) => r.node !== null)
          .map((r) => r.node) as React.ReactNode;
      } else if (typeof componentNode.children === 'object') {
        const childResult = this.parseNode(componentNode.children as ComponentNode);
        children = childResult.node;
      }
    }

    // 合并样式
    const props = { ...componentNode.props };
    if (props.style && this.defaultStyles[componentNode.type as string]) {
      props.style = [this.defaultStyles[componentNode.type as string], props.style];
    }

    // 渲染组件
    try {
      return {
        node: (
          <Component {...props}>
            {children}
          </Component>
        ),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to render component');
      this.onError?.(err);
      return { node: null, metadata: { error: err.message } };
    }
  }

  /**
   * 解析组件类型
   */
  private resolveComponent(type: string | NodeType): React.ComponentType<any> {
    // 自定义组件优先
    if (this.customComponents[type]) {
      return this.customComponents[type];
    }

    // 内置组件
    if (builtInComponents[type]) {
      return builtInComponents[type];
    }

    // 默认返回 View
    return builtInComponents.view;
  }

  /**
   * 注册自定义组件
   */
  registerComponent(name: string, component: React.ComponentType<any>): void {
    this.customComponents[name] = component;
  }

  /**
   * 批量注册自定义组件
   */
  registerComponents(components: Record<string, React.ComponentType<any>>): void {
    Object.assign(this.customComponents, components);
  }
}

// ===== 样式 =====

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#5856D6',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
});

// ===== 导出 =====

/**
 * 创建解析器实例
 */
export function createParser(options?: ParserOptions): ReactNodeParserImpl {
  return new ReactNodeParserImpl(options);
}

/**
 * 快速解析 JSON 字符串
 */
export function quickParse(jsonString: string): React.ReactNode {
  const parser = createParser();
  const result = parser.parse(jsonString);
  return result.node;
}

/**
 * 快速解析节点对象
 */
export function quickParseNode(node: ComponentNode): React.ReactNode {
  const parser = createParser();
  const result = parser.parseNode(node);
  return result.node;
}

// ===== 预设组件 =====

/**
 * 预设业务组件
 */
export const businessComponents = {
  // 隐患卡片
  hazardCard: (props: {
    title: string;
    level: string;
    location: string;
    status: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={props.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardTitle}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{props.title}</Text>
        <Text
          style={{
            fontSize: 12,
            color: props.level === 'high' ? '#FF3B30' : props.level === 'medium' ? '#FF9500' : '#34C759',
          }}
        >
          {props.level === 'high' ? '高危' : props.level === 'medium' ? '中危' : '低危'}
        </Text>
      </View>
      <Text style={{ color: '#666', marginTop: 8 }}>位置: {props.location}</Text>
      <Text style={{ color: '#666', marginTop: 4 }}>状态: {props.status}</Text>
    </TouchableOpacity>
  ),

  // 设备卡片
  deviceCard: (props: { name: string; type: string; status: string; onPress?: () => void }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={props.onPress}
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{props.name}</Text>
      <Text style={{ color: '#666', marginTop: 8 }}>类型: {props.type}</Text>
      <Text style={{ color: '#34C759', marginTop: 4 }}>状态: {props.status}</Text>
    </TouchableOpacity>
  ),

  // 任务卡片
  taskCard: (props: { title: string; deadline: string; priority: string; onPress?: () => void }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={props.onPress}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{props.title}</Text>
        <Text
          style={{
            fontSize: 12,
            color: props.priority === 'urgent' ? '#FF3B30' : '#666',
          }}
        >
          {props.priority === 'urgent' ? '紧急' : '普通'}
        </Text>
      </View>
      <Text style={{ color: '#666', marginTop: 8 }}>截止: {props.deadline}</Text>
    </TouchableOpacity>
  ),
};

export default ReactNodeParserImpl;
