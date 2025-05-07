import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'

import type { FinancialMonth, FinancialMonthData } from '@/domains/financial_month'
import type { User } from '@/domains/user'
import type { WorkdayValue } from '@/domains/workday/logic'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export interface PutWorkdayCommand {
  input: {
    financialMonth: FinancialMonthData
    count: WorkdayValue
  }
  state: { user: User }
}

interface FinancialMonthQueried {
  input: { count: WorkdayValue }
  state: {
    financialMonth: FinancialMonth
    user: User
  }
}

export interface FinancialMonthUpdateEvent {
  user: User
  financialMonth: FinancialMonth
  count: WorkdayValue
}

const queryFinancialMonth = (effects: {
  //
  getFinancialMonthByFinancialMonth: (userId: string, financialMonth: FinancialMonthData) => Promise<FinancialMonth | undefined>
}): (command: PutWorkdayCommand) => ResultAsync<FinancialMonthQueried, EntityNotFoundError> => fromSafePromise(async (command) => {
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
    input: { count: command.input.count },
    state: {
      financialMonth: queried,
      user: command.state.user,
    },
  })
})

const createPutEvent = (command: FinancialMonthQueried): FinancialMonthUpdateEvent => ({
  user: command.state.user,
  count: command.input.count,
  financialMonth: command.state.financialMonth,
})

type PutWorkdayWorkflow = (command: PutWorkdayCommand) => ResultAsync<FinancialMonthUpdateEvent, EntityNotFoundError>

export const createPutWorkdayWorkflow = (effects: {
  //
  getFinancialMonthByFinancialMonth: (userId: string, financialMonth: FinancialMonthData) => Promise<FinancialMonth | undefined>
}): PutWorkdayWorkflow => command =>
  ok(command)
    .asyncAndThen(queryFinancialMonth(effects))
    .map(createPutEvent)
