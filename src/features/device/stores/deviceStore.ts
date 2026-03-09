import { create } from 'zustand';
import { Device, DeviceType, DeviceLocation, ChecklistTemplate, ChecklistItem } from '../../../types';
import { dbHelpers } from '../../../core/storage/database';

interface DeviceState {
  devices: Device[];
  currentDevice: Device | null;
  deviceTypes: DeviceType[];
  locations: DeviceLocation[];
  templates: ChecklistTemplate[];
  isLoading: boolean;

  // Actions
  fetchDevices: (deptId?: string) => Promise<void>;
  fetchDeviceById: (id: string) => Promise<Device | null>;
  fetchDeviceByQR: (qrCode: string) => Promise<Device | null>;
  setCurrentDevice: (device: Device | null) => void;
  fetchDeviceTypes: () => Promise<void>;
  fetchLocations: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  getTemplateItems: (templateId: string) => Promise<ChecklistItem[]>;
  saveDevice: (device: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
}

// Mock data
const mockDeviceTypes: DeviceType[] = [
  { id: 'type1', name: '消防设备', code: 'fire' },
  { id: 'type2', name: '电气设备', code: 'electric' },
  { id: 'type3', name: '机械设备', code: 'mechanical' },
  { id: 'type4', name: '安全设施', code: 'safety' },
];

const mockLocations: DeviceLocation[] = [
  { id: 'loc1', name: 'A区一楼', code: 'A1' },
  { id: 'loc2', name: 'A区二楼', code: 'A2', parentId: 'loc1' },
  { id: 'loc3', name: 'B区一楼', code: 'B1' },
  { id: 'loc4', name: 'B区二楼', code: 'B2', parentId: 'loc3' },
];

const mockDevices: Device[] = [
  {
    id: 'dev1',
    name: '1号消防栓',
    qrCode: 'dev1_loc1_type1_dept1',
    typeId: 'type1',
    typeName: '消防设备',
    locationId: 'loc1',
    locationName: 'A区一楼',
    deptId: 'dept1',
    status: 'normal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dev2',
    name: '2号灭火器',
    qrCode: 'dev2_loc2_type1_dept1',
    typeId: 'type1',
    typeName: '消防设备',
    locationId: 'loc2',
    locationName: 'A区二楼',
    deptId: 'dept1',
    status: 'warning',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dev3',
    name: '配电箱1',
    qrCode: 'dev3_loc3_type2_dept1',
    typeId: 'type2',
    typeName: '电气设备',
    locationId: 'loc3',
    locationName: 'B区一楼',
    deptId: 'dept1',
    status: 'normal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl1',
    name: '消防设备检查清单',
    deviceId: 'dev1',
    items: [
      { id: 'item1', name: '检查消防栓是否有水', description: '确认消防栓有水压', required: true },
      { id: 'item2', name: '检查消防栓周围是否有杂物', description: '确保消防栓周围无遮挡', required: true },
      { id: 'item3', name: '检查消防栓标识是否清晰', description: '确认标识完整清晰', required: false },
    ],
  },
  {
    id: 'tpl2',
    name: '灭火器检查清单',
    deviceId: 'dev2',
    items: [
      { id: 'item4', name: '检查压力表', description: '确认指针在绿色区域', required: true },
      { id: 'item5', name: '检查有效期', description: '确认在有效期内', required: true },
      { id: 'item6', name: '检查铅封', description: '确认铅封完好', required: true },
    ],
  },
];

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  currentDevice: null,
  deviceTypes: [],
  locations: [],
  templates: [],
  isLoading: false,

  fetchDevices: async (deptId?: string) => {
    set({ isLoading: true });
    try {
      // Try to fetch from DB first
      let devices = await dbHelpers.queryAll<Device>('devices', 'dept_id = ?', [deptId || '']);

      if (devices.length === 0) {
        // Use mock data if DB is empty
        devices = deptId ? mockDevices.filter((d) => d.deptId === deptId) : mockDevices;
        // Save to DB
        for (const device of devices) {
          await dbHelpers.insert('devices', {
            ...device,
            created_at: device.createdAt,
            updated_at: device.updatedAt,
          });
        }
      }

      set({ devices, isLoading: false });
    } catch (error) {
      console.error('Error fetching devices:', error);
      set({ isLoading: false });
    }
  },

  fetchDeviceById: async (id: string) => {
    const device = await dbHelpers.queryOne<any>('devices', 'id = ?', [id]);
    if (device) {
      return {
        ...device,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      } as Device;
    }
    return mockDevices.find((d) => d.id === id) || null;
  },

  fetchDeviceByQR: async (qrCode: string) => {
    const device = await dbHelpers.queryOne<any>('devices', 'qr_code = ?', [qrCode]);
    if (device) {
      return {
        ...device,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      } as Device;
    }
    return mockDevices.find((d) => d.qrCode === qrCode) || null;
  },

  setCurrentDevice: (device: Device | null) => {
    set({ currentDevice: device });
  },

  fetchDeviceTypes: async () => {
    const types = await dbHelpers.queryAll<DeviceType>('device_types');
    if (types.length === 0) {
      for (const type of mockDeviceTypes) {
        await dbHelpers.insert('device_types', type);
      }
      set({ deviceTypes: mockDeviceTypes });
    } else {
      set({ deviceTypes: types });
    }
  },

  fetchLocations: async () => {
    const locations = await dbHelpers.queryAll<DeviceLocation>('device_locations');
    if (locations.length === 0) {
      for (const loc of mockLocations) {
        await dbHelpers.insert('device_locations', loc);
      }
      set({ locations: mockLocations });
    } else {
      set({ locations });
    }
  },

  fetchTemplates: async () => {
    const templates = await dbHelpers.queryAll<ChecklistTemplate>('checklist_templates');
    if (templates.length === 0) {
      for (const tpl of mockTemplates) {
        await dbHelpers.insert('checklist_templates', {
          ...tpl,
          items: JSON.stringify(tpl.items),
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
      set({ templates: mockTemplates });
    } else {
      set({
        templates: templates.map((t: any) => ({
          ...t,
          items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items,
        })),
      });
    }
  },

  getTemplateItems: async (templateId: string) => {
    const template = await dbHelpers.queryOne<any>('checklist_templates', 'id = ?', [templateId]);
    if (template) {
      return JSON.parse(template.items) as ChecklistItem[];
    }
    return mockTemplates.find((t) => t.id === templateId)?.items || [];
  },

  saveDevice: async (device: Partial<Device>) => {
    const now = Date.now();
    const newDevice = {
      ...device,
      id: device.id || `dev_${now}`,
      created_at: device.createdAt || now,
      updated_at: now,
    } as any;

    await dbHelpers.insert('devices', newDevice);

    // Update local state
    const devices = get().devices;
    const existingIndex = devices.findIndex((d) => d.id === newDevice.id);

    if (existingIndex >= 0) {
      devices[existingIndex] = { ...devices[existingIndex], ...newDevice };
    } else {
      devices.push(newDevice as Device);
    }

    set({ devices });
  },

  deleteDevice: async (id: string) => {
    await dbHelpers.delete('devices', 'id = ?', [id]);

    const devices = get().devices.filter((d) => d.id !== id);
    set({ devices });
  },
}));
