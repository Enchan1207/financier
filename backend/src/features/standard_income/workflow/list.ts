import type { ResultAsync } from 'neverthrow'
import { ok } from 'neverthrow'
import { z } from 'zod'

import type { StandardIncomeTableSummary } from '@/domains/standard_income'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'

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
ResultAsync<StandardIncomeTableSummary[], ValidationError>

export const createStandardIncomeTablesListWorkflow = (effects: {
  listStandardIncomeTables: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<StandardIncomeTableSummary[]>
}): ListStandardIncomeTablesWorkflow => command =>
  ok(command)
    .asyncMap(listStandardIncomeTables(effects))
