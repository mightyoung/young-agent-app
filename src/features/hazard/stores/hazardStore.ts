import { create } from 'zustand';
import { HazardRecord, HazardStatus, HazardType } from '../../../types';
import { dbUtils, TableNames, syncHelpers } from '../../../core/storage/sqlite';
import { config } from '../../../core/constants/config';
import {
  EntityType,
  generateBusinessId,
  generateBusinessNo,
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

// Hazard types configuration - using config

export const useHazardStore = create<HazardState>((set, get) => ({
  hazards: [],
  drafts: [],
  currentHazard: null,
  isLoading: false,

  fetchHazards: async (userId?: string, status?: HazardStatus) => {
    set({ isLoading: true });
    try {
      // Query from real SQLite database
      const dbHazards = await dbUtils.queryAll<any>(TableNames.HAZARD);

      // Map database fields to HazardRecord
      const hazards = dbHazards.map((h: any) => ({
        id: h.id,
        businessId: h.business_id,
        businessNo: h.business_no,
        source: h.source,
        photos: typeof h.photos === 'string' ? JSON.parse(h.photos) : h.photos || [],
        type: h.hazard_type,
        typeName: h.hazard_type_name,
        locationId: h.location_desc,
        locationName: h.location_desc,
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
      set({ hazards: [], isLoading: false });
    }
  },

  fetchHazardById: async (id: string) => {
    const hazard = await dbUtils.queryOne<any>(TableNames.HAZARD, 'id = ?', [id]);
    if (hazard) {
      return {
        ...hazard,
        photos: typeof hazard.photos === 'string' ? JSON.parse(hazard.photos) : hazard.photos,
        typeName: hazard.hazard_type_name,
        locationName: hazard.location_desc,
        userName: hazard.user_name,
        voiceNote: hazard.voice_note,
        voiceDuration: hazard.voice_duration,
        createdAt: hazard.created_at,
        updatedAt: hazard.updated_at,
      } as HazardRecord;
    }
    return null;
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

    await dbUtils.insert(TableNames.HAZARD, {
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

      await dbUtils.update(TableNames.HAZARD, dbUpdates, 'id = ?', [id]);

      hazards[index] = updated;
      set({ hazards: [...hazards] });
    }
  },

  deleteHazard: async (id: string) => {
    await dbUtils.delete(TableNames.HAZARD, 'id = ?', [id]);

    const hazards = get().hazards.filter((h) => h.id !== id);
    set({ hazards });
  },

  submitHazard: async (hazard: HazardRecord) => {
    const updated = { ...hazard, status: 'submitted' as HazardStatus, updatedAt: Date.now() };

    await dbUtils.update(
      TableNames.HAZARD,
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
    await dbUtils.update(
      TableNames.HAZARD,
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
    await dbUtils.update(
      TableNames.HAZARD,
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
    await dbUtils.update(
      TableNames.HAZARD,
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
    await dbUtils.update(
      TableNames.HAZARD,
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
