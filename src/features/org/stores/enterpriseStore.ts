import { create } from 'zustand';
import { Enterprise, EnterpriseFormData } from '../types';
import { dbUtils, TableNames, syncHelpers } from '../../../core/storage/sqlite';

interface EnterpriseState {
  enterprises: Enterprise[];
  currentEnterprise: Enterprise | null;
  isLoading: boolean;

  fetchEnterprises: () => Promise<void>;
  fetchEnterpriseById: (id: string) => Promise<Enterprise | null>;
  createEnterprise: (data: EnterpriseFormData) => Promise<Enterprise>;
  updateEnterprise: (id: string, data: Partial<EnterpriseFormData>) => Promise<void>;
  deleteEnterprise: (id: string) => Promise<void>;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  enterprises: [],
  currentEnterprise: null,
  isLoading: false,

  fetchEnterprises: async () => {
    set({ isLoading: true });
    try {
      const dbEnterprises = await dbUtils.queryAll<any>(TableNames.ENTERPRISE);

      const enterprises = dbEnterprises.map((e: any) => ({
        id: e.id,
        name: e.name,
        logo: e.logo,
        contactPhone: e.contact_phone,
        address: e.address,
        status: e.status,
        createdAt: e.created_at,
      })) as Enterprise[];

      set({ enterprises, isLoading: false });
    } catch (error) {
      console.error('Error fetching enterprises:', error);
      set({ enterprises: [], isLoading: false });
    }
  },

  fetchEnterpriseById: async (id: string) => {
    const enterprise = await dbUtils.queryOne<any>(TableNames.ENTERPRISE, 'id = ?', [id]);
    if (enterprise) {
      return {
        id: enterprise.id,
        name: enterprise.name,
        logo: enterprise.logo,
        contactPhone: enterprise.contact_phone,
        address: enterprise.address,
        status: enterprise.status,
        createdAt: enterprise.created_at,
      } as Enterprise;
    }
    return null;
  },

  createEnterprise: async (data: EnterpriseFormData) => {
    const now = Date.now();
    const id = `ent_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const newEnterprise: Enterprise = {
      id,
      name: data.name,
      logo: data.logo,
      contactPhone: data.contactPhone,
      address: data.address,
      status: data.status ?? 1,
      createdAt: now,
    };

    await dbUtils.insert(TableNames.ENTERPRISE, {
      id: newEnterprise.id,
      name: newEnterprise.name,
      logo: newEnterprise.logo,
      contact_phone: newEnterprise.contactPhone,
      address: newEnterprise.address,
      status: newEnterprise.status,
      created_at: newEnterprise.createdAt,
    });

    set({ enterprises: [...get().enterprises, newEnterprise] });

    return newEnterprise;
  },

  updateEnterprise: async (id: string, data: Partial<EnterpriseFormData>) => {
    const dbUpdates: any = {};

    if (data.name !== undefined) dbUpdates.name = data.name;
    if (data.logo !== undefined) dbUpdates.logo = data.logo;
    if (data.contactPhone !== undefined) dbUpdates.contact_phone = data.contactPhone;
    if (data.address !== undefined) dbUpdates.address = data.address;
    if (data.status !== undefined) dbUpdates.status = data.status;

    await dbUtils.update(TableNames.ENTERPRISE, dbUpdates, 'id = ?', [id]);

    const enterprises = get().enterprises;
    const index = enterprises.findIndex((e) => e.id === id);
    if (index >= 0) {
      enterprises[index] = { ...enterprises[index], ...dbUpdates };
      set({ enterprises: [...enterprises] });
    }
  },

  deleteEnterprise: async (id: string) => {
    await dbUtils.delete(TableNames.ENTERPRISE, 'id = ?', [id]);

    const enterprises = get().enterprises.filter((e) => e.id !== id);
    set({ enterprises });
  },
}));
