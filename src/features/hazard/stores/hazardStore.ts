import { create } from 'zustand';
import { HazardRecord, HazardStatus, HazardType } from '../../../types';
import { dbHelpers, syncHelpers } from '../../../core/storage/database';
import { config } from '../../../core/constants/config';
import {
  EntityType,
  generateBusinessId,
  generateBusinessNo,
  roleConfig,
} from '../../../core/constants/business';

interface HazardState {
  hazards: HazardRecord[];
  drafts: HazardRecord[];
  currentHazard: Partial<HazardRecord> | null;
  isLoading: boolean;

  // Actions
  fetchHazards: (userId?: string, status?: HazardStatus) => Promise<void>;
  fetchHazardById: (id: string) => Promise<HazardRecord | null>;
  createHazard: (hazard: Partial<HazardRecord>) => Promise<HazardRecord>;
  updateHazard: (id: string, updates: Partial<HazardRecord>) => Promise<void>;
  deleteHazard: (id: string) => Promise<void>;
  submitHazard: (hazard: HazardRecord) => Promise<void>;
  confirmHazard: (id: string, userId: string) => Promise<void>;
  rectifyHazard: (id: string, description: string, userId: string) => Promise<void>;
  acceptHazard: (id: string, userId: string) => Promise<void>;
  rejectHazard: (id: string, reason: string, userId: string) => Promise<void>;
  saveDraft: (hazard: Partial<HazardRecord>) => void;
  getHazardTypes: () => { code: HazardType; name: string; icon: string }[];
}

// Mock data
const mockHazards: HazardRecord[] = [
  {
    id: 'hz1',
    businessId: '174116100012300000001',
    businessNo: 'HZ10001234001',
    source: 'photo',
    photos: [],
    type: 'fire',
    typeName: '火灾安全隐患',
    locationId: 'loc1',
    locationName: 'A区一楼',
    description: '发现堆放杂物堵塞消防通道',
    status: 'submitted',
    userId: '3',
    userName: 'user',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'hz2',
    businessId: '174116100012300000002',
    businessNo: 'HZ10001234002',
    source: 'inspection',
    photos: [],
    type: 'electric',
    typeName: '电力设施损坏',
    locationId: 'loc3',
    locationName: 'B区一楼',
    description: '配电箱门损坏',
    status: 'confirmed',
    userId: '2',
    userName: 'inspector',
    assigneeId: '2',
    confirmedAt: Date.now() - 43200000,
    confirmedBy: 'admin',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'hz3',
    businessId: '174116100012300000003',
    businessNo: 'HZ10001234003',
    source: 'photo',
    photos: [],
    type: 'construction',
    typeName: '违章建筑施工',
    locationId: 'loc2',
    locationName: 'A区二楼',
    description: '发现违章搭建',
    status: 'accepted',
    userId: '2',
    userName: 'inspector',
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now() - 259200000,
  },
];

export const useHazardStore = create<HazardState>((set, get) => ({
  hazards: [],
  drafts: [],
  currentHazard: null,
  isLoading: false,

  fetchHazards: async (userId?: string, status?: HazardStatus) => {
    set({ isLoading: true });
    try {
      const dbHazards = await dbHelpers.queryAll<any>('hazard_records');

      // 如果数据库为空，插入mock数据
      if (dbHazards.length === 0) {
        for (const hazard of mockHazards) {
          await dbHelpers.insert('hazard_records', {
            ...hazard,
            photos: JSON.stringify(hazard.photos),
            created_at: hazard.createdAt,
            updated_at: hazard.updatedAt,
          });
        }
        // 重新查询
        const hazards = await dbHelpers.queryAll<any>('hazard_records');
        // 映射数据库字段到HazardRecord
        const mappedHazards = hazards.map((h: any) => ({
          id: h.id,
          businessId: h.business_id,
          businessNo: h.business_no,
          source: h.source,
          photos: typeof h.photos === 'string' ? JSON.parse(h.photos) : h.photos || [],
          type: h.type,
          typeName: h.type_name,
          locationId: h.location_id,
          locationName: h.location_name,
          description: h.description,
          voiceNote: h.voice_note,
          voiceDuration: h.voice_duration,
          status: h.status,
          userId: h.user_id,
          userName: h.user_name,
          assigneeId: h.assignee_id,
          createdAt: h.created_at,
          updatedAt: h.updated_at,
        })) as HazardRecord[];

        let filtered = mappedHazards;
        if (userId) {
          filtered = filtered.filter((h) => h.userId === userId);
        }
        if (status) {
          filtered = filtered.filter((h) => h.status === status);
        }
        set({ hazards: filtered, isLoading: false });
        return;
      }

      // 映射数据库字段到HazardRecord
      const hazards = dbHazards.map((h: any) => ({
        id: h.id,
        businessId: h.business_id,
        businessNo: h.business_no,
        source: h.source,
        photos: typeof h.photos === 'string' ? JSON.parse(h.photos) : h.photos || [],
        type: h.type,
        typeName: h.type_name,
        locationId: h.location_id,
        locationName: h.location_name,
        description: h.description,
        voiceNote: h.voice_note,
        voiceDuration: h.voice_duration,
        status: h.status,
        userId: h.user_id,
        userName: h.user_name,
        assigneeId: h.assignee_id,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      })) as HazardRecord[];

      let filtered = hazards;
      if (userId) {
        filtered = filtered.filter((h) => h.userId === userId);
      }
      if (status) {
        filtered = filtered.filter((h) => h.status === status);
      }

      set({ hazards: filtered, isLoading: false });
    } catch (error) {
      console.error('Error fetching hazards:', error);
      set({ isLoading: false });
    }
  },

  fetchHazardById: async (id: string) => {
    const hazard = await dbHelpers.queryOne<any>('hazard_records', 'id = ?', [id]);
    if (hazard) {
      return {
        ...hazard,
        photos: typeof hazard.photos === 'string' ? JSON.parse(hazard.photos) : hazard.photos,
        typeName: hazard.type_name,
        locationName: hazard.location_name,
        userName: hazard.user_name,
        voiceNote: hazard.voice_note,
        voiceDuration: hazard.voice_duration,
        createdAt: hazard.created_at,
        updatedAt: hazard.updated_at,
      } as HazardRecord;
    }
    return mockHazards.find((h) => h.id === id) || null;
  },

  createHazard: async (hazard: Partial<HazardRecord>) => {
    const now = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const typeInfo = config.hazardTypes.find((t) => t.code === hazard.type);
    const primaryId = `hz_${now}_${randomSuffix}`;

    // 生成业务ID
    const userIdNum = hazard.userId ? parseInt(hazard.userId.replace(/[^0-9]/g, '').slice(-3), 10) || 1 : 1;
    const businessId = generateBusinessId(EntityType.HAZARD, userIdNum, primaryId);
    const businessNo = generateBusinessNo('hazard', primaryId);

    const newHazard: HazardRecord = {
      id: primaryId,
      businessId,
      businessNo,
      source: hazard.source || 'photo',
      photos: hazard.photos || [],
      type: hazard.type || 'other',
      typeName: typeInfo?.name || '其他',
      locationId: hazard.locationId,
      locationName: hazard.locationName,
      description: hazard.description || '',
      voiceNote: hazard.voiceNote,
      voiceDuration: hazard.voiceDuration,
      status: 'draft',
      userId: hazard.userId || '',
      userName: hazard.userName,
      createdAt: now,
      updatedAt: now,
    };

    await dbHelpers.insert('hazard_records', {
      id: newHazard.id,
      business_id: newHazard.businessId,
      business_no: newHazard.businessNo,
      source: newHazard.source,
      photos: JSON.stringify(newHazard.photos),
      type: newHazard.type,
      type_name: newHazard.typeName,
      location_id: newHazard.locationId,
      location_name: newHazard.locationName,
      description: newHazard.description,
      voice_note: newHazard.voiceNote,
      voice_duration: newHazard.voiceDuration,
      status: newHazard.status,
      user_id: newHazard.userId,
      user_name: newHazard.userName,
      created_at: newHazard.createdAt,
      updated_at: newHazard.updatedAt,
    });

    set({
      hazards: [...get().hazards, newHazard],
      drafts: [...get().drafts, newHazard],
      currentHazard: newHazard,
    });

    return newHazard;
  },

  updateHazard: async (id: string, updates: Partial<HazardRecord>) => {
    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === id);

    if (index >= 0) {
      const updated = { ...hazards[index], ...updates, updatedAt: Date.now() };

      // 映射camelCase到snake_case
      const dbUpdates: any = {
        updated_at: Date.now(),
      };
      if (updates.photos !== undefined) dbUpdates.photos = JSON.stringify(updates.photos);
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.typeName !== undefined) dbUpdates.type_name = updates.typeName;
      if (updates.locationId !== undefined) dbUpdates.location_id = updates.locationId;
      if (updates.locationName !== undefined) dbUpdates.location_name = updates.locationName;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.voiceNote !== undefined) dbUpdates.voice_note = updates.voiceNote;
      if (updates.voiceDuration !== undefined) dbUpdates.voice_duration = updates.voiceDuration;

      await dbHelpers.update('hazard_records', dbUpdates, 'id = ?', [id]);

      hazards[index] = updated;
      set({ hazards: [...hazards] });
    }
  },

  deleteHazard: async (id: string) => {
    await dbHelpers.delete('hazard_records', 'id = ?', [id]);

    const hazards = get().hazards.filter((h) => h.id !== id);
    set({ hazards });
  },

  submitHazard: async (hazard: HazardRecord) => {
    const updated = { ...hazard, status: 'submitted' as HazardStatus, updatedAt: Date.now() };

    await dbHelpers.update(
      'hazard_records',
      {
        status: 'submitted',
        updated_at: Date.now(),
        sync_status: 'pending',
      },
      'id = ?',
      [hazard.id]
    );

    // Add to sync queue
    await syncHelpers.addToQueue({
      type: 'create',
      entity: 'hazard',
      entityId: hazard.id,
      payload: updated,
    });

    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === hazard.id);
    if (index >= 0) {
      hazards[index] = updated;
      set({ hazards: [...hazards] });
    }
  },

  confirmHazard: async (id: string, userId: string) => {
    const now = Date.now();
    await dbHelpers.update(
      'hazard_records',
      {
        status: 'confirmed',
        confirmed_at: now,
        confirmed_by: userId,
        assignee_id: userId,
        updated_at: now,
      },
      'id = ?',
      [id]
    );

    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === id);
    if (index >= 0) {
      hazards[index] = {
        ...hazards[index],
        status: 'confirmed',
        confirmedAt: now,
        confirmedBy: userId,
        assigneeId: userId,
        updatedAt: now,
      };
      set({ hazards: [...hazards] });
    }
  },

  rectifyHazard: async (id: string, description: string, userId: string) => {
    const now = Date.now();
    await dbHelpers.update(
      'hazard_records',
      {
        status: 'rectifying',
        rectified_at: now,
        rectified_by: userId,
        rectified_description: description,
        updated_at: now,
      },
      'id = ?',
      [id]
    );

    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === id);
    if (index >= 0) {
      hazards[index] = {
        ...hazards[index],
        status: 'rectifying',
        rectifiedAt: now,
        rectifiedBy: userId,
        rectifiedDescription: description,
        updatedAt: now,
      };
      set({ hazards: [...hazards] });
    }
  },

  acceptHazard: async (id: string, userId: string) => {
    const now = Date.now();
    await dbHelpers.update(
      'hazard_records',
      {
        status: 'accepted',
        accepted_at: now,
        accepted_by: userId,
        updated_at: now,
      },
      'id = ?',
      [id]
    );

    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === id);
    if (index >= 0) {
      hazards[index] = {
        ...hazards[index],
        status: 'accepted',
        acceptedAt: now,
        acceptedBy: userId,
        updatedAt: now,
      };
      set({ hazards: [...hazards] });
    }
  },

  rejectHazard: async (id: string, reason: string, userId: string) => {
    const now = Date.now();
    await dbHelpers.update(
      'hazard_records',
      {
        status: 'rejected',
        reject_reason: reason,
        accepted_at: now,
        accepted_by: userId,
        updated_at: now,
      },
      'id = ?',
      [id]
    );

    const hazards = get().hazards;
    const index = hazards.findIndex((h) => h.id === id);
    if (index >= 0) {
      hazards[index] = {
        ...hazards[index],
        status: 'rejected',
        rejectReason: reason,
        acceptedAt: now,
        acceptedBy: userId,
        updatedAt: now,
      };
      set({ hazards: [...hazards] });
    }
  },

  saveDraft: (hazard: Partial<HazardRecord>) => {
    set({ currentHazard: hazard });
  },

  getHazardTypes: () => {
    return config.hazardTypes as { code: HazardType; name: string; icon: string }[];
  },
}));
