# ERP Frontend — Generic List/Detail Framework

React + TypeScript + MUI console that renders list and detail screens for **any** ERP module from a single config object — no per-module UI code.

## What's generic (works for every future module: CRM, Sales, Inventory, HRMS...)
- `src/types/module.ts` — `ModuleConfig`/`FieldConfig` schema. A module is just a list of typed fields + an API endpoint.
- `src/components/GenericListView.tsx` — dynamic columns, show/hide columns, sort, server-side pagination, quick search, a dynamic key/value filter builder, dynamic group-by, server-backed saved views, bulk select → bulk update/delete, and an RBAC-gated Settings menu for export (CSV/Excel/JSON), import (CSV/Excel with column mapping and preview) and delete.
- `src/components/GenericForm.tsx` — renders create/edit forms from field config (text, select, date/datetime, boolean, textarea, number...), every field on an explicit label row, with required-field validation.
- `src/components/GenericDetailView.tsx` — the form on the left, the record's history on the right (Log Notes / To-Dos / Activity), wired to the platform-standard backend apps via generic content-type resolution.
- `src/components/{LogNotesPanel,TodosPanel,ActivityTimeline}.tsx` — the reusable panels behind those tabs.
- `src/api/genericApi.ts` — one `GenericApi` class (list/retrieve/create/update/delete/restore/bulk) bound to any endpoint, plus `platformApi` for the shared Notes/Documents/Todos/Notifications/Audit sub-resources and `savedViewApi` for list-view presets.

## Adding a new module (e.g. CRM Leads)
1. Add a `ModuleConfig` object in `src/config/registry.ts` — field list, endpoint, `contentTypeApp`/`contentTypeModel` (matches the Django app/model powering it).
2. Push it into `moduleRegistry`.
3. Done — it appears under its app in the top menu, and gets list/detail/filter/group-by/saved-views/export/import/log-notes/todos/timeline for free.

No new components, no new routes, no new API code.

## Included example modules
`Company` (companies) and `User` (accounts) are wired end-to-end against the Django backend in `erp_platform.zip`.

## Run locally
```bash
cp .env.example .env   # set VITE_API_BASE_URL to your Django backend
npm install
npm run dev
```

## Verified in this build
- `npx tsc -b` — 0 type errors.
- `npm run build` — production bundle builds cleanly.

## Design
Console-style admin theme (not templated SaaS defaults): charcoal-navy top bar, warm paper canvas, muted amber primary accent, IBM Plex Mono reserved for identifiers/codes/timestamps so record data itself reads as data. Tokens in `src/theme.ts`.

## Line-item documents (Sales/Purchase)
Quotations, Sales/Purchase Orders, Invoices, and Vendor Bills are fully config-driven, no bespoke screens:

- **`ModuleConfig.lineItems`** — `{ endpoint, parentField, fields }`. `GenericDetailView` renders `DocumentLinesEditor` whenever this is set: inline add/edit/delete rows, live relation dropdowns (`RelationSelect` + `useRelationOptions`) sourced from other modules' real data (e.g. a line's "Product" dropdown is powered by the `products` module's own API).
- **`ModuleConfig.actions`** — workflow buttons (`DocumentActionsBar`): Confirm, Cancel, Submit for Approval, Convert to Invoice, Record Payment, Run 3-Way Match. POSTs to `{endpoint}{id}/{action.key}/`; supports confirmation dialogs (`requiresConfirmation`) and single-input dialogs (`input: {name, label, type}`, e.g. payment amount); `visibleForStatus` hides actions that don't apply to the record's current state.
- **`ModuleConfig.totalsFields`** — read-only computed totals (subtotal/tax/total/balance due) in a summary strip, straight from the backend-computed header record.
- **New master-data modules**: Customers & Vendors, Products, Currencies, UOMs, Taxes, Tax Groups, Payment Terms, Price Lists — both standalone screens and the dropdown sources line items need. Nav is now grouped (Sales / Purchase / Masters / Administration) since there are 18 modules registered.

### Adding a new document type with line items
```ts
export const myDocModule: ModuleConfig = {
  key: "my-docs", label: "My Docs", labelSingular: "Doc",
  endpoint: "/api/myapp/mydocs/", titleField: "doc_number",
  contentTypeApp: "myapp", contentTypeModel: "mydoc",
  totalsFields: ["total_amount"],
  actions: [{ key: "confirm", label: "Confirm", visibleForStatus: ["draft"] }],
  fields: [ /* header fields, as usual */ ],
  lineItems: {
    endpoint: "/api/myapp/mydoclines/", parentField: "doc",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "quantity", label: "Qty", type: "number" },
    ],
  },
};
```
That's it — line table, add/edit/delete, and totals all work immediately.

## Vendor Quote Comparison & Goods Receipt (added)
- **Goods Receipt** (`goods-receipts` module) is a standard config-driven document like the others, with one addition: its line-item `po_line` picker is *filtered* to only show lines belonging to the PO chosen in the header (`FieldConfig.filterBy: { parentField: "purchase_order", relatedField: "order" }`), instead of every PO line in the tenant. This is a reusable capability — any future document can filter a line's relation dropdown by another header field the same way.
- **Vendor Quote Comparison** (`/rfqs/:id/compare`, linked from the RFQ detail page via `ModuleConfig.customLinks`) is a dedicated page, not a generic list/detail — it's a genuine matrix (RFQ lines × vendor quotes) with inline price entry, per-vendor lead time and estimated total, select-winner, and convert-to-PO. This didn't fit the single-record generic framework, so it's a standalone component (`pages/VendorQuoteComparisonPage.tsx`) calling the same generic `GenericApi` class directly against the relevant endpoints.

Both verified end-to-end through the real Django URL routes (not just direct view calls) in this build.

## Branding & Apps/Modules control (added)
- **Logo**: `src/assets/nikerp-logo.png`, shown in the top bar and the login screen.
- **Apps & Modules** (`/settings/modules`, linked from the app switcher and the account menu): toggle switches for each business app, backed by the real per-tenant enforcement in the Django backend (`rbac.ModuleToggle`) — not a client-only preference. Disabling an app:
  - Hides it from the app switcher and top menu immediately (`useModuleStatus` + `AppShell`'s `groupModules`)
  - Shows a friendly "This app is disabled" screen (`ModuleAccessGuard`) if someone hits its URL directly
  - Actually blocks the API (403), verified server-side in this build
- Core apps (Administration) show a "Core" chip and can't be toggled off.

## Company-level scoping (added)
Sends `X-Company-ID` on every request (from `/api/auth/me/`'s `default_company`, same pattern as `X-Tenant-ID`/tenant). Stored in `localStorage` as `erp_company_id`, cleared on logout.

## Backend note
This build pairs with a **critical backend fix** — a cross-tenant data isolation bug in `core/viewsets.py` that predates this delivery. See `erp_platform.zip`'s README. Redeploy the backend and restart your server process.

## Console overhaul (added)

### Odoo-style navigation
The 230px left rail is gone. `AppShell` now renders a single top bar: an **app switcher** (grid icon → apps grid), the current app's screens as a dropdown beside it, a **Configuration** menu, and a systray with notifications and the account menu. Which app is "current" is derived from the URL, so opening a record keeps its app's menu in place. With 20 registered modules the rail had become a scrolling index of the whole product; picking an app first and a screen second keeps the menu proportional to the task, and returns the width to the data.

### Record screen: form left, log right
`GenericDetailView` is a two-column layout — the form (plus line items and totals) on the left, the record's history on the right, sticky as you scroll and stacking below the form on narrow screens. The right column has three tabs:

- **Log Notes** — notes *and* attachments in one time-ordered feed (see below)
- **To-Dos** — with an open-task count badge
- **Activity** — the audit timeline

### Notes + Documents merged into "Log Notes"
`NotesPanel` and `DocumentsPanel` are replaced by a single `LogNotesPanel`. One composer posts a note and its attachments together; one feed shows both, newest first, with author, timestamp and a working download link. Previously a note and the document it referred to lived in different tabs with no link between them.

Two real bugs fixed on the way:
- `DocumentsPanel` built a `FormData` with the file and then never sent it — every upload created a document row with no file behind it. Uploads now go through `POST /api/documents/documents/upload/`, which writes the `Document` and its first `DocumentVersion` in one request.
- `DocumentSerializer` never returned `versions`, though the frontend's types declared it, so no attachment could render a link. It's now nested and read-only, alongside a `latest_version` convenience field.

### Dynamic, key/value filters
The fixed "one input per filterable field" dialog is replaced by `FilterBuilder`: rows of **field · operator · value** that the user adds and removes. Operators adapt to the field's type — `contains / starts with / is / is not` for text, `on or after / between` for dates, `is any of` for choices — and every one maps to a real Django lookup so filtering stays server-side (`src/utils/filters.ts` → `core.viewsets.BaseModelViewSet.get_queryset`). Because a filter is a *list*, the same field can appear twice (`amount >= 1000` **and** `amount <= 5000`), which the old dict-keyed shape could not express. Active filters show as removable chips under the toolbar.

Backend support added for this: `__in` and `__range` now split on commas (a bare `?status__in=draft` used to make Django iterate the string character by character and match nothing), `__isnull` parses as a boolean, and a `__not` suffix maps to `.exclude()` since Django has no `__ne` lookup.

### Dynamic group-by
A **Group by** menu offers any field marked `groupable`, plus every `select`/`boolean` field automatically. Pick one or more and the grid becomes collapsible group panels with per-group counts. Grouping is applied to the rows loaded on the current page and says so explicitly rather than implying it grouped the whole table.

### Saved views, per user and per company
Saved views moved out of a single global `localStorage` key into `core.SavedView` on the server, scoped to **(tenant, company, owner)**. They now follow a user across devices, never appear for a different user of the same browser, and never cross into another company's workspace. A view can be published to colleagues with `is_shared`; the menu labels each view with who saved it and which company it belongs to, and shared views are read-only to everyone but their owner. Saved views capture columns, dynamic filters, grouping and sort order.

### Toolbar layout & the Settings menu
The column show/hide control moved to the **right** of the toolbar, next to **New \<record\>**. Import, Export and Delete moved off the toolbar into a **Settings** (gear) menu beside it, each gated by the caller's RBAC flags via `useMyPermissions` — and re-checked server-side, so a hidden button isn't the only protection.

Import and export aren't distinct HTTP verbs (an import is a stream of creates, an export is a list), so the console marks them with an `X-ERP-Intent` header and the server checks `can_import` / `can_export` instead of `can_create` / `can_view`. Omitting the header only ever results in the looser check, so it can't be used to gain access.

Also fixed while moving Import: the dialog posted spreadsheet rows keyed by their *column headers* ("Company Name") while the API only accepts *field names* (`company_name`), so every import was rejected. Headers are now matched to fields case- and separator-insensitively, the preview shows each mapping (`Company Name → company_name`), unmatched columns are listed and dropped rather than sent, and the Import button is disabled when nothing matches.

### Labelized forms
`GenericForm` renders every field as an explicit `label · control` row instead of relying on MUI's floating label. A floating label vanishes into the border once a field has a value, so a filled-in 20-field master record became a wall of unlabelled values. Required fields carry a marker, `helpText` becomes a tooltip, and long-form fields span the full width of the two-column grid.

### To-Dos: categories, assignment and notifications
- **Categories** are a tenant-defined master (`todos.TodoCategory`), not a hardcoded list — there's a **To-Do Categories** screen for maintaining them.
- **Assignment** is explicit in the panel, and assigning a task to someone else raises an in-app notification for them. Closing it notifies whoever raised it. The systray bell polls `/api/notifications/notifications/` (polling rather than websockets, so the badge is correct even without Redis/Daphne running).
- **Closing is the assignee's call.** The server only accepts a close from the assignee, the person who assigned it, or a superuser, and records `closed_by` / `closed_date` / `closing_remarks`. Each row carries the server's own `can_close` verdict, so the button state matches what the API will actually allow rather than guessing.
- A standalone **To-Dos** screen is registered, so assignments are somewhere you can work from, filter and group — not only a tab inside a record.

### Verified in this build
- `npx tsc -b --force` — 0 type errors.
- `npm run build` — production bundle builds cleanly.
- `npx oxlint` — clean.
