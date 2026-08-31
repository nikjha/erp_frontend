// Generic field/module configuration that drives list views, forms, filters,
// export, and detail pages for ANY module without writing new UI code.

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "relation"
  | "email"
  | "url"
  | "image"
  | "file"
  | "json"
  | "uuid";

export interface SelectOption {
  value: string | number | boolean;
  label: string;
}

export interface FieldConfig {
  /** Backend field name (matches DRF serializer field) */
  name: string;
  /** Column / form label */
  label: string;
  type: FieldType;
  /** Shown as a DataGrid column by default */
  showInList?: boolean;
  /** Shown in the generic create/edit form */
  showInForm?: boolean;
  /** Included in quick/global search */
  searchable?: boolean;
  /** Sortable in the list view */
  sortable?: boolean;
  /** Offered as a field in the dynamic filter builder */
  filterable?: boolean;
  /** Offered in the dynamic "Group by" picker */
  groupable?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Static options for select/multiselect */
  options?: SelectOption[];
  /** For type "relation": which module to resolve display value + link from */
  relationModule?: string;
  relationLabelField?: string;
  width?: number;
  /** Pin column left/right in the grid */
  pinned?: "left" | "right";
  helpText?: string;
  /**
   * For a "relation" field inside a LineItemConfig: constrain the dropdown
   * to rows where `relatedField` on the related model equals the parent
   * document's `parentField` value. E.g. a Goods Receipt line's `po_line`
   * picker should only list lines belonging to the PO chosen in the
   * header: { parentField: "purchase_order", relatedField: "order" }.
   */
  filterBy?: { parentField: string; relatedField: string };
}

export interface DocumentActionInput {
  name: string;
  label: string;
  type: "number" | "text" | "date";
}

export interface DocumentAction {
  /** URL segment — POSTs to `${endpoint}${id}/${key}/` */
  key: string;
  label: string;
  requiresConfirmation?: boolean;
  /** If set, a small dialog collects this one field before POSTing it as the body. */
  input?: DocumentActionInput;
  /** Only show this action when the record's status field has one of these values. */
  visibleForStatus?: string[];
}

export interface LineItemConfig {
  /** DRF endpoint for the line model, e.g. "/api/sales/salesorderlines/" */
  endpoint: string;
  /** FK field on the line pointing back to the parent, e.g. "order" */
  parentField: string;
  /** Editable columns, in display order */
  fields: FieldConfig[];
}

export interface ModuleConfig {
  /** Unique key, e.g. "companies" */
  key: string;
  /** Display name, e.g. "Companies" */
  label: string;
  labelSingular: string;
  /** DRF API base path, e.g. "/api/companies/companies/" */
  endpoint: string;
  icon?: string;
  /** Groups modules into nav sections (Sales, Purchase, Masters...); ungrouped modules go under "General". */
  group?: string;
  fields: FieldConfig[];
  /** Field used as the record's human title (for timeline/breadcrumbs) */
  titleField: string;
  /** Django app_label + model name, used to resolve the ContentType id for
   * Notes/Documents/Todos/Audit generic-FK lookups (e.g. "companies", "company") */
  contentTypeApp: string;
  contentTypeModel: string;
  /** Enable standard platform features (all default to true) */
  features?: {
    notes?: boolean;
    documents?: boolean;
    todos?: boolean;
    activityTimeline?: boolean;
    comments?: boolean;
    softDelete?: boolean;
    bulkActions?: boolean;
    import?: boolean;
    export?: boolean;
    savedViews?: boolean;
  };
  /** Default sort */
  defaultOrdering?: string;
  /** Editable line-item table shown under the header form (Sales/Purchase docs) */
  lineItems?: LineItemConfig;
  /** Workflow buttons (Confirm, Cancel, Convert to Invoice...) shown on the detail page */
  actions?: DocumentAction[];
  /** Header fields that are computed totals — shown read-only in a summary strip, never in the edit form */
  totalsFields?: string[];
  /** Buttons that navigate to a dedicated sub-page instead of POSTing an action, e.g. RFQ -> vendor quote comparison. */
  customLinks?: { label: string; suffix: string }[];
  /** Registered for relation-dropdown lookups (e.g. GRN's PO-line picker) but not shown as its own nav item. */
  hideFromNav?: boolean;
  /**
   * rbac.Module.code this screen belongs to ("sales", "purchase",
   * "masters", "administration"). Drives both the app toggle and the
   * per-action RBAC gating (Import/Delete/Export). Falls back to the
   * lower-cased `group` when omitted, which is how every module in the
   * registry currently resolves.
   */
  moduleCode?: string;
}

/** Resolve the rbac module code a screen is governed by. */
export function moduleCodeOf(module: ModuleConfig): string {
  return module.moduleCode ?? (module.group ?? "general").toLowerCase();
}

export const DEFAULT_FEATURES: Required<NonNullable<ModuleConfig["features"]>> = {
  notes: true,
  documents: true,
  todos: true,
  activityTimeline: true,
  comments: true,
  softDelete: true,
  bulkActions: true,
  import: true,
  export: true,
  savedViews: true,
};

/**
 * Filter operators offered by the dynamic filter builder. Each maps to a
 * real Django lookup so the server does the filtering, not the browser —
 * `not` is the one exception, translated to `.exclude()` server-side
 * (`core.viewsets.BaseModelViewSet.get_queryset`).
 */
export type FilterOperator =
  | "exact"
  | "not"
  | "icontains"
  | "istartswith"
  | "iendswith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "range"
  | "isnull";

/** One row in the filter builder: a field, an operator, and a value. */
export interface FilterCondition {
  /** Client-side row key; never sent to the server. */
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  /** Second bound, used only by the "between" (range) operator. */
  value2?: unknown;
  /**
   * Human-readable form of `value`, captured when the value came from a
   * live lookup (a relation picker). Display only — never sent to the
   * server — so a filter chip reads "Customer is Acme Ltd" rather than a
   * UUID that means nothing to the person who set it.
   */
  valueLabel?: string;
}

/**
 * A saved list-view preset. Mirrors `core.SavedView` on the backend —
 * these live server-side now (per user, per company) rather than in
 * localStorage, so they follow a user across devices and can be shared
 * with colleagues in the same company.
 */
export interface SavedView {
  id: string;
  name: string;
  module_key: string;
  columns: string[];
  filters: FilterCondition[];
  sort_model: { field: string; sort: "asc" | "desc" }[];
  group_by: string[];
  is_favorite: boolean;
  is_shared: boolean;
  is_default: boolean;
  /** Read-only display fields from the API. */
  owner?: string;
  owner_name?: string;
  owner_username?: string;
  company_name?: string | null;
  is_mine?: boolean;
  created_date?: string;
}
