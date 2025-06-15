// FIXME: これdao読んでるだけじゃん、いらなくね?

import type { Result, ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'

import type {
  FinancialMonthContext,
  FinancialMonthInfo,
} from '@/domains/financial_month_context'
import { createFinancialMonthInfo } from '@/domains/financial_month_context/logic'
import type { IncomeRecordItem } from '@/domains/income_record'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export interface UnvalidatedListIncomeRecordCommand {
  input: {
    financialYear: number
    month: number
  }
  state: {
    user: User
  }
}

interface ValidatedCommand {
  input: {
    financialMonth: FinancialMonthInfo
  }
  state: {
    user: User
  }
}

interface EntityQueried {
  input: {
    financialMonth: FinancialMonthContext
  }
  state: {
    user: User
  }
}

export interface RecordQueried {
  items: IncomeRecordItem[]
}

type WorkflowEffects = {
  getFinancialMonthContext: (props: {
    userId: string
    info: FinancialMonthInfo
  }) => Promise<FinancialMonthContext | undefined>
  listIncomeRecordItems: (props: {
    userId: User['id']
    financialMonth: FinancialMonthContext
  }) => Promise<IncomeRecordItem[]>
}

const validateCommand = ({
  input,
  state,
}: UnvalidatedListIncomeRecordCommand): Result<
  ValidatedCommand,
  ValidationError
> =>
  createFinancialMonthInfo({
    financialYear: input.financialYear,
    month: input.month,
  }).map((financialMonth) => ({
    input: { financialMonth },
    state,
  }))

const queryFinancialMonthContext = (
  effects: Pick<WorkflowEffects, 'getFinancialMonthContext'>,
): ((
  command: ValidatedCommand,
) => ResultAsync<EntityQueried, EntityNotFoundError>) =>
  fromSafePromise(async ({ input, state }) => {
    const financialMonth = await effects.getFinancialMonthContext({
      userId: state.user.id,
      info: input.financialMonth,
    })

    if (financialMonth === undefined) {
      const { financialYear, month } = input.financialMonth
      return err(new EntityNotFoundError({ id: `${financialYear}_${month}` }))
    }

    return ok({
      input: {
        financialMonth,
      },
      state,
    })
  })

const queryItems =
  (
    effects: Pick<WorkflowEffects, 'listIncomeRecordItems'>,
  ): ((command: EntityQueried) => Promise<RecordQueried>) =>
  async ({ input, state }) => {
    const items = await effects.listIncomeRecordItems({
      userId: state.user.id,
      financialMonth: input.financialMonth,
    })
    return {
      items,
    }
  }

export const createIncomeRecordListWorkflow =
  (effects: WorkflowEffects) => (command: UnvalidatedListIncomeRecordCommand) =>
    ok(command)
      .andThen(validateCommand)
      .asyncAndThen(queryFinancialMonthContext(effects))
      .map(queryItems(effects))
