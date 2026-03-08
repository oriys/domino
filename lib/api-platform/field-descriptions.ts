import { z } from "zod"

import {
  apiFieldDescriptionSchema,
  type ApiFieldDescription,
  type ApiFieldType,
} from "@/lib/api-platform/types"

export interface ApiFieldDescriptionOverride {
  description?: string
  required?: boolean
  example?: string
}

const apiFieldDescriptionListSchema = z.array(apiFieldDescriptionSchema)

function createFieldId() {
  return globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const URL_PATTERN = /^https?:\/\//

function inferFieldType(value: unknown): ApiFieldType {
  if (value === null) {
    return "null"
  }

  if (Array.isArray(value)) {
    return "array"
  }

  switch (typeof value) {
    case "string":
      if (UUID_PATTERN.test(value)) return "uuid"
      if (EMAIL_PATTERN.test(value)) return "email"
      if (DATETIME_PATTERN.test(value)) return "datetime"
      if (DATE_PATTERN.test(value)) return "date"
      if (URL_PATTERN.test(value)) return "url"
      return "string"
    case "number":
      return Number.isInteger(value) ? "integer" : "float"
    case "boolean":
      return "boolean"
    case "object":
      return "object"
    default:
      return "string"
  }
}

function formatFieldExample(value: unknown) {
  if (typeof value === "undefined") {
    return undefined
  }

  if (typeof value === "string") {
    return value
  }

  return JSON.stringify(value)
}

function countPathDepth(path: string) {
  return path.split(".").length + (path.match(/\[\]/g)?.length ?? 0)
}

function sortFieldDescriptions(fields: ApiFieldDescription[]) {
  return [...fields].sort((left, right) => {
    const depthDifference = countPathDepth(left.path) - countPathDepth(right.path)

    if (depthDifference !== 0) {
      return depthDifference
    }

    return left.path.localeCompare(right.path)
  })
}

function addField(
  path: string,
  value: unknown,
  existingByPath: Map<string, ApiFieldDescription>,
  result: ApiFieldDescription[],
) {
  const existingField = existingByPath.get(path)

  result.push(
    apiFieldDescriptionSchema.parse({
      id: existingField?.id ?? createFieldId(),
      path,
      type: inferFieldType(value),
      required: existingField?.required ?? true,
      description: existingField?.description ?? "",
      example: existingField?.example ?? formatFieldExample(value),
    }),
  )
}

function visitJsonValue(
  value: unknown,
  path: string,
  existingByPath: Map<string, ApiFieldDescription>,
  result: ApiFieldDescription[],
) {
  if (Array.isArray(value)) {
    const arrayPath = path || "items"
    addField(arrayPath, value, existingByPath, result)

    if (value.length > 0) {
      visitJsonValue(value[0], `${arrayPath}[]`, existingByPath, result)
    }

    return
  }

  if (isRecord(value)) {
    if (path) {
      addField(path, value, existingByPath, result)
    }

    for (const [key, child] of Object.entries(value)) {
      visitJsonValue(child, path ? `${path}.${key}` : key, existingByPath, result)
    }

    return
  }

  addField(path || "value", value, existingByPath, result)
}

export function buildFieldDescriptionsFromJsonText(
  jsonText: string,
  existingFields: ApiFieldDescription[] = [],
) {
  const normalizedText = jsonText.trim()

  if (!normalizedText) {
    return []
  }

  const parsed = JSON.parse(normalizedText)
  const existingByPath = new Map(existingFields.map((field) => [field.path, field]))
  const generatedFields: ApiFieldDescription[] = []

  if (isRecord(parsed)) {
    for (const [key, value] of Object.entries(parsed)) {
      visitJsonValue(value, key, existingByPath, generatedFields)
    }
  } else {
    visitJsonValue(parsed, "", existingByPath, generatedFields)
  }

  return sortFieldDescriptions(generatedFields)
}

export function formatFieldDescriptionsText(fields: ApiFieldDescription[]) {
  return JSON.stringify(sortFieldDescriptions(fields), null, 2)
}

export function parseFieldDescriptionsText(text: string) {
  const normalizedText = text.trim()

  if (!normalizedText) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(normalizedText)
  } catch {
    throw new Error("Field descriptions JSON must be valid JSON.")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Field descriptions JSON must be an array.")
  }

  return sortFieldDescriptions(apiFieldDescriptionListSchema.parse(parsed))
}

export function createEmptyFieldDescription(): ApiFieldDescription {
  return {
    id: createFieldId(),
    path: "",
    type: "string",
    required: true,
    description: "",
    example: undefined,
  }
}

export function applyFieldDescriptionOverrides(
  fields: ApiFieldDescription[],
  overrides: Record<string, ApiFieldDescriptionOverride>,
) {
  return sortFieldDescriptions(
    fields.map((field) => {
      const override = overrides[field.path]

      if (!override) {
        return field
      }

      return {
        ...field,
        description: override.description ?? field.description,
        required: override.required ?? field.required,
        example: override.example ?? field.example,
      }
    }),
  )
}
