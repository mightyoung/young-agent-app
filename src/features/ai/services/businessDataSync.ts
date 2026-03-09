// Business Data Sync Service - 业务数据同步服务
// 将真实业务数据同步到 RAG 知识库

import { ragService } from './rag';
import { queryDevices, queryHazards, queryTasks } from './toolDataService';

let isSyncing = false;

/**
 * 同步所有业务数据到 RAG 知识库
 */
export async function syncBusinessDataToRAG(): Promise<{
  success: boolean;
  deviceCount: number;
  hazardCount: number;
  taskCount: number;
  error?: string;
}> {
  if (isSyncing) {
    return {
      success: false,
      deviceCount: 0,
      hazardCount: 0,
      taskCount: 0,
      error: '同步正在进行中',
    };
  }

  isSyncing = true;
  let deviceCount = 0;
  let hazardCount = 0;
  let taskCount = 0;

  try {
    // 同步设备数据
    const deviceResult = await queryDevices({ status: 'all' });
    for (const device of deviceResult.devices) {
      await ragService.addBusinessReference(
        'device',
        device.id,
        device.name,
        `设备类型: ${device.typeName || '未知'} | 位置: ${device.locationName || '未知'} | 状态: ${device.status}`,
        [device.typeName || '', device.locationName || '', device.status].filter(Boolean)
      );
      deviceCount++;
    }

    // 同步隐患数据
    const hazardResult = await queryHazards({ status: 'all' });
    for (const hazard of hazardResult.hazards) {
      await ragService.addBusinessReference(
        'hazard',
        hazard.id,
        hazard.businessNo || hazard.id,
        hazard.description,
        [hazard.type || '', hazard.status, hazard.typeName || ''].filter(Boolean)
      );
      hazardCount++;
    }

    // 同步任务数据
    const taskResult = await queryTasks({ status: 'all' });
    for (const task of taskResult.tasks) {
      await ragService.addBusinessReference(
        'task',
        task.id,
        task.name,
        task.description,
        [task.status].filter(Boolean)
      );
      taskCount++;
    }

    return {
      success: true,
      deviceCount,
      hazardCount,
      taskCount,
    };
  } catch (error) {
    console.error('[BusinessDataSync] Error syncing business data:', error);
    return {
      success: false,
      deviceCount,
      hazardCount,
      taskCount,
      error: error instanceof Error ? error.message : '未知错误',
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * 同步单个设备到 RAG
 */
export async function syncDeviceToRAG(deviceId: string): Promise<boolean> {
  try {
    const result = await queryDevices({ status: 'all' });
    const device = result.devices.find(d => d.id === deviceId);

    if (!device) return false;

    await ragService.addBusinessReference(
      'device',
      device.id,
      device.name,
      `设备类型: ${device.typeName || '未知'} | 位置: ${device.locationName || '未知'} | 状态: ${device.status}`,
      [device.typeName || '', device.locationName || '', device.status].filter(Boolean)
    );

    return true;
  } catch (error) {
    console.error('[BusinessDataSync] Error syncing device:', error);
    return false;
  }
}

/**
 * 同步单个隐患到 RAG
 */
export async function syncHazardToRAG(hazardId: string): Promise<boolean> {
  try {
    const result = await queryHazards({ status: 'all' });
    const hazard = result.hazards.find(h => h.id === hazardId);

    if (!hazard) return false;

    await ragService.addBusinessReference(
      'hazard',
      hazard.id,
      hazard.businessNo || hazard.id,
      hazard.description,
      [hazard.type || '', hazard.status, hazard.typeName || ''].filter(Boolean)
    );

    return true;
  } catch (error) {
    console.error('[BusinessDataSync] Error syncing hazard:', error);
    return false;
  }
}

/**
 * 同步单个任务到 RAG
 */
export async function syncTaskToRAG(taskId: string): Promise<boolean> {
  try {
    const result = await queryTasks({ status: 'all' });
    const task = result.tasks.find(t => t.id === taskId);

    if (!task) return false;

    await ragService.addBusinessReference(
      'task',
      task.id,
      task.name,
      task.description,
      [task.status].filter(Boolean)
    );

    return true;
  } catch (error) {
    console.error('[BusinessDataSync] Error syncing task:', error);
    return false;
  }
}

/**
 * 获取业务数据摘要（用于 AI 上下文）
 */
export async function getBusinessDataSummary(): Promise<string> {
  try {
    const [deviceResult, hazardResult, taskResult] = await Promise.all([
      queryDevices({ status: 'all' }),
      queryHazards({ status: 'all' }),
      queryTasks({ status: 'all' }),
    ]);

    const deviceStats = deviceResult.stats;
    const hazardStats = hazardResult.stats;
    const taskStats = taskResult.stats;

    return `业务数据摘要：
- 设备总数: ${deviceResult.devices.length} 台
  - 正常: ${deviceStats.normal} 台
  - 警告: ${deviceStats.warning} 台
  - 错误: ${deviceStats.error} 台
  - 离线: ${deviceStats.offline} 台

- 隐患总数: ${hazardResult.hazards.length} 项
  - 草稿: ${hazardStats.draft} 项
  - 已提交: ${hazardStats.submitted} 项
  - 已确认: ${hazardStats.confirmed} 项
  - 整改中: ${hazardStats.rectifying} 项
  - 已验收: ${hazardStats.accepted} 项

- 任务总数: ${taskResult.tasks.length} 项
  - 待处理: ${taskStats.pending} 项
  - 进行中: ${taskStats.in_progress} 项
  - 已完成: ${taskStats.completed} 项`;
  } catch (error) {
    console.error('[BusinessDataSync] Error getting summary:', error);
    return '获取业务数据摘要失败';
  }
}
