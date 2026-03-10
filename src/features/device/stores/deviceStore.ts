import { create } from 'zustand';
import { Device, DeviceType, DeviceLocation, ChecklistTemplate, ChecklistItem } from '../../../types';
import { dbUtils, TableNames, syncHelpers } from '../../../core/storage/sqlite';

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
      // Query from real SQLite database
      let devices = await dbUtils.queryAll<any>(TableNames.DEVICE, deptId ? `dept_id = ?` : undefined, deptId ? [deptId] : []);

      // Map database fields to Device
      const mappedDevices = devices.map((d: any) => ({
        id: d.id,
        name: d.name,
        deviceNo: d.device_no,
        qrCode: d.qr_code,
        typeId: d.device_type_id,
        typeName: d.device_type_name,
        locationId: d.device_location_id,
        locationName: d.device_location_name,
        deptId: d.dept_id,
        deptName: d.dept_name,
        brand: d.brand,
        model: d.model,
        serialNo: d.serial_no,
        purchaseDate: d.purchase_date,
        installDate: d.install_date,
        responsibleId: d.responsible_id,
        responsibleName: d.responsible_name,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })) as Device[];

      set({ devices: mappedDevices, isLoading: false });
    } catch (error) {
      console.error('Error fetching devices:', error);
      set({ devices: [], isLoading: false });
    }
  },

  fetchDeviceById: async (id: string) => {
    const device = await dbUtils.queryOne<any>(TableNames.DEVICE, 'id = ?', [id]);
    if (device) {
      return {
        id: device.id,
        name: device.name,
        deviceNo: device.device_no,
        qrCode: device.qr_code,
        typeId: device.device_type_id,
        typeName: device.device_type_name,
        locationId: device.device_location_id,
        locationName: device.device_location_name,
        deptId: device.dept_id,
        deptName: device.dept_name,
        brand: device.brand,
        model: device.model,
        serialNo: device.serial_no,
        purchaseDate: device.purchase_date,
        installDate: device.install_date,
        responsibleId: device.responsible_id,
        responsibleName: device.responsible_name,
        status: device.status,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      } as Device;
    }
    return null;
  },

  fetchDeviceByQR: async (qrCode: string) => {
    const device = await dbUtils.queryOne<any>(TableNames.DEVICE, 'qr_code = ?', [qrCode]);
    if (device) {
      return {
        id: device.id,
        name: device.name,
        deviceNo: device.device_no,
        qrCode: device.qr_code,
        typeId: device.device_type_id,
        typeName: device.device_type_name,
        locationId: device.device_location_id,
        locationName: device.device_location_name,
        deptId: device.dept_id,
        deptName: device.dept_name,
        brand: device.brand,
        model: device.model,
        serialNo: device.serial_no,
        purchaseDate: device.purchase_date,
        installDate: device.install_date,
        responsibleId: device.responsible_id,
        responsibleName: device.responsible_name,
        status: device.status,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      } as Device;
    }
    return null;
  },

  setCurrentDevice: (device: Device | null) => {
    set({ currentDevice: device });
  },

  fetchDeviceTypes: async () => {
    const types = await dbUtils.queryAll<DeviceType>(TableNames.DEVICE_TYPE);
    set({ deviceTypes: types });
  },

  fetchLocations: async () => {
    const locations = await dbUtils.queryAll<DeviceLocation>(TableNames.DEVICE_LOCATION);
    set({ locations });
  },

  fetchTemplates: async () => {
    const templates = await dbUtils.queryAll<any>(TableNames.CHECKLIST_TEMPLATE);
    set({
      templates: templates.map((t: any) => ({
        id: t.id,
        deviceId: t.device_id,
        name: t.name,
        items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    });
  },

  getTemplateItems: async (templateId: string) => {
    const template = await dbUtils.queryOne<any>(TableNames.CHECKLIST_TEMPLATE, 'id = ?', [templateId]);
    if (template) {
      return JSON.parse(template.items) as ChecklistItem[];
    }
    return [];
  },

  saveDevice: async (device: Partial<Device>) => {
    const now = Date.now();
    const deviceId = device.id || `dev_${now}`;

    await dbUtils.insert(TableNames.DEVICE, {
      id: deviceId,
      name: device.name,
      device_no: device.deviceNo,
      qr_code: device.qrCode,
      device_type_id: device.typeId,
      device_type_name: device.typeName,
      device_location_id: device.locationId,
      device_location_name: device.locationName,
      dept_id: device.deptId,
      dept_name: device.deptName,
      brand: device.brand,
      model: device.model,
      serial_no: device.serialNo,
      purchase_date: device.purchaseDate,
      install_date: device.installDate,
      responsible_id: device.responsibleId,
      responsible_name: device.responsibleName,
      status: device.status || 'normal',
      created_at: device.createdAt || now,
      updated_at: now,
      sync_status: 'pending',
    });

    // Update local state
    const devices = get().devices;
    const existingIndex = devices.findIndex((d) => d.id === deviceId);

    const newDevice: Device = {
      id: deviceId,
      name: device.name || '',
      deviceNo: device.deviceNo,
      qrCode: device.qrCode,
      typeId: device.typeId,
      typeName: device.typeName,
      locationId: device.locationId,
      locationName: device.locationName,
      deptId: device.deptId,
      deptName: device.deptName,
      brand: device.brand,
      model: device.model,
      serialNo: device.serialNo,
      purchaseDate: device.purchaseDate,
      installDate: device.installDate,
      responsibleId: device.responsibleId,
      responsibleName: device.responsibleName,
      status: device.status || 'normal',
      createdAt: device.createdAt || now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      devices[existingIndex] = newDevice;
    } else {
      devices.push(newDevice);
    }

    set({ devices });
  },

  deleteDevice: async (id: string) => {
    await dbUtils.delete(TableNames.DEVICE, 'id = ?', [id]);

    const devices = get().devices.filter((d) => d.id !== id);
    set({ devices });
  },
}));
