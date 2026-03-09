// Intent Recognition Service - 意图识别服务
// 识别用户查询意图并路由到相应的处理函数

import type { Tool } from './types';

export type IntentType =
  | 'device_query'      // 设备查询
  | 'hazard_query'      // 隐患查询
  | 'task_query'        // 任务查询
  | 'stats_query'       // 统计查询
  | 'hazard_analysis'   // 隐患分析
  | 'general_chat'      // 一般聊天
  | 'unknown';          // 未知意图

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: {
    status?: string;
    location?: string;
    type?: string;
    level?: string;
    keyword?: string;
    [key: string]: string | undefined;
  };
  rawQuery: string;
}

// 意图模式匹配规则
interface IntentPattern {
  intent: IntentType;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

const intentPatterns: IntentPattern[] = [
  // 设备查询意图
  {
    intent: 'device_query',
    patterns: [
      /设备/i,
      /消防栓/i,
      /灭火器/i,
      /配电箱/i,
      /摄像头/i,
      /监控/i,
    ],
    keywords: ['查询设备', '设备列表', '设备状态', '设备查询', '有多少设备', '设备情况'],
    weight: 1.0,
  },
  // 隐患查询意图
  {
    intent: 'hazard_query',
    patterns: [
      /隐患/i,
      /安全问题/i,
      /风险/i,
      /危险/i,
    ],
    keywords: ['查询隐患', '隐患列表', '隐患情况', '有多少隐患', '待处理隐患'],
    weight: 1.0,
  },
  // 任务查询意图
  {
    intent: 'task_query',
    patterns: [
      /任务/i,
      /巡检/i,
      /检查/i,
      /待办/i,
    ],
    keywords: ['查询任务', '任务列表', '任务情况', '待办任务', '有哪些任务'],
    weight: 1.0,
  },
  // 统计查询意图
  {
    intent: 'stats_query',
    patterns: [
      /统计/i,
      /汇总/i,
      /报告/i,
      /总览/i,
      /概览/i,
    ],
    keywords: ['统计数据', '统计信息', '整体情况', '总体情况', '汇总'],
    weight: 1.0,
  },
  // 隐患分析意图
  {
    intent: 'hazard_analysis',
    patterns: [
      /分析隐患/i,
      /隐患分析/i,
      /风险评估/i,
      /整改建议/i,
      /安全隐患/i,
    ],
    keywords: ['分析', '评估', '建议', '整改'],
    weight: 1.2,
  },
];

// 实体提取规则
const entityExtractions: {
  field: string;
  patterns: RegExp[];
}[] = [
  // 状态提取
  {
    field: 'status',
    patterns: [
      /正常|运行中/i,
      /警告|预警/i,
      /错误|故障|异常/i,
      /离线/i,
      /待处理|未处理/i,
      /处理中|整改中/i,
      /已解决|已完成|已验收/i,
    ],
  },
  // 位置提取
  {
    field: 'location',
    patterns: [
      /A区|B区|C区/i,
      /一楼|二楼|三楼/i,
      /车间|仓库|办公室/i,
    ],
  },
  // 类型提取
  {
    field: 'type',
    patterns: [
      /消防|火灾/i,
      /电气|电力/i,
      /施工|建设/i,
      /机械/i,
    ],
  },
  // 级别提取
  {
    field: 'level',
    patterns: [
      /重大|critical/i,
      /高危|高风险|high/i,
      /中等|中风险|medium/i,
      /低危|低风险|low/i,
    ],
  },
];

/**
 * 意图识别服务
 */
class IntentRecognitionService {
  /**
   * 识别用户意图
   */
  recognize(query: string): IntentResult {
    const normalizedQuery = query.trim().toLowerCase();
    let bestIntent: IntentType = 'unknown';
    let bestScore = 0;
    const entities: IntentResult['entities'] = {};

    // 1. 模式匹配
    for (const pattern of intentPatterns) {
      let score = 0;

      // 检查正则模式
      for (const regex of pattern.patterns) {
        if (regex.test(query)) {
          score += pattern.weight;
        }
      }

      // 检查关键词
      for (const keyword of pattern.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += pattern.weight * 0.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = pattern.intent;
      }
    }

    // 2. 提取实体
    this.extractEntities(query, entities);

    // 3. 计算置信度
    const confidence = Math.min(bestScore / 2, 1.0);

    return {
      intent: bestIntent,
      confidence,
      entities,
      rawQuery: query,
    };
  }

  /**
   * 提取实体信息
   */
  private extractEntities(query: string, entities: IntentResult['entities']): void {
    // 提取状态
    if (/正常|运行中/i.test(query)) {
      entities.status = 'normal';
    } else if (/警告|预警/i.test(query)) {
      entities.status = 'warning';
    } else if (/错误|故障|异常/i.test(query)) {
      entities.status = 'error';
    } else if (/离线/i.test(query)) {
      entities.status = 'offline';
    } else if (/待处理|未处理|pending/i.test(query)) {
      entities.status = 'submitted';
    } else if (/处理中|整改中/i.test(query)) {
      entities.status = 'rectifying';
    } else if (/已解决|已完成|已验收/i.test(query)) {
      entities.status = 'accepted';
    }

    // 提取位置
    if (/A区/i.test(query)) {
      entities.location = 'A区';
    } else if (/B区/i.test(query)) {
      entities.location = 'B区';
    } else if (/C区/i.test(query)) {
      entities.location = 'C区';
    }

    // 提取类型
    if (/消防|火灾/i.test(query)) {
      entities.type = 'fire';
    } else if (/电气|电力/i.test(query)) {
      entities.type = 'electric';
    } else if (/施工|建设/i.test(query)) {
      entities.type = 'construction';
    }

    // 提取级别
    if (/重大|critical/i.test(query)) {
      entities.level = 'critical';
    } else if (/高危|high/i.test(query)) {
      entities.level = 'high';
    } else if (/中|medium/i.test(query)) {
      entities.level = 'medium';
    } else if (/低|low/i.test(query)) {
      entities.level = 'low';
    }

    // 提取关键词（用于搜索）
    const keywordMatch = query.match(/搜索?|查询|找一下(.+)/i);
    if (keywordMatch && keywordMatch[1]) {
      entities.keyword = keywordMatch[1].trim();
    }
  }

  /**
   * 根据意图获取推荐工具
   */
  getRecommendedTools(intent: IntentType): string[] {
    const toolMap: Record<IntentType, string[]> = {
      device_query: ['query_devices'],
      hazard_query: ['query_hazards'],
      task_query: ['query_tasks'],
      stats_query: ['query_devices', 'query_hazards', 'query_tasks'],
      hazard_analysis: ['analyze_hazard'],
      general_chat: [],
      unknown: [],
    };
    return toolMap[intent] || [];
  }

  /**
   * 生成意图响应
   */
  generateResponse(intent: IntentResult): string {
    const { intent: type, entities } = intent;

    switch (type) {
      case 'device_query':
        return this.generateDeviceQueryPrompt(entities);
      case 'hazard_query':
        return this.generateHazardQueryPrompt(entities);
      case 'task_query':
        return this.generateTaskQueryPrompt(entities);
      case 'stats_query':
        return '我将为您查询整体统计数据，包括设备、隐患和任务的整体情况。';
      case 'hazard_analysis':
        return '我将为您分析隐患情况，提供风险评估和整改建议。';
      default:
        return '我理解您想要进行对话。有什么我可以帮助您的？';
    }
  }

  private generateDeviceQueryPrompt(entities: IntentResult['entities']): string {
    const parts: string[] = ['我将为您查询设备信息'];
    if (entities.status) {
      parts.push(`状态为"${entities.status}"`);
    }
    if (entities.location) {
      parts.push(`位于"${entities.location}"`);
    }
    parts.push('的设备列表');
    return parts.join('');
  }

  private generateHazardQueryPrompt(entities: IntentResult['entities']): string {
    const parts: string[] = ['我将为您查询隐患信息'];
    if (entities.status) {
      parts.push(`状态为"${entities.status}"`);
    }
    if (entities.type) {
      parts.push(`类型为"${entities.type}"`);
    }
    if (entities.level) {
      parts.push(`级别为"${entities.level}"`);
    }
    parts.push('的隐患列表');
    return parts.join('');
  }

  private generateTaskQueryPrompt(entities: IntentResult['entities']): string {
    const parts: string[] = ['我将为您查询任务信息'];
    if (entities.status) {
      parts.push(`状态为"${entities.status}"`);
    }
    parts.push('的任务列表');
    return parts.join('');
  }
}

// 单例实例
export const intentRecognitionService = new IntentRecognitionService();

/**
 * 便捷函数：识别意图
 */
export function recognizeIntent(query: string): IntentResult {
  return intentRecognitionService.recognize(query);
}

/**
 * 便捷函数：获取推荐工具
 */
export function getRecommendedTools(intent: IntentType): string[] {
  return intentRecognitionService.getRecommendedTools(intent);
}
