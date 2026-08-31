import type { FieldConfig, FilterCondition, FilterOperator } from "../types/module";

/**
 * The dynamic filter builder is deliberately key/value based: a filter is
 * a list of `{field, operator, value}` rows, not a fixed dict keyed by
 * field name. That is what lets the same field appear twice ("amount >=
 * 1000 AND amount <= 5000") and what lets a saved view round-trip
 * exactly what the user built.
 *
 * Every operator here maps onto a real Django lookup so filtering stays
 * server-side — see `core.viewsets.BaseModelViewSet.get_queryset`.
 */

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  exact: "is",
  not: "is not",
  icontains: "contains",
  istartswith: "starts with",
  iendswith: "ends with",
  gt: "greater than",
  gte: "on or after",
  lt: "less than",
  lte: "on or before",
  in: "is any of",
  range: "between",
  isnull: "is empty",
};

const TEXT_OPERATORS: FilterOperator[] = ["icontains", "exact", "istartswith", "iendswith", "not", "isnull"];
const NUMERIC_OPERATORS: FilterOperator[] = ["exact", "not", "gt", "gte", "lt", "lte", "range", "isnull"];
const DATE_OPERATORS: FilterOperator[] = ["exact", "gte", "lte", "range", "isnull"];
const CHOICE_OPERATORS: FilterOperator[] = ["exact", "not", "in", "isnull"];
// A relation is picked one record at a time from a live lookup, so there is
// no static option list to build an "is any of" multi-select from.
const RELATION_OPERATORS: FilterOperator[] = ["exact", "not", "isnull"];
const BOOLEAN_OPERATORS: FilterOperator[] = ["exact"];

/** Which operators make sense for a given field type. */
export function operatorsFor(field: FieldConfig | undefined): FilterOperator[] {
  if (!field) return TEXT_OPERATORS;
  switch (field.type) {
    case "number":
    case "decimal":
      return NUMERIC_OPERATORS;
    case "date":
    case "datetime":
      return DATE_OPERATORS;
    case "select":
    case "multiselect":
      return CHOICE_OPERATORS;
    case "relation":
      return RELATION_OPERATORS;
    case "boolean":
      return BOOLEAN_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

/** The operator a newly-added row starts on for this field. */
export function defaultOperatorFor(field: FieldConfig | undefined): FilterOperator {
  return operatorsFor(field)[0];
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "" ||
    (Array.isArray(value) && value.length === 0);
}

/** A row is only sent once it can actually filter something. */
export function isConditionComplete(condition: FilterCondition): boolean {
  if (!condition.field) return false;
  if (condition.operator === "isnull") return true; // the operator IS the value
  if (condition.operator === "range") return !isBlank(condition.value) && !isBlank(condition.value2);
  return !isBlank(condition.value);
}

/**
 * Turn filter rows into DRF query params.
 *
 * Rows that aren't filled in yet are skipped rather than sent as empty
 * strings — an incomplete row should narrow nothing, and a stray
 * `?status=` would have been a real (and invisible) filter server-side.
 *
 * When two complete rows target the same field+operator their values are
 * comma-joined, because a query string has one slot per key.
 */
export function buildFilterParams(conditions: FilterCondition[]): Record<string, string> {
  const params: Record<string, string> = {};

  for (const condition of conditions) {
    if (!isConditionComplete(condition)) continue;

    let key: string;
    let value: string;

    switch (condition.operator) {
      case "exact":
        key = condition.field;
        value = String(condition.value);
        break;
      case "not":
        key = `${condition.field}__not`;
        value = String(condition.value);
        break;
      case "isnull":
        key = `${condition.field}__isnull`;
        value = "true";
        break;
      case "in":
        key = `${condition.field}__in`;
        value = (Array.isArray(condition.value) ? condition.value : [condition.value])
          .map(String)
          .join(",");
        break;
      case "range":
        key = `${condition.field}__range`;
        value = `${String(condition.value)},${String(condition.value2)}`;
        break;
      default:
        key = `${condition.field}__${condition.operator}`;
        value = String(condition.value);
    }

    params[key] = key in params ? `${params[key]},${value}` : value;
  }

  return params;
}

/** Short human summary for a filter chip, e.g. `Status is Draft`. */
export function describeCondition(condition: FilterCondition, field: FieldConfig | undefined): string {
  const label = field?.label ?? condition.field;
  const operator = OPERATOR_LABELS[condition.operator];
  if (condition.operator === "isnull") return `${label} ${operator}`;
  if (condition.operator === "range") return `${label} ${operator} ${condition.value} – ${condition.value2}`;

  // Relations resolve their display text at pick time (the id alone would
  // print a UUID in the chip), so prefer the label captured then.
  if (condition.valueLabel) return `${label} ${operator} ${condition.valueLabel}`;

  const raw = Array.isArray(condition.value) ? condition.value : [condition.value];
  const shown = raw
    .map((v) => field?.options?.find((o) => String(o.value) === String(v))?.label ?? String(v))
    .join(", ");
  return `${label} ${operator} ${shown}`;
}

export function newCondition(field: FieldConfig | undefined): FilterCondition {
  return {
    id: crypto.randomUUID(),
    field: field?.name ?? "",
    operator: defaultOperatorFor(field),
    value: "",
  };
}
