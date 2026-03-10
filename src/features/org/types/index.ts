// Organization Module Types

export interface Enterprise {
  id: string;
  name: string;
  logo?: string;
  contactPhone: string;
  address: string;
  status: number;
  createdAt: number;
}

export interface Department {
  id: string;
  enterpriseId: string;
  parentId?: string;
  name: string;
  code: string;
  leaderIds: string[];
  leaderNames: string[];
  sortOrder: number;
  status: number;
  createdAt: number;
}

// Form types
export interface EnterpriseFormData {
  name: string;
  contactPhone: string;
  address: string;
  status: number;
}

export interface DepartmentFormData {
  name: string;
  code: string;
  enterpriseId: string;
  parentId?: string;
  leaderIds: string[];
  sortOrder: number;
  status: number;
}
