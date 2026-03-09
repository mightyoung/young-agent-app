// Hazard Analysis Tool - 隐患分析工具
// 将隐患分析能力封装为 AI 可调用的工具

import type { Tool } from '../types';
import { analyzeHazards, analyzeHazard } from '../hazardAnalysis';

export const hazardAnalysisTool: Tool = {
  name: 'analyze_hazard',
  description: '分析隐患整体情况或特定隐患，提供风险评估和整改建议。',
  parameters: {
    type: 'object',
    properties: {
      hazardId: {
        type: 'string',
        description: '隐患ID（可选）。如果不提供，则分析整体隐患情况',
      },
    },
    required: [],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const hazardId = args.hazardId as string | undefined;

    try {
      if (hazardId) {
        // 分析特定隐患
        const result = await analyzeHazard(hazardId);

        if (!result) {
          return `未找到ID为 "${hazardId}" 的隐患记录。`;
        }

        return formatHazardAnalysisResult(result);
      } else {
        // 分析整体情况
        const result = await analyzeHazards();
        return formatHazardAnalysisResult(result);
      }
    } catch (error) {
      return `分析隐患失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  },
};

/**
 * 格式化隐患分析结果
 */
function formatHazardAnalysisResult(result: any): string {
  const { summary, riskAssessment, recommendations, relatedKnowledge } = result;

  let output = `🔍 隐患分析报告\n\n`;
  output += `📊 ${summary}\n\n`;

  // 风险评估
  output += `⚠️ 风险评估\n`;
  output += `   整体风险等级: ${getRiskLevelEmoji(riskAssessment.overallLevel)} ${riskAssessment.overallLevel.toUpperCase()}\n`;
  output += `   风险评分: ${riskAssessment.score} 分\n`;
  output += `   趋势: ${getTrendEmoji(riskAssessment.trend)} ${getTrendText(riskAssessment.trend)}\n\n`;

  // 风险因素
  if (riskAssessment.factors && riskAssessment.factors.length > 0) {
    output += `📋 风险因素:\n`;
    for (const factor of riskAssessment.factors) {
      const icon = factor.impact === 'positive' ? '✅' : factor.impact === 'negative' ? '❌' : '➖';
      output += `   ${icon} ${factor.factor}: ${factor.description}\n`;
    }
    output += '\n';
  }

  // 建议
  if (recommendations && recommendations.length > 0) {
    output += `💡 整改建议:\n`;
    for (const rec of recommendations) {
      output += `   ${rec}\n`;
    }
    output += '\n';
  }

  // 相关知识
  if (relatedKnowledge && relatedKnowledge !== '未找到相关内容') {
    output += `📚 相关知识:\n${relatedKnowledge.substring(0, 500)}`;
    if (relatedKnowledge.length > 500) {
      output += '...';
    }
  }

  return output;
}

function getRiskLevelEmoji(level: string): string {
  switch (level) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'improving': return '📈';
    case 'worsening': return '📉';
    default: return '➡️';
  }
}

function getTrendText(trend: string): string {
  switch (trend) {
    case 'improving': return '改善中';
    case 'worsening': return '恶化中';
    default: return '稳定';
  }
}
