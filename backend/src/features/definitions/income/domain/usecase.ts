import { ResultAsync } from 'neverthrow'

import type { FinancialMonthData } from '@/features/financial_months/domains/valueObject'
import type { User } from '@/features/users/domains/entity'

import type { IncomeDefinition, IncomeDefinitionKind } from './entity'
import type { IncomeDefinitionFilter, IncomeDefinitionRepository } from './repository'

export class IncomeDefinitionUsecaseError extends Error {}

export class NoSuchItemError extends IncomeDefinitionUsecaseError {
  constructor(id: IncomeDefinition['id']) {
    super(`与えられたIDに合致するアイテムが見つからない: ${id}`)
  }
}

export class AuthorizationError extends IncomeDefinitionUsecaseError {
  constructor(user: User, item: IncomeDefinition) {
    super(`ユーザIDが一致しない: ${user.id}, ${item.userId}`)
  }
}

export interface IncomeDefinitionUsecase {
  /**
   * 新しい報酬定義を登録する
   * @param definition
   */
  registerIncomeDefinition(user: User, definition: IncomeDefinition):
  ResultAsync<IncomeDefinition, Error>

  /**
   * 報酬定義を取得する
   * @param id
   */
  getIncomeDefinition(user: User, id: IncomeDefinition['id']):
  ResultAsync<IncomeDefinition, NoSuchItemError | AuthorizationError>

  /**
   * 報酬定義を更新する
   * @param id
   * @param props 更新内容
   */
  updateIncomeDefinition(user: User, id: IncomeDefinition['id'], props: {
    name?: string
    kind?: IncomeDefinitionKind
    value?: number
    enabledAt?: FinancialMonthData
    disabledAt?: FinancialMonthData
  }): ResultAsync<IncomeDefinition, NoSuchItemError | AuthorizationError>

  /**
   * 指定された月度で報酬定義を無効化する
   * @param id
   * @param at 無効化する会計月度
   * @note `at` に指定した月度の末まで定義は有効です。
   */
  invalidateIncomeDefinition(user: User, id: IncomeDefinition['id'], at: FinancialMonthData):
  ResultAsync<IncomeDefinition, NoSuchItemError | AuthorizationError>

  /**
   * 報酬定義を削除する
   * @param id
   */
  deleteIncomeDefinition(user: User, id: IncomeDefinition['id']):
  ResultAsync<IncomeDefinition, NoSuchItemError | AuthorizationError>

  /**
   * ある会計月度に含まれる報酬定義をまとめて取得する
   * @param at 対象の会計月度
   */
  findIncomeDefinitionsByFinancialMonth(
    user: User,
    at: FinancialMonthData,
    filter?: IncomeDefinitionFilter
  ):
  ResultAsync<IncomeDefinition[], Error>

  /**
   * ある会計年度に含まれる報酬定義をまとめて取得する
   * @param financialYear 対象の会計年度
   */
  findIncomeDefinitionsByFinancialYear(
    user: User,
    financialYear: number,
    filter?: IncomeDefinitionFilter):
  ResultAsync<IncomeDefinition[], Error>
}

const registerIncomeDefinition = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['registerIncomeDefinition'] =>
  ResultAsync.fromThrowable((_, item) => repo.insertIncomeDefinition(item))

const getIncomeDefinition = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['getIncomeDefinition'] =>
  ResultAsync.fromThrowable(async (user, id) => {
    const record = await repo.findById(id)

    if (record === undefined) {
      throw new NoSuchItemError(id)
    }

    if (record.userId !== user.id) {
      throw new AuthorizationError(user, record)
    }

    return record
  })

const updateIncomeDefinition = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['updateIncomeDefinition'] =>
  ResultAsync.fromThrowable(async (user, id, input) => {
    const stored = await repo.findById(id)
    if (stored === undefined) {
      throw new NoSuchItemError(id)
    }

    if (stored.userId !== user.id) {
      throw new AuthorizationError(user, stored)
    }

    const updated = await repo.updateIncomeDefinition(id, input)
    if (updated === undefined) {
      throw new NoSuchItemError(id)
    }

    return updated
  })

const invalidateIncomeDefinition = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['invalidateIncomeDefinition'] =>
  ResultAsync.fromThrowable(async (user, id, to) => {
    const stored = await repo.findById(id)
    if (stored === undefined) {
      throw new NoSuchItemError(id)
    }

    if (stored.userId !== user.id) {
      throw new AuthorizationError(user, stored)
    }

    const updated = await repo.updateIncomeDefinition(id, { to })
    if (updated === undefined) {
      throw new NoSuchItemError(id)
    }

    return updated
  })

const deleteIncomeDefinition = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['deleteIncomeDefinition'] =>
  ResultAsync.fromThrowable(async (user, id) => {
    const stored = await repo.findById(id)
    if (stored === undefined) {
      throw new NoSuchItemError(id)
    }

    if (stored.userId !== user.id) {
      throw new AuthorizationError(user, stored)
    }

    const deleted = await repo.deleteIncomeDefinition(id)
    if (deleted === undefined) {
      throw new NoSuchItemError(id)
    }

    return deleted
  })

const findIncomeDefinitionsByFinancialMonth = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['findIncomeDefinitionsByFinancialMonth'] =>
  ResultAsync.fromThrowable((user, financialMonth, filter) => repo.findByFinancialMonth({
    userId: user.id,
    financialMonth,
    sortBy: filter?.sortBy ?? 'enabledAt',
    limit: filter?.limit ?? 100,
    order: filter?.order ?? 'asc',
    offset: filter?.offset,
    kind: filter?.kind,
  }))

const findIncomeDefinitionsByFinancialYear = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase['findIncomeDefinitionsByFinancialYear'] =>
  ResultAsync.fromThrowable((user, financialYear, filter) => repo.findByFinancialYear({
    userId: user.id,
    financialYear,
    sortBy: filter?.sortBy ?? 'enabledAt',
    limit: filter?.limit ?? 100,
    order: filter?.order ?? 'asc',
    offset: filter?.offset,
    kind: filter?.kind,
  }))

export const useIncomeDefinitionUsecase = (repo: IncomeDefinitionRepository): IncomeDefinitionUsecase => {
  return {
    registerIncomeDefinition: registerIncomeDefinition(repo),
    getIncomeDefinition: getIncomeDefinition(repo),
    updateIncomeDefinition: updateIncomeDefinition(repo),
    invalidateIncomeDefinition: invalidateIncomeDefinition(repo),
    deleteIncomeDefinition: deleteIncomeDefinition(repo),
    findIncomeDefinitionsByFinancialMonth:
      findIncomeDefinitionsByFinancialMonth(repo),
    findIncomeDefinitionsByFinancialYear:
      findIncomeDefinitionsByFinancialYear(repo),
  }
}
