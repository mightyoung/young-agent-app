// Task Query Tool - 任务查询工具

import type { Tool } from '../types';
import { queryTasks } from '../toolDataService';

export const taskQueryTool: Tool = {
  name: 'query_tasks',
  description: '查询任务列表和状态。可以查看所有任务、按状态筛选或查看特定人员的任务。',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'pending', 'in_progress', 'completed'],
        description: '任务状态筛选：all-所有, pending-待处理, in_progress-进行中, completed-已完成',
      },
      assignee: {
        type: 'string',
        description: '任务负责人ID筛选（可选）',
      },
    },
    required: ['status'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const status = (args.status as 'all' | 'pending' | 'in_progress' | 'completed') || 'all';
    const assignee = args.assignee as string | undefined;

    try {
      const { tasks, stats } = await queryTasks({ status, assignee });

      if (tasks.length === 0) {
        return '没有找到符合条件的任务。';
      }

      const statusNames: Record<string, string> = {
        pending: '待处理',
        in_progress: '进行中',
        completed: '已完成',
      };

      const formatDate = (timestamp?: number) => {
        if (!timestamp) return '未设置';
        return new Date(timestamp).toLocaleDateString('zh-CN');
      };

      const taskList = tasks
        .slice(0, 10) // 限制显示数量
        .map(
          (t) =>
            `📋 ${t.name}\n  描述: ${t.description?.substring(0, 40)}${t.description && t.description.length > 40 ? '...' : ''}\n  状态: ${statusNames[t.status] || t.status} | 截止: ${formatDate(t.dueDate)}`
        )
        .join('\n\n');

      const total = tasks.length > 10 ? `\n(显示前10条，共 ${tasks.length} 条)` : '';

      return `任务查询结果：

总计: ${tasks.length} 项
- 待处理: ${stats.pending} 项
- 进行中: ${stats.in_progress} 项
- 已完成: ${stats.completed} 项

${status !== 'all' ? `筛选条件: ${statusNames[status] || status}\n` : ''}任务列表：${total}
${taskList}`;
    } catch (error) {
      return `查询任务失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  },
};
