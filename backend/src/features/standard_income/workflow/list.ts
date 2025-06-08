import { z } from 'zod'

import type { StandardIncomeTableSummary } from '@/domains/standard_income'
import type { User } from '@/domains/user'

export const ListStandardIncomeTablesSchema = z.object({
  // 未指定なら昇順
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})
type ListStandardIncomeTablesSchema =
z.infer<typeof ListStandardIncomeTablesSchema>

export interface UnvalidatedListStandardIncomeTablesCommand {
  input: ListStandardIncomeTablesSchema
  state: { user: User }
}

const listStandardIncomeTables = (effects: {
  listStandardIncomeTables: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<StandardIncomeTableSummary[]>
}) => async (command: UnvalidatedListStandardIncomeTablesCommand):
Promise<StandardIncomeTableSummary[]> => {
  const {
    input: { order },
    state: { user: { id: userId } },
  } = command

  const results = await effects.listStandardIncomeTables({
    userId,
    order,
  })

  return results
}

type ListStandardIncomeTablesWorkflow = (command: UnvalidatedListStandardIncomeTablesCommand) =>
Promise<StandardIncomeTableSummary[]>

export const createStandardIncomeTablesListWorkflow = (effects: {
  listStandardIncomeTables: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<StandardIncomeTableSummary[]>
}): ListStandardIncomeTablesWorkflow => listStandardIncomeTables(effects)
