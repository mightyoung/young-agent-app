// Device Query Tool - 设备查询工具

import type { Tool } from '../types';
import { queryDevices } from '../toolDataService';

export const deviceQueryTool: Tool = {
  name: 'query_devices',
  description: '查询设备列表和状态信息。可以查询所有设备、按状态筛选或按位置筛选。',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'normal', 'warning', 'error', 'offline'],
        description: '设备状态筛选：all-所有, normal-正常, warning-警告, error-错误, offline-离线',
      },
      location: {
        type: 'string',
        description: '设备位置筛选（可选）',
      },
    },
    required: ['status'],
  },
  execute: async (args: Record<string, unknown>): Promise<string> => {
    const status = (args.status as 'all' | 'normal' | 'warning' | 'error' | 'offline') || 'all';
    const location = args.location as string | undefined;

    try {
      const { devices, stats } = await queryDevices({ status, location });

      if (devices.length === 0) {
        return '没有找到符合条件的设备。';
      }

      const statusNames: Record<string, string> = {
        normal: '正常',
        warning: '警告',
        error: '错误',
        offline: '离线',
      };

      const deviceList = devices
        .map((d) => `• ${d.name} - ${d.typeName || '未知类型'} (${d.locationName || '未知位置'}) - ${statusNames[d.status] || d.status}`)
        .join('\n');

      return `设备查询结果：

总计: ${devices.length} 台
- 正常: ${stats.normal} 台
- 警告: ${stats.warning} 台
- 错误: ${stats.error} 台
- 离线: ${stats.offline} 台

${status !== 'all' ? `筛选条件: ${status}\n` : ''}设备列表：
${deviceList}`;
    } catch (error) {
      return `查询设备失败：${error instanceof Error ? error.message : '未知错误'}`;
    }
  },
};
