export interface Tag {
  _id: string;
  name: string;
  color: string;
  isDefault: boolean;
  description?: string;
  taskCount: number;
  completedCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagPayload {
  name: string;
  color?: string;
  isDefault?: boolean;
  description?: string;
}

export interface UpdateTagPayload {
  name?: string;
  color?: string;
  isDefault?: boolean;
  description?: string;
}
