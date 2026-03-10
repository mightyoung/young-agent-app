import { create } from 'zustand';
import { Department, DepartmentFormData } from '../types';
import { dbUtils, TableNames } from '../../../core/storage/sqlite';

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  isLoading: boolean;

  fetchDepartments: (enterpriseId?: string) => Promise<void>;
  fetchDepartmentById: (id: string) => Promise<Department | null>;
  createDepartment: (data: DepartmentFormData) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<DepartmentFormData>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  getSubDepartments: (parentId: string) => Department[];
  getDepartmentsByEnterprise: (enterpriseId: string) => Department[];
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: [],
  currentDepartment: null,
  isLoading: false,

  fetchDepartments: async (enterpriseId?: string) => {
    set({ isLoading: true });
    try {
      let dbDepartments;

      if (enterpriseId) {
        dbDepartments = await dbUtils.queryAll<any>(
          TableNames.DEPARTMENT,
          'enterprise_id = ?',
          [enterpriseId]
        );
      } else {
        dbDepartments = await dbUtils.queryAll<any>(TableNames.DEPARTMENT);
      }

      const departments = dbDepartments.map((d: any) => ({
        id: d.id,
        enterpriseId: d.enterprise_id,
        parentId: d.parent_id,
        name: d.name,
        code: d.code,
        leaderIds: typeof d.leader_id === 'string' ? JSON.parse(d.leader_id) : d.leaderIds || [],
        leaderNames: typeof d.leader_name === 'string' ? JSON.parse(d.leader_name) : d.leaderNames || [],
        sortOrder: d.sort_order || 0,
        status: d.status,
        createdAt: d.created_at,
      })) as Department[];

      set({ departments, isLoading: false });
    } catch (error) {
      console.error('Error fetching departments:', error);
      set({ departments: [], isLoading: false });
    }
  },

  fetchDepartmentById: async (id: string) => {
    const department = await dbUtils.queryOne<any>(TableNames.DEPARTMENT, 'id = ?', [id]);
    if (department) {
      return {
        id: department.id,
        enterpriseId: department.enterprise_id,
        parentId: department.parent_id,
        name: department.name,
        code: department.code,
        leaderIds: typeof department.leader_id === 'string' ? JSON.parse(department.leader_id) : [],
        leaderNames: typeof department.leader_name === 'string' ? JSON.parse(department.leader_name) : [],
        sortOrder: department.sort_order || 0,
        status: department.status,
        createdAt: department.created_at,
      } as Department;
    }
    return null;
  },

  createDepartment: async (data: DepartmentFormData) => {
    const now = Date.now();
    const id = `dept_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const newDepartment: Department = {
      id,
      enterpriseId: data.enterpriseId,
      parentId: data.parentId,
      name: data.name,
      code: data.code,
      leaderIds: data.leaderIds || [],
      leaderNames: data.leaderNames || [],
      sortOrder: data.sortOrder ?? 0,
      status: data.status ?? 1,
      createdAt: now,
    };

    await dbUtils.insert(TableNames.DEPARTMENT, {
      id: newDepartment.id,
      enterprise_id: newDepartment.enterpriseId,
      parent_id: newDepartment.parentId,
      name: newDepartment.name,
      code: newDepartment.code,
      leader_id: JSON.stringify(newDepartment.leaderIds),
      leader_name: JSON.stringify(newDepartment.leaderNames),
      sort_order: newDepartment.sortOrder,
      status: newDepartment.status,
      created_at: newDepartment.createdAt,
    });

    set({ departments: [...get().departments, newDepartment] });

    return newDepartment;
  },

  updateDepartment: async (id: string, data: Partial<DepartmentFormData>) => {
    const dbUpdates: any = {};

    if (data.name !== undefined) dbUpdates.name = data.name;
    if (data.code !== undefined) dbUpdates.code = data.code;
    if (data.enterpriseId !== undefined) dbUpdates.enterprise_id = data.enterpriseId;
    if (data.parentId !== undefined) dbUpdates.parent_id = data.parentId;
    if (data.leaderIds !== undefined) dbUpdates.leader_id = JSON.stringify(data.leaderIds);
    if (data.leaderNames !== undefined) dbUpdates.leader_name = JSON.stringify(data.leaderNames);
    if (data.sortOrder !== undefined) dbUpdates.sort_order = data.sortOrder;
    if (data.status !== undefined) dbUpdates.status = data.status;

    await dbUtils.update(TableNames.DEPARTMENT, dbUpdates, 'id = ?', [id]);

    const departments = get().departments;
    const index = departments.findIndex((d) => d.id === id);
    if (index >= 0) {
      departments[index] = { ...departments[index], ...dbUpdates };
      set({ departments: [...departments] });
    }
  },

  deleteDepartment: async (id: string) => {
    await dbUtils.delete(TableNames.DEPARTMENT, 'id = ?', [id]);

    const departments = get().departments.filter((d) => d.id !== id);
    set({ departments });
  },

  getSubDepartments: (parentId: string) => {
    return get().departments.filter((d) => d.parentId === parentId);
  },

  getDepartmentsByEnterprise: (enterpriseId: string) => {
    return get().departments.filter((d) => d.enterpriseId === enterpriseId);
  },
}));
