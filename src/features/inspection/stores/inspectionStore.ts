import { create } from 'zustand';
import { InspectionRecord, InspectionTask, InspectionItemResult } from '../../../types';
import { dbHelpers, syncHelpers } from '../../../core/storage/database';

interface InspectionState {
  records: InspectionRecord[];
  tasks: InspectionTask[];
  currentRecord: Partial<InspectionRecord> | null;
  isLoading: boolean;

  // Actions
  fetchRecords: (userId?: string, deviceId?: string) => Promise<void>;
  fetchRecordById: (id: string) => Promise<InspectionRecord | null>;
  createRecord: (record: Partial<InspectionRecord>) => Promise<InspectionRecord>;
  updateRecord: (id: string, updates: Partial<InspectionRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  submitRecord: (record: InspectionRecord) => Promise<void>;
  saveDraft: (record: Partial<InspectionRecord>) => void;
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<InspectionTask | null>;
}

// Mock data
const mockRecords: InspectionRecord[] = [
  {
    id: 'ins1',
    deviceId: 'dev1',
    deviceName: '1号消防栓',
    userId: '2',
    userName: 'inspector',
    type: 'scan',
    status: 'completed',
    result: 'pass',
    items: [
      { itemId: 'item1', itemName: '检查消防栓是否有水', result: 'pass' },
      { itemId: 'item2', itemName: '检查消防栓周围是否有杂物', result: 'pass' },
    ],
    photos: [],
    notes: '设备正常',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'ins2',
    deviceId: 'dev2',
    deviceName: '2号灭火器',
    userId: '2',
    userName: 'inspector',
    type: 'safety',
    status: 'completed',
    result: 'partial',
    items: [
      { itemId: 'item4', itemName: '检查压力表', result: 'pass' },
      { itemId: 'item5', itemName: '检查有效期', result: 'fail', notes: '已过期' },
    ],
    photos: [],
    notes: '需更换灭火器',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
];

const mockTasks: InspectionTask[] = [
  {
    id: 'task1',
    name: '月度消防检查',
    description: '对全厂消防设备进行月度检查',
    deviceIds: ['dev1', 'dev2'],
    checklistTemplateId: 'tpl1',
    assigneeIds: ['2'],
    dueDate: Date.now() + 7 * 86400000,
    status: 'pending',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'task2',
    name: '电气安全检查',
    description: '对全厂电气设备进行安全检查',
    deviceIds: ['dev3'],
    checklistTemplateId: 'tpl2',
    assigneeIds: ['2'],
    dueDate: Date.now() + 14 * 86400000,
    status: 'pending',
    createdAt: Date.now() - 43200000,
  },
];

export const useInspectionStore = create<InspectionState>((set, get) => ({
  records: [],
  tasks: [],
  currentRecord: null,
  isLoading: false,

  fetchRecords: async (userId?: string, deviceId?: string) => {
    set({ isLoading: true });
    try {
      let records = await dbHelpers.queryAll<any>('inspection_records');

      if (records.length === 0) {
        records = mockRecords;
        for (const record of records) {
          await dbHelpers.insert('inspection_records', {
            ...record,
            items: JSON.stringify(record.items),
            photos: JSON.stringify(record.photos),
            created_at: record.createdAt,
            updated_at: record.updatedAt,
          });
        }
      }

      let filtered = records.map((r: any) => ({
        ...r,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
        photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })) as InspectionRecord[];

      if (userId) {
        filtered = filtered.filter((r) => r.userId === userId);
      }
      if (deviceId) {
        filtered = filtered.filter((r) => r.deviceId === deviceId);
      }

      set({ records: filtered, isLoading: false });
    } catch (error) {
      console.error('Error fetching records:', error);
      set({ isLoading: false });
    }
  },

  fetchRecordById: async (id: string) => {
    const record = await dbHelpers.queryOne<any>('inspection_records', 'id = ?', [id]);
    if (record) {
      return {
        ...record,
        items: typeof record.items === 'string' ? JSON.parse(record.items) : record.items,
        photos: typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      } as InspectionRecord;
    }
    return mockRecords.find((r) => r.id === id) || null;
  },

  createRecord: async (record: Partial<InspectionRecord>) => {
    const now = Date.now();
    const newRecord: InspectionRecord = {
      id: `ins_${now}`,
      deviceId: record.deviceId || '',
      deviceName: record.deviceName,
      userId: record.userId || '',
      userName: record.userName,
      taskId: record.taskId,
      type: record.type || 'scan',
      status: 'draft',
      items: record.items || [],
      photos: record.photos || [],
      notes: record.notes,
      createdAt: now,
      updatedAt: now,
    };

    await dbHelpers.insert('inspection_records', {
      ...newRecord,
      items: JSON.stringify(newRecord.items),
      photos: JSON.stringify(newRecord.photos),
      created_at: newRecord.createdAt,
      updated_at: newRecord.updatedAt,
    });

    set({ records: [...get().records, newRecord], currentRecord: newRecord });

    return newRecord;
  },

  updateRecord: async (id: string, updates: Partial<InspectionRecord>) => {
    const records = get().records;
    const index = records.findIndex((r) => r.id === id);

    if (index >= 0) {
      const updated = { ...records[index], ...updates, updatedAt: Date.now() };

      await dbHelpers.update(
        'inspection_records',
        {
          ...updates,
          items: JSON.stringify(updates.items || records[index].items),
          photos: JSON.stringify(updates.photos || records[index].photos),
          updated_at: Date.now(),
        },
        'id = ?',
        [id]
      );

      records[index] = updated;
      set({ records: [...records] });
    }
  },

  deleteRecord: async (id: string) => {
    await dbHelpers.delete('inspection_records', 'id = ?', [id]);

    const records = get().records.filter((r) => r.id !== id);
    set({ records });
  },

  submitRecord: async (record: InspectionRecord) => {
    const updated = { ...record, status: 'completed' as const, updatedAt: Date.now() };

    await dbHelpers.update(
      'inspection_records',
      {
        status: 'completed',
        result: record.result,
        notes: record.notes,
        items: JSON.stringify(record.items),
        photos: JSON.stringify(record.photos),
        updated_at: Date.now(),
        sync_status: 'pending',
      },
      'id = ?',
      [record.id]
    );

    // Add to sync queue
    await syncHelpers.addToQueue({
      type: 'create',
      entity: 'inspection',
      entityId: record.id,
      payload: updated,
    });

    const records = get().records;
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      records[index] = updated;
      set({ records: [...records] });
    }
  },

  saveDraft: (record: Partial<InspectionRecord>) => {
    set({ currentRecord: record });
  },

  fetchTasks: async () => {
    const tasks = await dbHelpers.queryAll<InspectionTask>('inspection_tasks');
    if (tasks.length === 0) {
      for (const task of mockTasks) {
        await dbHelpers.insert('inspection_tasks', {
          ...task,
          device_ids: JSON.stringify(task.deviceIds),
          assignee_ids: JSON.stringify(task.assigneeIds),
          created_at: task.createdAt,
        });
      }
      set({ tasks: mockTasks });
    } else {
      set({
        tasks: tasks.map((t: any) => ({
          ...t,
          deviceIds: typeof t.device_ids === 'string' ? JSON.parse(t.device_ids) : t.deviceIds,
          assigneeIds: typeof t.assignee_ids === 'string' ? JSON.parse(t.assignee_ids) : t.assigneeIds,
          createdAt: t.created_at,
        })),
      });
    }
  },

  fetchTaskById: async (id: string) => {
    const task = await dbHelpers.queryOne<any>('inspection_tasks', 'id = ?', [id]);
    if (task) {
      return {
        ...task,
        deviceIds: typeof task.device_ids === 'string' ? JSON.parse(task.device_ids) : task.deviceIds,
        assigneeIds: typeof task.assignee_ids === 'string' ? JSON.parse(task.assignee_ids) : task.assigneeIds,
        createdAt: task.created_at,
      } as InspectionTask;
    }
    return mockTasks.find((t) => t.id === id) || null;
  },
}));
