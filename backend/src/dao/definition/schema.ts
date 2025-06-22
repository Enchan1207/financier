import { z } from 'zod'

import type { Definition } from '@/domains/definition'
import {
  DeductionDefinitionKind,
  IncomeDefinitionKind,
} from '@/domains/definition'
import { EntityIdSchema, MoneySchema, TimestampSchema } from '@/domains/schema'

const BaseSchema = z.object({
  id: EntityIdSchema('definition'),
  user_id: EntityIdSchema('user'),
  name: z.string().min(1),
  value: MoneySchema,
  enabled_at: TimestampSchema,
  disabled_at: TimestampSchema,
  updated_at: TimestampSchema,
})

const IncomeSchema = BaseSchema.extend({
  type: z.literal('income'),
  kind: z.enum(IncomeDefinitionKind),
})

const DeductionSchema = BaseSchema.extend({
  type: z.literal('deduction'),
  kind: z.enum(DeductionDefinitionKind),
})

export const DefinitionRecordSchema = z.union([IncomeSchema, DeductionSchema])
export type DefinitionRecord = z.infer<typeof DefinitionRecordSchema>

export const makeDefinitionEntity = (record: DefinitionRecord): Definition => {
  const base = {
    id: record.id,
    userId: record.user_id,
    name: record.name,
    value: record.value,
    enabledAt: record.enabled_at,
    disabledAt: record.disabled_at,
    updatedAt: record.updated_at,
  }

  if (record.type === 'income') {
    return {
      ...base,
      type: 'income',
      kind: record.kind,
    }
  }

  return {
    ...base,
    type: 'deduction',
    kind: record.kind,
  }
}

export const makeDefinitionRecord = (entity: Definition): DefinitionRecord => {
  const base = {
    id: entity.id,
    user_id: entity.userId,
    name: entity.name,
    value: entity.value,
    enabled_at: entity.enabledAt,
    disabled_at: entity.disabledAt,
    updated_at: entity.updatedAt,
  }

  if (entity.type === 'income') {
    return {
      ...base,
      type: 'income',
      kind: entity.kind,
    }
  }

  return {
    ...base,
    type: 'deduction',
    kind: entity.kind,
  }
}
