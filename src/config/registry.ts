import type { ModuleConfig } from "../types/module";

export const companyModule: ModuleConfig = {
  key: "companies",
  label: "Companies",
  labelSingular: "Company",
  group: "Administration",
  endpoint: "/api/companies/companies/",
  icon: "Business",
  titleField: "company_name",
  contentTypeApp: "companies",
  contentTypeModel: "company",
  defaultOrdering: "-created_date",
  fields: [
    { name: "company_name", label: "Company Name", type: "text", showInList: true, showInForm: true, searchable: true, sortable: true, filterable: true, required: true, width: 220 },
    { name: "company_code", label: "Code", type: "text", showInList: true, showInForm: true, searchable: true, sortable: true, filterable: true, required: true, width: 120 },
    { name: "legal_name", label: "Legal Name", type: "text", showInForm: true },
    { name: "company_type", label: "Type", type: "text", showInList: true, showInForm: true, filterable: true, groupable: true, width: 130 },
    { name: "gstin", label: "GSTIN", type: "text", showInForm: true },
    { name: "pan", label: "PAN", type: "text", showInForm: true },
    { name: "city", label: "City", type: "text", showInList: true, showInForm: true, filterable: true, sortable: true, groupable: true, width: 130 },
    { name: "state", label: "State", type: "text", showInList: true, showInForm: true, filterable: true, groupable: true, width: 130 },
    { name: "country", label: "Country", type: "text", showInForm: true },
    { name: "phone", label: "Phone", type: "text", showInForm: true },
    { name: "email", label: "Email", type: "email", showInList: true, showInForm: true, searchable: true, width: 200 },
    { name: "website", label: "Website", type: "url", showInForm: true },
    { name: "timezone", label: "Timezone", type: "text", showInForm: true },
    { name: "currency", label: "Currency", type: "text", showInForm: true },
    {
      name: "status", label: "Status", type: "select", showInList: true, showInForm: true, filterable: true, sortable: true, width: 110,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" },
      ],
    },
    { name: "created_date", label: "Created", type: "datetime", showInList: true, sortable: true, width: 160 },
  ],
};

export const userModule: ModuleConfig = {
  key: "users",
  label: "Users",
  labelSingular: "User",
  group: "Administration",
  endpoint: "/api/auth/users/",
  icon: "People",
  titleField: "employee_name",
  contentTypeApp: "accounts",
  contentTypeModel: "user",
  defaultOrdering: "-created_date",
  fields: [
    { name: "username", label: "Username", type: "text", showInList: true, showInForm: true, searchable: true, sortable: true, required: true, width: 150 },
    { name: "employee_name", label: "Employee Name", type: "text", showInList: true, showInForm: true, searchable: true, sortable: true, required: true, width: 200 },
    { name: "employee_code", label: "Emp Code", type: "text", showInList: true, showInForm: true, width: 110 },
    { name: "email", label: "Email", type: "email", showInList: true, showInForm: true, searchable: true, width: 200 },
    { name: "mobile", label: "Mobile", type: "text", showInForm: true, width: 130 },
    { name: "gender", label: "Gender", type: "select", showInForm: true, options: [{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "O", label: "Other" }] },
    {
      name: "status", label: "Status", type: "select", showInList: true, showInForm: true, filterable: true, sortable: true, width: 110,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "blocked", label: "Blocked" },
      ],
    },
    { name: "last_login_ip", label: "Last Login IP", type: "text", showInList: true, width: 130 },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, filterable: true, width: 90 },
  ],
};

// ---------------------------------------------------------------- Masters

export const currencyModule: ModuleConfig = {
  key: "currencies", label: "Currencies", labelSingular: "Currency",
  group: "Masters",
  endpoint: "/api/masters/currencys/", titleField: "code",
  contentTypeApp: "masters", contentTypeModel: "currency",
  fields: [
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, sortable: true, width: 90 },
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 200 },
    { name: "symbol", label: "Symbol", type: "text", showInList: true, showInForm: true, width: 90 },
    { name: "decimal_places", label: "Decimal Places", type: "number", showInForm: true },
  ],
};

export const uomModule: ModuleConfig = {
  key: "uoms", label: "Units of Measure", labelSingular: "UOM",
  group: "Masters",
  endpoint: "/api/masters/unitofmeasures/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "unitofmeasure",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 160 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, width: 100 },
    { name: "category", label: "Category", type: "relation", relationModule: "uom-categories", showInList: true, showInForm: true, required: true },
    { name: "is_base_unit", label: "Base Unit", type: "boolean", showInList: true, showInForm: true },
    { name: "ratio_to_base", label: "Ratio to Base", type: "decimal", showInForm: true },
  ],
};

export const uomCategoryModule: ModuleConfig = {
  key: "uom-categories", label: "UOM Categories", labelSingular: "UOM Category",
  group: "Masters",
  endpoint: "/api/masters/uomcategorys/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "uomcategory",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 200 },
  ],
};

export const taxModule: ModuleConfig = {
  key: "taxes", label: "Taxes", labelSingular: "Tax",
  group: "Masters",
  endpoint: "/api/masters/taxs/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "tax",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 180 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, width: 100 },
    { name: "tax_type", label: "Type", type: "select", showInList: true, showInForm: true, filterable: true, width: 110,
      options: [
        { value: "gst", label: "GST" }, { value: "vat", label: "VAT" }, { value: "sales_tax", label: "Sales Tax" },
        { value: "withholding", label: "Withholding/TDS" }, { value: "custom", label: "Custom" },
      ] },
    { name: "rate", label: "Rate %", type: "decimal", showInList: true, showInForm: true, required: true, width: 90 },
    { name: "is_included_in_price", label: "Included in Price", type: "boolean", showInForm: true },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};

export const taxGroupModule: ModuleConfig = {
  key: "tax-groups", label: "Tax Groups", labelSingular: "Tax Group",
  group: "Masters",
  endpoint: "/api/masters/taxgroups/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "taxgroup",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 180 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, width: 120 },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};

export const paymentTermModule: ModuleConfig = {
  key: "payment-terms", label: "Payment Terms", labelSingular: "Payment Term",
  group: "Masters",
  endpoint: "/api/masters/paymentterms/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "paymentterm",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 200 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, width: 120 },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};

// ---------------------------------------------------------------- Catalog

export const productModule: ModuleConfig = {
  key: "products", label: "Products", labelSingular: "Product",
  group: "Masters",
  endpoint: "/api/catalog/products/", titleField: "name",
  contentTypeApp: "catalog", contentTypeModel: "product",
  defaultOrdering: "-created_date",
  fields: [
    { name: "sku", label: "SKU", type: "text", showInList: true, showInForm: true, required: true, searchable: true, sortable: true, width: 120 },
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, sortable: true, width: 220 },
    { name: "product_type", label: "Type", type: "select", showInList: true, showInForm: true, filterable: true, width: 110,
      options: [{ value: "goods", label: "Goods" }, { value: "service", label: "Service" }, { value: "consumable", label: "Consumable" }] },
    { name: "base_uom", label: "Base UOM", type: "relation", relationModule: "uoms", showInForm: true, required: true, width: 110 },
    { name: "sale_price", label: "Sale Price", type: "decimal", showInList: true, showInForm: true, width: 110 },
    { name: "cost_price", label: "Cost Price", type: "decimal", showInList: true, showInForm: true, width: 110 },
    { name: "sales_tax_group", label: "Sales Tax Group", type: "relation", relationModule: "tax-groups", showInForm: true },
    { name: "purchase_tax_group", label: "Purchase Tax Group", type: "relation", relationModule: "tax-groups", showInForm: true },
    { name: "hsn_or_sac_code", label: "HSN/SAC", type: "text", showInForm: true, filterable: true, groupable: true },
    { name: "is_sales_item", label: "Sellable", type: "boolean", showInForm: true },
    { name: "is_purchase_item", label: "Purchasable", type: "boolean", showInForm: true },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};

// --------------------------------------------------------------- Partners

export const partyModule: ModuleConfig = {
  key: "parties", label: "Customers & Vendors", labelSingular: "Party",
  group: "Masters",
  endpoint: "/api/partners/partys/", titleField: "name",
  contentTypeApp: "partners", contentTypeModel: "party",
  defaultOrdering: "-created_date",
  fields: [
    { name: "party_code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 110 },
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, sortable: true, width: 220 },
    { name: "is_customer", label: "Customer", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 100 },
    { name: "is_vendor", label: "Vendor", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 100 },
    { name: "gstin", label: "GSTIN", type: "text", showInForm: true },
    { name: "pan", label: "PAN", type: "text", showInForm: true },
    { name: "credit_limit", label: "Credit Limit", type: "decimal", showInForm: true },
    { name: "credit_days", label: "Credit Days", type: "number", showInForm: true },
    { name: "email", label: "Email", type: "email", showInList: true, showInForm: true, searchable: true, width: 200 },
    { name: "phone", label: "Phone", type: "text", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: true, filterable: true, width: 100,
      options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "blocked", label: "Blocked" }] },
  ],
};

// ----------------------------------------------------------------- Sales

export const salesQuotationModule: ModuleConfig = {
  key: "sales-quotations", label: "Sales Quotations", labelSingular: "Quotation",
  group: "Sales",
  endpoint: "/api/sales/salesquotations/", titleField: "quotation_number",
  contentTypeApp: "sales", contentTypeModel: "salesquotation",
  defaultOrdering: "-created_date",
  totalsFields: ["subtotal", "discount_amount", "tax_amount", "total_amount"],
  actions: [
    { key: "convert_to_order", label: "Convert to Order", visibleForStatus: ["draft", "sent", "accepted"] },
  ],
  fields: [
    { name: "quotation_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "customer", label: "Customer", type: "relation", relationModule: "parties", showInList: true, showInForm: true, required: true, width: 200 },
    { name: "quotation_date", label: "Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 120 },
    { name: "valid_until", label: "Valid Until", type: "date", showInForm: true },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true, width: 100 },
    { name: "price_list", label: "Price List", type: "relation", relationModule: "price-lists", showInForm: true },
    { name: "reference", label: "Customer Reference", type: "text", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, sortable: true, width: 140,
      options: [
        { value: "draft", label: "Draft" }, { value: "sent", label: "Sent" }, { value: "accepted", label: "Accepted" },
        { value: "rejected", label: "Rejected" }, { value: "expired", label: "Expired" }, { value: "converted", label: "Converted" },
      ] },
    { name: "total_amount", label: "Total", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "subtotal", label: "Subtotal", type: "decimal" },
    { name: "discount_amount", label: "Discount", type: "decimal" },
    { name: "tax_amount", label: "Tax", type: "decimal" },
    { name: "terms_and_conditions", label: "Terms & Conditions", type: "textarea", showInForm: true },
  ],
  lineItems: {
    endpoint: "/api/sales/salesquotationlines/", parentField: "quotation",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "description", label: "Description", type: "text" },
      { name: "uom", label: "UOM", type: "relation", relationModule: "uoms", relationLabelField: "code" },
      { name: "quantity", label: "Qty", type: "number" },
      { name: "unit_price", label: "Unit Price", type: "decimal" },
      { name: "discount_percent", label: "Disc %", type: "decimal" },
      { name: "tax_group", label: "Tax Group", type: "relation", relationModule: "tax-groups" },
      { name: "line_total", label: "Line Total", type: "decimal", readOnly: true },
    ],
  },
};

export const salesOrderModule: ModuleConfig = {
  key: "sales-orders", label: "Sales Orders", labelSingular: "Sales Order",
  group: "Sales",
  endpoint: "/api/sales/salesorders/", titleField: "order_number",
  contentTypeApp: "sales", contentTypeModel: "salesorder",
  defaultOrdering: "-created_date",
  totalsFields: ["subtotal", "discount_amount", "tax_amount", "total_amount"],
  actions: [
    { key: "submit_for_approval", label: "Submit for Approval", visibleForStatus: ["draft"] },
    { key: "confirm", label: "Confirm", visibleForStatus: ["draft", "pending_approval"] },
    { key: "cancel", label: "Cancel", requiresConfirmation: true, visibleForStatus: ["draft", "confirmed", "pending_approval"] },
    { key: "convert_to_invoice", label: "Convert to Invoice", visibleForStatus: ["confirmed", "partially_delivered", "delivered"] },
  ],
  fields: [
    { name: "order_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "customer", label: "Customer", type: "relation", relationModule: "parties", showInList: true, showInForm: true, required: true, width: 200 },
    { name: "order_date", label: "Order Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 120 },
    { name: "expected_delivery_date", label: "Expected Delivery", type: "date", showInForm: true },
    { name: "customer_po_number", label: "Customer PO #", type: "text", showInForm: true },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true, width: 100 },
    { name: "payment_term", label: "Payment Term", type: "relation", relationModule: "payment-terms", showInForm: true },
    { name: "discount_percent", label: "Header Discount %", type: "decimal", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, sortable: true, width: 160,
      options: [
        { value: "draft", label: "Draft" }, { value: "pending_approval", label: "Pending Approval" },
        { value: "confirmed", label: "Confirmed" }, { value: "partially_delivered", label: "Partially Delivered" },
        { value: "delivered", label: "Delivered" }, { value: "partially_invoiced", label: "Partially Invoiced" },
        { value: "invoiced", label: "Invoiced" }, { value: "closed", label: "Closed" }, { value: "cancelled", label: "Cancelled" },
      ] },
    { name: "total_amount", label: "Total", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "subtotal", label: "Subtotal", type: "decimal" },
    { name: "discount_amount", label: "Discount", type: "decimal" },
    { name: "tax_amount", label: "Tax", type: "decimal" },
    { name: "terms_and_conditions", label: "Terms & Conditions", type: "textarea", showInForm: true },
    { name: "internal_notes", label: "Internal Notes", type: "textarea", showInForm: true },
  ],
  lineItems: {
    endpoint: "/api/sales/salesorderlines/", parentField: "order",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "description", label: "Description", type: "text" },
      { name: "uom", label: "UOM", type: "relation", relationModule: "uoms", relationLabelField: "code" },
      { name: "quantity", label: "Qty", type: "number" },
      { name: "unit_price", label: "Unit Price", type: "decimal" },
      { name: "discount_percent", label: "Disc %", type: "decimal" },
      { name: "tax_group", label: "Tax Group", type: "relation", relationModule: "tax-groups" },
      { name: "line_total", label: "Line Total", type: "decimal", readOnly: true },
    ],
  },
};

export const salesInvoiceModule: ModuleConfig = {
  key: "sales-invoices", label: "Sales Invoices", labelSingular: "Invoice",
  group: "Sales",
  endpoint: "/api/sales/salesinvoices/", titleField: "invoice_number",
  contentTypeApp: "sales", contentTypeModel: "salesinvoice",
  defaultOrdering: "-created_date",
  totalsFields: ["subtotal", "tax_amount", "total_amount", "amount_paid", "balance_due"],
  actions: [
    { key: "record_payment", label: "Record Payment", input: { name: "amount", label: "Amount", type: "number" },
      visibleForStatus: ["draft", "posted", "partially_paid", "overdue"] },
  ],
  fields: [
    { name: "invoice_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "customer", label: "Customer", type: "relation", relationModule: "parties", showInList: true, showInForm: true, required: true, width: 200 },
    { name: "invoice_date", label: "Invoice Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 120 },
    { name: "due_date", label: "Due Date", type: "date", showInForm: true, showInList: true, width: 120 },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true, width: 100 },
    { name: "payment_term", label: "Payment Term", type: "relation", relationModule: "payment-terms", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, sortable: true, width: 130,
      options: [
        { value: "draft", label: "Draft" }, { value: "posted", label: "Posted" }, { value: "partially_paid", label: "Partially Paid" },
        { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }, { value: "cancelled", label: "Cancelled" },
      ] },
    { name: "total_amount", label: "Total", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "balance_due", label: "Balance Due", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "subtotal", label: "Subtotal", type: "decimal" },
    { name: "tax_amount", label: "Tax", type: "decimal" },
    { name: "amount_paid", label: "Amount Paid", type: "decimal" },
  ],
  lineItems: {
    endpoint: "/api/sales/salesinvoicelines/", parentField: "invoice",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "description", label: "Description", type: "text" },
      { name: "uom", label: "UOM", type: "relation", relationModule: "uoms", relationLabelField: "code" },
      { name: "quantity", label: "Qty", type: "number" },
      { name: "unit_price", label: "Unit Price", type: "decimal" },
      { name: "discount_percent", label: "Disc %", type: "decimal" },
      { name: "tax_group", label: "Tax Group", type: "relation", relationModule: "tax-groups" },
      { name: "line_total", label: "Line Total", type: "decimal", readOnly: true },
    ],
  },
};

// --------------------------------------------------------------- Purchase

export const purchaseRequisitionModule: ModuleConfig = {
  key: "purchase-requisitions", label: "Purchase Requisitions", labelSingular: "Requisition",
  group: "Purchase",
  endpoint: "/api/purchase/purchaserequisitions/", titleField: "requisition_number",
  contentTypeApp: "purchase", contentTypeModel: "purchaserequisition",
  defaultOrdering: "-created_date",
  fields: [
    { name: "requisition_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "needed_by_date", label: "Needed By", type: "date", showInList: true, showInForm: true, width: 120 },
    { name: "justification", label: "Justification", type: "textarea", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, width: 130,
      options: [
        { value: "draft", label: "Draft" }, { value: "submitted", label: "Submitted" }, { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" }, { value: "converted", label: "Converted" }, { value: "cancelled", label: "Cancelled" },
      ] },
  ],
};

export const rfqModule: ModuleConfig = {
  key: "rfqs", label: "Requests for Quotation", labelSingular: "RFQ",
  group: "Purchase",
  endpoint: "/api/purchase/requestforquotations/", titleField: "rfq_number",
  contentTypeApp: "purchase", contentTypeModel: "requestforquotation",
  defaultOrdering: "-created_date",
  customLinks: [{ label: "Compare Vendor Quotes", suffix: "compare" }],
  fields: [
    { name: "rfq_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "requisition", label: "Requisition", type: "relation", relationModule: "purchase-requisitions", showInForm: true },
    { name: "issue_date", label: "Issue Date", type: "date", showInList: true, showInForm: true, required: true, width: 120 },
    { name: "response_deadline", label: "Response Deadline", type: "date", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, width: 150,
      options: [
        { value: "draft", label: "Draft" }, { value: "sent", label: "Sent to Vendors" }, { value: "quotes_received", label: "Quotes Received" },
        { value: "vendor_selected", label: "Vendor Selected" }, { value: "closed", label: "Closed" }, { value: "cancelled", label: "Cancelled" },
      ] },
  ],
};

export const purchaseOrderModule: ModuleConfig = {
  key: "purchase-orders", label: "Purchase Orders", labelSingular: "Purchase Order",
  group: "Purchase",
  endpoint: "/api/purchase/purchaseorders/", titleField: "po_number",
  contentTypeApp: "purchase", contentTypeModel: "purchaseorder",
  defaultOrdering: "-created_date",
  totalsFields: ["subtotal", "discount_amount", "tax_amount", "total_amount"],
  actions: [
    { key: "submit_for_approval", label: "Submit for Approval", visibleForStatus: ["draft"] },
    { key: "confirm", label: "Confirm", visibleForStatus: ["draft", "pending_approval", "approved"] },
    { key: "cancel", label: "Cancel", requiresConfirmation: true, visibleForStatus: ["draft", "confirmed", "pending_approval"] },
  ],
  fields: [
    { name: "po_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "vendor", label: "Vendor", type: "relation", relationModule: "parties", showInList: true, showInForm: true, required: true, width: 200 },
    { name: "order_date", label: "Order Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 120 },
    { name: "expected_delivery_date", label: "Expected Delivery", type: "date", showInForm: true },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true, width: 100 },
    { name: "payment_term", label: "Payment Term", type: "relation", relationModule: "payment-terms", showInForm: true },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, sortable: true, width: 160,
      options: [
        { value: "draft", label: "Draft" }, { value: "pending_approval", label: "Pending Approval" }, { value: "approved", label: "Approved" },
        { value: "confirmed", label: "Confirmed" }, { value: "partially_received", label: "Partially Received" },
        { value: "received", label: "Received" }, { value: "partially_billed", label: "Partially Billed" },
        { value: "billed", label: "Billed" }, { value: "closed", label: "Closed" }, { value: "cancelled", label: "Cancelled" },
      ] },
    { name: "total_amount", label: "Total", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "subtotal", label: "Subtotal", type: "decimal" },
    { name: "discount_amount", label: "Discount", type: "decimal" },
    { name: "tax_amount", label: "Tax", type: "decimal" },
    { name: "terms_and_conditions", label: "Terms & Conditions", type: "textarea", showInForm: true },
  ],
  lineItems: {
    endpoint: "/api/purchase/purchaseorderlines/", parentField: "order",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "description", label: "Description", type: "text" },
      { name: "uom", label: "UOM", type: "relation", relationModule: "uoms", relationLabelField: "code" },
      { name: "quantity", label: "Qty", type: "number" },
      { name: "unit_price", label: "Unit Price", type: "decimal" },
      { name: "discount_percent", label: "Disc %", type: "decimal" },
      { name: "tax_group", label: "Tax Group", type: "relation", relationModule: "tax-groups" },
      { name: "received_quantity", label: "Received", type: "decimal", readOnly: true },
      { name: "line_total", label: "Line Total", type: "decimal", readOnly: true },
    ],
  },
};

// Relation-only lookup source for GRN's PO-line picker; not shown in nav.
export const purchaseOrderLineModule: ModuleConfig = {
  key: "purchase-order-lines", label: "Purchase Order Lines", labelSingular: "PO Line",
  hideFromNav: true,
  endpoint: "/api/purchase/purchaseorderlines/", titleField: "display_label",
  contentTypeApp: "purchase", contentTypeModel: "purchaseorderline",
  fields: [],
};

export const goodsReceiptModule: ModuleConfig = {
  key: "goods-receipts", label: "Goods Receipts", labelSingular: "Goods Receipt",
  group: "Purchase",
  endpoint: "/api/purchase/goodsreceiptnotes/", titleField: "grn_number",
  contentTypeApp: "purchase", contentTypeModel: "goodsreceiptnote",
  defaultOrdering: "-created_date",
  fields: [
    { name: "grn_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "purchase_order", label: "Purchase Order", type: "relation", relationModule: "purchase-orders", showInList: true, showInForm: true, required: true, width: 160 },
    { name: "received_date", label: "Received Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 130 },
    { name: "received_by", label: "Received By", type: "relation", relationModule: "users", relationLabelField: "employee_name", showInList: true, showInForm: true, width: 150 },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, width: 110,
      options: [{ value: "draft", label: "Draft" }, { value: "posted", label: "Posted" }, { value: "cancelled", label: "Cancelled" }] },
    { name: "remarks", label: "Remarks", type: "textarea", showInForm: true },
  ],
  lineItems: {
    endpoint: "/api/purchase/goodsreceiptlines/", parentField: "grn",
    fields: [
      {
        name: "po_line", label: "PO Line", type: "relation", relationModule: "purchase-order-lines",
        relationLabelField: "display_label", filterBy: { parentField: "purchase_order", relatedField: "order" },
      },
      { name: "received_quantity", label: "Received Qty", type: "number" },
      { name: "rejected_quantity", label: "Rejected Qty", type: "number" },
      { name: "rejection_reason", label: "Rejection Reason", type: "text" },
    ],
  },
};

export const vendorBillModule: ModuleConfig = {
  key: "vendor-bills", label: "Vendor Bills", labelSingular: "Vendor Bill",
  group: "Purchase",
  endpoint: "/api/purchase/vendorbills/", titleField: "bill_number",
  contentTypeApp: "purchase", contentTypeModel: "vendorbill",
  defaultOrdering: "-created_date",
  totalsFields: ["subtotal", "tax_amount", "total_amount", "amount_paid", "balance_due"],
  actions: [
    { key: "run_match", label: "Run 3-Way Match" },
    { key: "record_payment", label: "Record Payment", input: { name: "amount", label: "Amount", type: "number" },
      visibleForStatus: ["draft", "posted", "partially_paid", "overdue"] },
  ],
  fields: [
    { name: "bill_number", label: "Number", type: "text", showInList: true, sortable: true, readOnly: true, width: 130 },
    { name: "vendor_invoice_number", label: "Vendor Invoice #", type: "text", showInForm: true },
    { name: "vendor", label: "Vendor", type: "relation", relationModule: "parties", showInList: true, showInForm: true, required: true, width: 200 },
    { name: "purchase_order", label: "Purchase Order", type: "relation", relationModule: "purchase-orders", showInForm: true },
    { name: "bill_date", label: "Bill Date", type: "date", showInList: true, showInForm: true, required: true, sortable: true, width: 120 },
    { name: "due_date", label: "Due Date", type: "date", showInForm: true, showInList: true, width: 120 },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true, width: 100 },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: false, filterable: true, sortable: true, width: 130,
      options: [
        { value: "draft", label: "Draft" }, { value: "posted", label: "Posted" }, { value: "partially_paid", label: "Partially Paid" },
        { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }, { value: "disputed", label: "Disputed" }, { value: "cancelled", label: "Cancelled" },
      ] },
    { name: "match_status", label: "3-Way Match", type: "select", showInList: true, filterable: true, width: 130,
      options: [
        { value: "not_matched", label: "Not Matched" }, { value: "matched", label: "Matched" }, { value: "mismatched", label: "Mismatched" },
      ] },
    { name: "total_amount", label: "Total", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "balance_due", label: "Balance Due", type: "decimal", showInList: true, sortable: true, readOnly: true, width: 120 },
    { name: "subtotal", label: "Subtotal", type: "decimal" },
    { name: "tax_amount", label: "Tax", type: "decimal" },
    { name: "amount_paid", label: "Amount Paid", type: "decimal" },
    { name: "match_notes", label: "Match Notes", type: "textarea" },
  ],
  lineItems: {
    endpoint: "/api/purchase/vendorbilllines/", parentField: "bill",
    fields: [
      { name: "product", label: "Product", type: "relation", relationModule: "products" },
      { name: "description", label: "Description", type: "text" },
      { name: "uom", label: "UOM", type: "relation", relationModule: "uoms", relationLabelField: "code" },
      { name: "quantity", label: "Qty", type: "number" },
      { name: "unit_price", label: "Unit Price", type: "decimal" },
      { name: "discount_percent", label: "Disc %", type: "decimal" },
      { name: "tax_group", label: "Tax Group", type: "relation", relationModule: "tax-groups" },
      { name: "line_total", label: "Line Total", type: "decimal", readOnly: true },
    ],
  },
};

// Price lists get a minimal config too since Products/Parties reference it
export const priceListModule: ModuleConfig = {
  key: "price-lists", label: "Price Lists", labelSingular: "Price List",
  group: "Masters",
  endpoint: "/api/masters/pricelists/", titleField: "name",
  contentTypeApp: "masters", contentTypeModel: "pricelist",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 200 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, required: true, width: 120 },
    { name: "currency", label: "Currency", type: "relation", relationModule: "currencies", relationLabelField: "code", showInForm: true, required: true },
    { name: "applicable_to", label: "Applies To", type: "select", showInList: true, showInForm: true, width: 120,
      options: [{ value: "customer", label: "Customer" }, { value: "vendor", label: "Vendor" }, { value: "both", label: "Both" }] },
    { name: "is_default", label: "Default", type: "boolean", showInList: true, showInForm: true, width: 90 },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};


// ---------------------------------------------------------------- To-Dos

export const todoModule: ModuleConfig = {
  key: "todos", label: "To-Dos", labelSingular: "Task",
  group: "Administration",
  endpoint: "/api/todos/todos/", titleField: "title",
  icon: "TaskAlt",
  contentTypeApp: "todos", contentTypeModel: "todo",
  defaultOrdering: "-created_date",
  // Tasks are the platform's own notes/attachment target; nesting to-dos
  // inside a to-do isn't useful, so those panels are off here.
  features: { todos: false },
  fields: [
    { name: "title", label: "Task", type: "text", showInList: true, showInForm: true, required: true, searchable: true, sortable: true, width: 260 },
    { name: "description", label: "Description", type: "textarea", showInForm: true, searchable: true },
    // The relation fields are what the form edits and what the server can
    // filter on; the *_name fields are the serializer's display values, so
    // they are what the list shows and what grouping buckets by (grouping
    // on a raw FK would bucket by UUID).
    { name: "category", label: "Category", type: "relation", relationModule: "todo-categories", showInForm: true, filterable: true, width: 150 },
    { name: "category_name", label: "Category", type: "text", showInList: true, groupable: true, width: 150 },
    { name: "assigned_to", label: "Assigned To", type: "relation", relationModule: "users", relationLabelField: "employee_name", showInForm: true, filterable: true, width: 170 },
    { name: "assigned_to_name", label: "Assignee", type: "text", showInList: true, groupable: true, width: 170 },
    { name: "assigned_by_name", label: "Assigned By", type: "text", showInList: true, width: 160 },
    { name: "priority", label: "Priority", type: "select", showInList: true, showInForm: true, filterable: true, sortable: true, groupable: true, width: 110,
      options: [
        { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
        { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
      ] },
    { name: "status", label: "Status", type: "select", showInList: true, showInForm: true, filterable: true, sortable: true, groupable: true, width: 140,
      options: [
        { value: "open", label: "Open" }, { value: "in_progress", label: "In Progress" },
        { value: "hold", label: "Hold" }, { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ] },
    { name: "due_date", label: "Due", type: "datetime", showInList: true, showInForm: true, filterable: true, sortable: true, width: 150 },
    { name: "progress_percent", label: "Progress %", type: "number", showInList: true, showInForm: true, width: 110 },
    { name: "closed_by_name", label: "Closed By", type: "text", showInList: true, width: 150 },
    { name: "closed_date", label: "Closed On", type: "datetime", showInList: true, sortable: true, width: 150 },
    { name: "closing_remarks", label: "Closing Remarks", type: "textarea", readOnly: true },
  ],
};

export const todoCategoryModule: ModuleConfig = {
  key: "todo-categories", label: "To-Do Categories", labelSingular: "To-Do Category",
  group: "Administration",
  endpoint: "/api/todos/categories/", titleField: "name",
  contentTypeApp: "todos", contentTypeModel: "todocategory",
  fields: [
    { name: "name", label: "Name", type: "text", showInList: true, showInForm: true, required: true, searchable: true, width: 200 },
    { name: "code", label: "Code", type: "text", showInList: true, showInForm: true, width: 140 },
    { name: "color", label: "Colour", type: "text", showInForm: true, helpText: "Hex value, e.g. #C88A2E — used for the category chip." },
    { name: "description", label: "Description", type: "textarea", showInForm: true },
    { name: "is_active", label: "Active", type: "boolean", showInList: true, showInForm: true, filterable: true, width: 90 },
  ],
};

/**
 * Register every module here. Adding a new business module (CRM,
 * Inventory, HRMS...) is just: define its ModuleConfig, push it below.
 * List view, detail view, filters, export/import, notes/documents/todos/
 * timeline all work immediately with zero new UI code. For a document with
 * line items (a quotation, order, bill...), add `lineItems` + `actions` and
 * the line-item table / workflow buttons render automatically too.
 */
export const moduleRegistry: ModuleConfig[] = [
  companyModule, userModule, todoModule, todoCategoryModule,
  partyModule, productModule,
  salesQuotationModule, salesOrderModule, salesInvoiceModule,
  purchaseRequisitionModule, rfqModule, purchaseOrderModule, goodsReceiptModule, vendorBillModule,
  currencyModule, uomModule, uomCategoryModule, taxModule, taxGroupModule, paymentTermModule, priceListModule,
  purchaseOrderLineModule,
];

export function getModule(key: string): ModuleConfig | undefined {
  return moduleRegistry.find((m) => m.key === key);
}
