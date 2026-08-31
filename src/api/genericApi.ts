import type { AxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import type {
  GenericRecord, PaginatedResponse, AuditLogEntry, NoteEntry, DocumentEntry,
  TodoEntry, TodoCategoryEntry, NotificationEntry, UserOption,
} from "../types/api";
import type { SavedView } from "../types/module";

export interface ListParams {
  page?: number;
  pageSize?: number;
  ordering?: string; // "-created_date" for desc
  search?: string;
  filters?: Record<string, unknown>;
}

function buildQuery(params: ListParams) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("page_size", String(params.pageSize));
  if (params.ordering) q.set("ordering", params.ordering);
  if (params.search) q.set("search", params.search);
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    }
  }
  return q.toString();
}

/** Generic record CRUD, bound to a module's DRF endpoint. */
export class GenericApi {
  private endpoint: string;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async list(params: ListParams = {}, config?: AxiosRequestConfig): Promise<PaginatedResponse> {
    const qs = buildQuery(params);
    const { data } = await apiClient.get(`${this.endpoint}${qs ? `?${qs}` : ""}`, config);
    return data;
  }

  async retrieve(id: string): Promise<GenericRecord> {
    const { data } = await apiClient.get(`${this.endpoint}${id}/`);
    return data;
  }

  async create(payload: Partial<GenericRecord>, config?: AxiosRequestConfig): Promise<GenericRecord> {
    const { data } = await apiClient.post(this.endpoint, payload, config);
    return data;
  }

  async update(id: string, payload: Partial<GenericRecord>): Promise<GenericRecord> {
    const { data } = await apiClient.patch(`${this.endpoint}${id}/`, payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}${id}/`);
  }

  async restore(id: string): Promise<void> {
    await apiClient.post(`${this.endpoint}${id}/restore/`);
  }

  async bulkUpdate(ids: string[], fields: Record<string, unknown>): Promise<{ updated: number }> {
    const { data } = await apiClient.post(`${this.endpoint}bulk_update/`, { ids, fields });
    return data;
  }

  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    const { data } = await apiClient.post(`${this.endpoint}bulk_delete/`, { ids });
    return data;
  }
}

/** Cross-module sub-resources shared by every record (Log Notes/Documents/To-Dos/Audit). */
export const platformApi = {
  async getAuditLog(contentType: string, objectId: string): Promise<AuditLogEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>(
      `/api/audit/logs/?content_type=${contentType}&object_id=${objectId}&ordering=-timestamp`
    );
    return data.results;
  },

  async getNotes(contentType: string, objectId: string): Promise<NoteEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<NoteEntry>>(
      `/api/notes/notes/?content_type=${contentType}&object_id=${objectId}`
    );
    return data.results;
  },
  async addNote(payload: { content_type: string; object_id: string; body: string; is_internal: boolean }) {
    const { data } = await apiClient.post("/api/notes/notes/", payload);
    return data;
  },

  async getDocuments(contentType: string, objectId: string): Promise<DocumentEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<DocumentEntry>>(
      `/api/documents/documents/?content_type=${contentType}&object_id=${objectId}`
    );
    return data.results;
  },
  /**
   * Creates the Document *and* its first version in one call. The old
   * two-step flow (POST document, then POST version) could leave an
   * attachment row with no file behind it if the second call failed.
   */
  async uploadDocument(payload: {
    contentTypeId: string; objectId: string; file: File; title?: string; category?: string;
  }): Promise<DocumentEntry> {
    const form = new FormData();
    form.append("content_type", payload.contentTypeId);
    form.append("object_id", payload.objectId);
    form.append("file", payload.file);
    form.append("title", payload.title || payload.file.name);
    if (payload.category) form.append("category", payload.category);
    const { data } = await apiClient.post("/api/documents/documents/upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async getTodos(relatedContentType: string, relatedObjectId: string): Promise<TodoEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<TodoEntry>>(
      `/api/todos/todos/?related_content_type=${relatedContentType}&related_object_id=${relatedObjectId}`
    );
    return data.results;
  },
  async createTodo(payload: Partial<TodoEntry> & { related_content_type?: string; related_object_id?: string }) {
    const { data } = await apiClient.post("/api/todos/todos/", payload);
    return data;
  },
  /** Close a to-do. The server rejects this unless the caller is the assignee
   *  (or the person who assigned it) — see todos.views.TodoViewSet.close. */
  async closeTodo(id: string, closingRemarks: string): Promise<TodoEntry> {
    const { data } = await apiClient.post(`/api/todos/todos/${id}/close/`, {
      closing_remarks: closingRemarks,
    });
    return data;
  },
  async reopenTodo(id: string): Promise<TodoEntry> {
    const { data } = await apiClient.post(`/api/todos/todos/${id}/reopen/`);
    return data;
  },
  async getTodoCategories(): Promise<TodoCategoryEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<TodoCategoryEntry>>(
      "/api/todos/categories/?page_size=200&is_active=true"
    );
    return data.results;
  },

  /** Assignee picker source. */
  async getUsers(): Promise<UserOption[]> {
    const { data } = await apiClient.get<PaginatedResponse<UserOption>>(
      "/api/auth/users/?page_size=200&is_active=true"
    );
    return data.results;
  },

  async getNotifications(): Promise<NotificationEntry[]> {
    const { data } = await apiClient.get<PaginatedResponse<NotificationEntry>>(
      "/api/notifications/notifications/?page_size=30&ordering=-created_date"
    );
    return data.results;
  },
  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>(
      "/api/notifications/notifications/unread_count/"
    );
    return data.count;
  },
  async markNotificationRead(id: string) {
    await apiClient.post(`/api/notifications/notifications/${id}/mark_read/`);
  },
  async markAllNotificationsRead() {
    await apiClient.post("/api/notifications/notifications/mark_all_read/");
  },
};

/**
 * Saved list-view presets. Server-backed (core.SavedView) rather than
 * localStorage, so a view a user saves is scoped to their account and the
 * company they were working in, follows them across devices, and can be
 * published to colleagues with `is_shared`.
 */
export const savedViewApi = {
  async list(moduleKey: string): Promise<SavedView[]> {
    const { data } = await apiClient.get<PaginatedResponse<SavedView>>(
      `/api/core/saved-views/?module_key=${encodeURIComponent(moduleKey)}&page_size=100`
    );
    return data.results;
  },
  async create(payload: Partial<SavedView>): Promise<SavedView> {
    const { data } = await apiClient.post("/api/core/saved-views/", payload);
    return data;
  },
  async update(id: string, payload: Partial<SavedView>): Promise<SavedView> {
    const { data } = await apiClient.patch(`/api/core/saved-views/${id}/`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/core/saved-views/${id}/`);
  },
  async toggleFavorite(id: string): Promise<SavedView> {
    const { data } = await apiClient.post(`/api/core/saved-views/${id}/toggle_favorite/`);
    return data;
  },
};
