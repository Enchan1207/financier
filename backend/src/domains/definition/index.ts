import { z } from 'zod'

import { EntityIdSchema, MoneySchema, TimestampSchema } from '@/domains/schema'

// MARK: base

const BaseSchema = z.object({
  id: EntityIdSchema('definition'),
  userId: EntityIdSchema('user'),
  name: z.string(),
  value: MoneySchema,
  enabledAt: TimestampSchema,
  disabledAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const DefinitionType = ['income', 'deduction'] as const
export type DefinitionType = (typeof DefinitionType)[number]

// MARK: income

export const IncomeDefinitionKind = [
  'absolute',
  'related_by_workday',
  'absolute_taxable',
  'related_by_workday_taxable',
] as const

const IncomeDefinitionKindSchema = z.enum(IncomeDefinitionKind)
export type IncomeDefinitionKind = z.infer<typeof IncomeDefinitionKindSchema>

const IncomeDefinitionSchema = BaseSchema.extend({
  type: z.literal('income'),
  kind: IncomeDefinitionKindSchema,
})

// MARK: deduction

export const DeductionDefinitionKind = [
  'absolute',
  'related_by_workday',
  'related_by_standard_income',
  'related_by_total_income',
] as const

const DeductionDefinitionKindSchema = z.enum(DeductionDefinitionKind)
export type DeductionDefinitionKind = z.infer<
  typeof DeductionDefinitionKindSchema
>

const DeductionDefinitionSchema = BaseSchema.extend({
  type: z.literal('deduction'),
  kind: DeductionDefinitionKindSchema,
})

/** 定義 */
export const DefinitionSchema = z.union([
  IncomeDefinitionSchema,
  DeductionDefinitionSchema,
])
export type Definition = z.infer<typeof DefinitionSchema>
