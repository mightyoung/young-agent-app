// Hazard Query Tool - 隐患查询工具

import type { Tool } from '../types';
import { queryHazards } from '../toolDataService';

export const hazardQueryTool: Tool = {
  name: 'query_hazards',
  description: '查询隐患列表和状态。可以查看所有隐患、按类型筛选、按状态筛选。',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'draft', 'submitted', 'confirmed', 'rectifying', 'accepted', 'rejected'],
        description: '隐患状态筛选：all-所有, draft-草稿, submitted-已提交, confirmed-已确认, rectifying-整改中, accepted-已验收, rejected-已驳回',
      },
      type: {
        type: 'string',
        enum: ['all', 'fire', 'electric', 'construction', 'other'],
        description: '隐患类型筛选：all-所有, fire-火灾, electric-电力, construction-施工, other-其他',
      },
    },
    required: ['status'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const status = (args.status as 'all' | 'draft' | 'submitted' | 'confirmed' | 'rectifying' | 'accepted' | 'rejected') || 'all';
    const type = (args.type as 'all' | 'fire' | 'electric' | 'construction' | 'other') || 'all';

    try {
      const { hazards, stats } = await queryHazards({ status, type });

      if (hazards.length === 0) {
        return '没有找到符合条件的隐患。';
      }

      const statusNames: Record<string, string> = {
        draft: '草稿',
        submitted: '已提交',
        confirmed: '已确认',
        rectifying: '整改中',
        accepted: '已验收',
        rejected: '已驳回',
      };

      const typeNames: Record<string, string> = {
        fire: '火灾隐患',
        electric: '电力隐患',
        construction: '施工隐患',
        other: '其他隐患',
      };

      const hazardList = hazards
        .slice(0, 10) // 限制显示数量
        .map(
          (h) =>
            `⚠️ ${h.businessNo || h.id}\n  描述: ${h.description?.substring(0, 50)}${h.description && h.description.length > 50 ? '...' : ''}\n  类型: ${typeNames[h.type] || h.type} | 状态: ${statusNames[h.status] || h.status}\n  位置: ${h.locationName || '未知'} | 报告人: ${h.userName || h.userId}`
        )
        .join('\n\n');

      const total = hazards.length > 10 ? `\n(显示前10条，共 ${hazards.length} 条)` : '';

      return `隐患查询结果：

总计: ${hazards.length} 项
- 草稿: ${stats.draft} 项
- 已提交: ${stats.submitted} 项
- 已确认: ${stats.confirmed} 项
- 整改中: ${stats.rectifying} 项
- 已验收: ${stats.accepted} 项
- 已驳回: ${stats.rejected} 项

${status !== 'all' || type !== 'all'
  ? `筛选条件: ${status !== 'all' ? statusNames[status] || status : ''} ${type !== 'all' ? typeNames[type as string] || type : ''}\n`
  : ''}隐患列表：${total}
${hazardList}`;
    } catch (error) {
      return `查询隐患失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  },
};
