// Hazard Analysis Skill - 隐患分析技能
// 提供隐患分类推理、风险等级评估和整改建议

import { queryHazards, getOverallStats } from './toolDataService';
import { ragService } from './rag';

export interface HazardAnalysisResult {
  summary: string;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  relatedKnowledge: string;
}

export interface RiskAssessment {
  overallLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  trend: 'improving' | 'stable' | 'worsening';
}

// 风险评分权重
const RISK_WEIGHTS = {
  critical: 10,
  high: 6,
  medium: 3,
  low: 1,
};

// 隐患类型风险等级映射
const TYPE_RISK_LEVEL: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  fire: 'high',        // 火灾风险通常是高风险
  electric: 'critical', // 电气风险通常是重大风险
  construction: 'medium', // 施工风险一般是中等
  other: 'low',
};

/**
 * 隐患分析服务
 */
class HazardAnalysisService {
  /**
   * 分析隐患整体情况
   */
  async analyze(): Promise<HazardAnalysisResult> {
    const stats = await getOverallStats();
    const hazardResult = await queryHazards({ status: 'all' });
    const hazards = hazardResult.hazards;

    // 风险评估
    const riskAssessment = this.assessRisk(hazards, stats);

    // 生成建议
    const recommendations = this.generateRecommendations(hazards, riskAssessment);

    // 获取相关知识
    const relatedKnowledge = await this.getRelatedKnowledge();

    // 生成摘要
    const summary = this.generateSummary(hazards, stats);

    return {
      summary,
      riskAssessment,
      recommendations,
      relatedKnowledge,
    };
  }

  /**
   * 分析特定隐患
   */
  async analyzeSpecific(hazardId: string): Promise<HazardAnalysisResult | null> {
    const hazardResult = await queryHazards({ status: 'all' });
    const hazard = hazardResult.hazards.find(h => h.id === hazardId || h.businessNo === hazardId);

    if (!hazard) {
      return null;
    }

    const riskLevel = this.getRiskLevel(hazard);
    const recommendations = this.generateSpecificRecommendations(hazard);

    return {
      summary: `隐患 "${hazard.businessNo || hazard.id}" 分析结果`,
      riskAssessment: {
        overallLevel: riskLevel,
        score: RISK_WEIGHTS[riskLevel],
        factors: [
          {
            factor: '隐患类型',
            impact: TYPE_RISK_LEVEL[hazard.type] ? 'negative' : 'neutral',
            description: `类型: ${hazard.typeName || hazard.type}`,
          },
          {
            factor: '当前状态',
            impact: hazard.status === 'accepted' ? 'positive' :
                   hazard.status === 'submitted' ? 'negative' : 'neutral',
            description: `状态: ${hazard.status}`,
          },
        ],
        trend: 'stable',
      },
      recommendations,
      relatedKnowledge: await this.getRelatedKnowledgeForType(hazard.type),
    };
  }

  /**
   * 风险评估
   */
  private assessRisk(hazards: any[], stats: any): RiskAssessment {
    const totalHazards = hazards.length;
    if (totalHazards === 0) {
      return {
        overallLevel: 'low',
        score: 0,
        factors: [],
        trend: 'improving',
      };
    }

    // 计算各类型/级别隐患数量
    let totalScore = 0;
    const factors: RiskAssessment['factors'] = [];

    // 按状态统计
    const pending = stats.hazards?.pending || 0;
    const processing = stats.hazards?.processing || 0;
    const resolved = stats.hazards?.resolved || 0;

    // 未处理隐患增加风险
    if (pending > 0) {
      factors.push({
        factor: '待处理隐患',
        impact: 'negative',
        description: `${pending} 项隐患待处理`,
      });
      totalScore += pending * 3;
    }

    // 处理中隐患
    if (processing > 0) {
      factors.push({
        factor: '处理中隐患',
        impact: 'neutral',
        description: `${processing} 项隐患正在处理中`,
      });
      totalScore += processing * 1;
    }

    // 已解决隐患（正面因素）
    if (resolved > 0) {
      factors.push({
        factor: '已解决隐患',
        impact: 'positive',
        description: `${resolved} 项隐患已解决`,
      });
      totalScore -= resolved * 2;
    }

    // 计算趋势
    let trend: RiskAssessment['trend'] = 'stable';
    if (resolved > pending) {
      trend = 'improving';
    } else if (pending > resolved * 2) {
      trend = 'worsening';
    }

    // 确定整体风险等级
    let overallLevel: RiskAssessment['overallLevel'] = 'low';
    if (totalScore >= 20) {
      overallLevel = 'critical';
    } else if (totalScore >= 10) {
      overallLevel = 'high';
    } else if (totalScore >= 5) {
      overallLevel = 'medium';
    }

    return {
      overallLevel,
      score: totalScore,
      factors,
      trend,
    };
  }

  /**
   * 获取单个隐患的风险等级
   */
  private getRiskLevel(hazard: any): 'critical' | 'high' | 'medium' | 'low' {
    // 基于类型和状态计算
    const baseLevel = TYPE_RISK_LEVEL[hazard.type] || 'low';

    // 如果已解决，风险降低
    if (hazard.status === 'accepted' || hazard.status === 'rejected') {
      return 'low';
    }

    return baseLevel;
  }

  /**
   * 生成整体建议
   */
  private generateRecommendations(hazards: any[], risk: RiskAssessment): string[] {
    const recommendations: string[] = [];

    // 基于风险等级的建议
    if (risk.overallLevel === 'critical' || risk.overallLevel === 'high') {
      recommendations.push('⚠️ 建议立即处理高风险隐患，优先处理电气和火灾相关隐患');
    }

    // 基于未处理数量的建议
    const pending = hazards.filter(h => h.status === 'submitted').length;
    if (pending > 5) {
      recommendations.push(`📋 当前有 ${pending} 项隐患待处理，建议尽快安排整改`);
    }

    // 基于趋势的建议
    if (risk.trend === 'worsening') {
      recommendations.push('📉 隐患数量呈上升趋势，建议加强日常巡检');
    } else if (risk.trend === 'improving') {
      recommendations.push('📈 隐患处理效果良好，建议继续保持');
    }

    // 通用建议
    recommendations.push('🔧 定期进行安全培训，提高员工安全意识');
    recommendations.push('📝 建立隐患排查长效机制，做到早发现早处理');

    return recommendations;
  }

  /**
   * 生成特定隐患建议
   */
  private generateSpecificRecommendations(hazard: any): string[] {
    const recommendations: string[] = [];

    // 基于类型的建议
    switch (hazard.type) {
      case 'fire':
        recommendations.push('🧯 确保消防通道畅通，配备必要的消防器材');
        recommendations.push('🔍 定期检查消防设施完整性');
        break;
      case 'electric':
        recommendations.push('⚡ 请专业人员检查电气线路');
        recommendations.push('🔒 加强电气设备维护，防止漏电');
        break;
      case 'construction':
        recommendations.push('👷 规范施工流程，佩戴安全防护用品');
        recommendations.push('🚧 设置施工警示标志');
        break;
      default:
        recommendations.push('📋 评估隐患风险，制定整改计划');
    }

    // 基于状态的建议
    if (hazard.status === 'submitted') {
      recommendations.push('✅ 尽快确认隐患，安排整改');
    } else if (hazard.status === 'confirmed') {
      recommendations.push('🔧 制定整改方案，限期完成');
    } else if (hazard.status === 'rectifying') {
      recommendations.push('⏰ 跟踪整改进度，确保按期完成');
    }

    return recommendations;
  }

  /**
   * 获取相关知识
   */
  private async getRelatedKnowledge(): Promise<string> {
    try {
      const result = await ragService.retrieve('安全隐患 整改标准');
      return result.content;
    } catch {
      return '';
    }
  }

  /**
   * 获取特定类型相关知识
   */
  private async getRelatedKnowledgeForType(type: string): Promise<string> {
    try {
      const result = await ragService.retrieve(type);
      return result.content;
    } catch {
      return '';
    }
  }

  /**
   * 生成摘要
   */
  private generateSummary(hazards: any[], stats: any): string {
    const total = hazards.length;
    const pending = stats.hazards?.pending || 0;
    const processing = stats.hazards?.processing || 0;
    const resolved = stats.hazards?.resolved || 0;

    return `当前共有 ${total} 项隐患记录，其中 ${pending} 项待处理，${processing} 项处理中，${resolved} 项已解决。`;
  }
}

// 单例实例
export const hazardAnalysisService = new HazardAnalysisService();

/**
 * 便捷函数：分析隐患整体情况
 */
export async function analyzeHazards(): Promise<HazardAnalysisResult> {
  return hazardAnalysisService.analyze();
}

/**
 * 便捷函数：分析特定隐患
 */
export async function analyzeHazard(hazardId: string): Promise<HazardAnalysisResult | null> {
  return hazardAnalysisService.analyzeSpecific(hazardId);
}
