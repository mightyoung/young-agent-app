import { create } from 'zustand';
import { InspectionRecord, InspectionTask, InspectionItemResult } from '../../../types';
import { dbUtils, TableNames, syncHelpers } from '../../../core/storage/sqlite';

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

export const useInspectionStore = create<InspectionState>((set, get) => ({
  records: [],
  tasks: [],
  currentRecord: null,
  isLoading: false,

  fetchRecords: async (userId?: string, deviceId?: string) => {
    set({ isLoading: true });
    try {
      // Query from real SQLite database
      let records = await dbUtils.queryAll<any>(TableNames.INSPECTION_RECORD);

      // Map database fields to InspectionRecord
      let mappedRecords = records.map((r: any) => ({
        id: r.id,
        recordNo: r.record_no,
        taskId: r.task_id,
        taskNo: r.task_no,
        deviceId: r.device_id,
        deviceName: r.device_name,
        userId: r.user_id,
        userName: r.user_name,
        type: r.type,
        checkDate: r.check_date,
        status: r.status,
        result: r.result,
        locationGps: r.location_gps,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [],
        photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos || [],
        remark: r.remark,
        createdAt: r.created_at,
        submittedAt: r.submitted_at,
      })) as InspectionRecord[];

      // Filter by userId and deviceId
      if (userId) {
        mappedRecords = mappedRecords.filter((r) => r.userId === userId);
      }
      if (deviceId) {
        mappedRecords = mappedRecords.filter((r) => r.deviceId === deviceId);
      }

      set({ records: mappedRecords, isLoading: false });
    } catch (error) {
      console.error('Error fetching records:', error);
      set({ records: [], isLoading: false });
    }
  },

  fetchRecordById: async (id: string) => {
    const record = await dbUtils.queryOne<any>(TableNames.INSPECTION_RECORD, 'id = ?', [id]);
    if (record) {
      return {
        id: record.id,
        recordNo: record.record_no,
        taskId: record.task_id,
        taskNo: record.task_no,
        deviceId: record.device_id,
        deviceName: record.device_name,
        userId: record.user_id,
        userName: record.user_name,
        type: record.type,
        checkDate: record.check_date,
        status: record.status,
        result: record.result,
        locationGps: record.location_gps,
        items: typeof record.items === 'string' ? JSON.parse(record.items) : record.items || [],
        photos: typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos || [],
        remark: record.remark,
        createdAt: record.created_at,
        submittedAt: record.submitted_at,
      } as InspectionRecord;
    }
    return null;
  },

  createRecord: async (record: Partial<InspectionRecord>) => {
    const now = Date.now();
    const recordId = `ins_${now}`;
    const newRecord: InspectionRecord = {
      id: recordId,
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

    await dbUtils.insert(TableNames.INSPECTION_RECORD, {
      id: newRecord.id,
      device_id: newRecord.deviceId,
      device_name: newRecord.deviceName,
      user_id: newRecord.userId,
      user_name: newRecord.userName,
      task_id: newRecord.taskId,
      type: newRecord.type,
      status: newRecord.status,
      items: JSON.stringify(newRecord.items),
      photos: JSON.stringify(newRecord.photos),
      remark: newRecord.notes,
      created_at: newRecord.createdAt,
      updated_at: newRecord.updatedAt,
      sync_status: 'pending',
    });

    set({ records: [...get().records, newRecord], currentRecord: newRecord });

    return newRecord;
  },

  updateRecord: async (id: string, updates: Partial<InspectionRecord>) => {
    const records = get().records;
    const index = records.findIndex((r) => r.id === id);

    if (index >= 0) {
      const updated = { ...records[index], ...updates, updatedAt: Date.now() };

      // Map updates to database fields
      const dbUpdates: any = {
        updated_at: Date.now(),
      };
      if (updates.items !== undefined) dbUpdates.items = JSON.stringify(updates.items);
      if (updates.photos !== undefined) dbUpdates.photos = JSON.stringify(updates.photos);
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.result !== undefined) dbUpdates.result = updates.result;
      if (updates.notes !== undefined) dbUpdates.remark = updates.notes;

      await dbUtils.update(TableNames.INSPECTION_RECORD, dbUpdates, 'id = ?', [id]);

      records[index] = updated;
      set({ records: [...records] });
    }
  },

  deleteRecord: async (id: string) => {
    await dbUtils.delete(TableNames.INSPECTION_RECORD, 'id = ?', [id]);

    const records = get().records.filter((r) => r.id !== id);
    set({ records });
  },

  submitRecord: async (record: InspectionRecord) => {
    const updated = { ...record, status: 'completed' as const, updatedAt: Date.now() };

    await dbUtils.update(
      TableNames.INSPECTION_RECORD,
      {
        status: 'completed',
        result: record.result,
        remark: record.notes,
        items: JSON.stringify(record.items),
        photos: JSON.stringify(record.photos),
        updated_at: Date.now(),
        submitted_at: Date.now(),
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
    const tasks = await dbUtils.queryAll<any>(TableNames.INSPECTION_TASK);
    set({
      tasks: tasks.map((t: any) => ({
        id: t.id,
        taskNo: t.task_no,
        taskType: t.task_type,
        deviceIds: typeof t.device_ids === 'string' ? JSON.parse(t.device_ids) : t.deviceIds || [],
        deviceNames: t.device_names,
        deptId: t.dept_id,
        deptName: t.dept_name,
        assigneeId: t.assignee_id,
        assigneeName: t.assignee_name,
        assignerId: t.assigner_id,
        assignerName: t.assigner_name,
        planDate: t.plan_date,
        dueDate: t.due_date,
        status: t.status,
        priority: t.priority,
        remark: t.remark,
        createdAt: t.created_at,
        completedAt: t.completed_at,
      })),
    });
  },

  fetchTaskById: async (id: string) => {
    const task = await dbUtils.queryOne<any>(TableNames.INSPECTION_TASK, 'id = ?', [id]);
    if (task) {
      return {
        id: task.id,
        taskNo: task.task_no,
        taskType: task.task_type,
        deviceIds: typeof task.device_ids === 'string' ? JSON.parse(task.device_ids) : task.deviceIds || [],
        deviceNames: task.device_names,
        deptId: task.dept_id,
        deptName: task.dept_name,
        assigneeId: task.assignee_id,
        assigneeName: task.assignee_name,
        assignerId: task.assigner_id,
        assignerName: task.assigner_name,
        planDate: task.plan_date,
        dueDate: task.due_date,
        status: task.status,
        priority: task.priority,
        remark: task.remark,
        createdAt: task.created_at,
        completedAt: task.completed_at,
      } as InspectionTask;
    }
    return null;
  },
}));
