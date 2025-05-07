import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'

import type { FinancialMonth, FinancialMonthData } from '@/domains/financial_month'
import type { User } from '@/domains/user'
import type { Workday } from '@/domains/workday'
import type { EntityAuthorizationError } from '@/logic/errors'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export interface GetWorkdayCommand {
  input: { financialMonth: FinancialMonthData }
  state: { user: User }
}

interface FinancialMonthQueried {
  input: { financialMonth: FinancialMonth }
  state: { user: User }
}

const queryFinancialMonth = (effects: {
  //
  getFinancialMonthByFinancialMonth: (userId: string, financialMonth: FinancialMonthData) => Promise<FinancialMonth | undefined>
}): (command: GetWorkdayCommand) => ResultAsync<FinancialMonthQueried, EntityNotFoundError> => fromSafePromise(async (command) => {
  const financialMonth = command.input.financialMonth
  const queried = await effects.getFinancialMonthByFinancialMonth(
    command.state.user.id,
    financialMonth,
  )

  if (queried === undefined) {
    const imitatedEntityId = `${financialMonth.financialYear}-${financialMonth.month}`
    return err(new EntityNotFoundError({ id: imitatedEntityId }))
  }

  return ok({
    input: { financialMonth: queried },
    state: { user: command.state.user },
  })
})

const queryWorkday = (effects: {
  //
  findWorkdayByFinancialMonthId: (financialMonthId: string) => Promise<Workday | undefined>
}): (command: FinancialMonthQueried) => ResultAsync<Workday, EntityNotFoundError> => fromSafePromise(async (command) => {
  const financialMonth = command.input.financialMonth
  const queried = await effects.findWorkdayByFinancialMonthId(financialMonth.id)

  if (queried === undefined) {
    return err(new EntityNotFoundError({ id: financialMonth.id }))
  }

  return ok(queried)
})

type GetWorkdayWorkflow = (command: GetWorkdayCommand) => ResultAsync<Workday, EntityNotFoundError | EntityAuthorizationError>

export const createGetWorkdayWorkflow = (effects: {
  //
  getFinancialMonthByFinancialMonth: (userId: string, financialMonth: FinancialMonthData) => Promise<FinancialMonth | undefined>
  findWorkdayByFinancialMonthId: (financialMonthId: string) => Promise<Workday | undefined>
}): GetWorkdayWorkflow => command =>
  ok(command)
    .asyncAndThen(queryFinancialMonth(effects))
    .andThen(queryWorkday(effects))
