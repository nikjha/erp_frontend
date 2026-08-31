export type GenericRecord = Record<string, unknown> & {
  id: string;
  is_deleted?: boolean;
  created_date?: string;
  modified_date?: string;
  created_by?: string;
  modified_by?: string;
  version?: number;
};

export interface PaginatedResponse<T = GenericRecord> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string | null;
  user_name?: string;
  changed_fields: Record<string, { old: string; new: string }>;
  ip_address: string | null;
  timestamp: string;
}

export interface NoteEntry {
  id: string;
  body: string;
  is_internal: boolean;
  tags: string[];
  created_by: string;
  created_by_name?: string;
  created_date: string;
}

export interface DocumentVersionEntry {
  id: string;
  version_number: number;
  file: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size_bytes?: number;
  mime_type?: string;
}

export interface DocumentEntry {
  id: string;
  title: string;
  category: string;
  is_latest: boolean;
  created_date: string;
  created_by?: string;
  versions?: DocumentVersionEntry[];
  latest_version?: DocumentVersionEntry | null;
}

export interface TodoEntry {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to: string;
  assigned_to_name?: string;
  assigned_by?: string | null;
  assigned_by_name?: string;
  category?: string | null;
  category_name?: string;
  category_color?: string;
  due_date: string | null;
  progress_percent: number;
  closed_by?: string | null;
  closed_by_name?: string;
  closed_date?: string | null;
  closing_remarks?: string;
  /** Server's verdict on whether the current user may close this task. */
  can_close?: boolean;
}

export interface TodoCategoryEntry {
  id: string;
  name: string;
  code?: string;
  color?: string;
  is_active: boolean;
}

export interface NotificationEntry {
  id: string;
  title: string;
  body: string;
  channel: string;
  is_read: boolean;
  action_url: string;
  created_date: string;
}

export interface UserOption {
  id: string;
  username: string;
  employee_name: string;
  email?: string;
}

/** Effective RBAC flags for one module, as returned by /api/rbac/my-permissions/. */
export interface ModulePermissions {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_import: boolean;
  can_approve: boolean;
  can_print: boolean;
  data_scope?: string;
  field_permissions?: Record<string, "hidden" | "readonly" | "editable">;
}

export interface MyPermissionsResponse {
  is_superuser: boolean;
  /** False means RBAC isn't configured for this user — treat everything as allowed. */
  is_restricted: boolean;
  modules: Record<string, ModulePermissions>;
}
