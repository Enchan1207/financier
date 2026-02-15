import { mockFinanceInitialState } from '@frontend/lib/financier-mock-data'
import type {
  Budget,
  Category,
  Event,
  MockFinanceState,
  SavingDefinition,
  SavingWithdrawal,
  Transaction,
  TransactionType,
} from '@frontend/lib/financier-model'
import type {ReactNode} from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react'

interface OperationResult {
  ok: boolean
  message?: string
}

interface CreateTransactionInput {
  type: TransactionType
  amount: number
  categoryId: string
  transactionDate: string
  eventId?: string
  memo?: string
}

interface CreateCategoryInput {
  name: string
  type: TransactionType
  isSavingCategory: boolean
  savingType?: SavingDefinition['type']
  targetAmount?: number
  deadline?: string
}

interface UpsertBudgetInput {
  fiscalYear: number
  categoryId: string
  budgetAmount: number
}

interface CreateEventInput {
  name: string
  startDate?: string
  endDate?: string
}

interface CreateSavingWithdrawalInput {
  savingDefinitionId: string
  amount: number
  memo?: string
}

interface MockFinanceContextValue {
  state: MockFinanceState
  createTransaction: (input: CreateTransactionInput) => OperationResult
  createCategory: (input: CreateCategoryInput) => OperationResult
  archiveCategory: (categoryId: string) => OperationResult
  upsertBudget: (input: UpsertBudgetInput) => OperationResult
  createEvent: (input: CreateEventInput) => OperationResult
  createSavingWithdrawal: (
    input: CreateSavingWithdrawalInput,
  ) => OperationResult
}

const MockFinanceContext = createContext<MockFinanceContextValue | undefined>(
  undefined,
)

const toDayDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00`)

const getToday = (): Date => {
  const now = new Date()

  return new Date(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T00:00:00`,
  )
}

const isFutureDate = (isoDate: string): boolean => {
  return toDayDate(isoDate).getTime() > getToday().getTime()
}

const resolveFiscalYear = (isoDate: string): number => {
  const date = toDayDate(isoDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  return month >= 4 ? year : year - 1
}

const calculateTransactionBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, transaction) => {
    if (isFutureDate(transaction.transactionDate)) {
      return sum
    }

    return transaction.type === 'income'
      ? sum + transaction.amount
      : sum - transaction.amount
  }, 0)
}

const findFiscalYearStatus = (
  fiscalYears: MockFinanceState['fiscalYears'],
  year: number,
): 'active' | 'closed' => {
  const fiscalYear = fiscalYears.find((item) => item.year === year)

  if (fiscalYear === undefined) {
    return 'active'
  }

  return fiscalYear.status
}

const calculateSavingBalance = (
  savingDefinition: SavingDefinition,
  transactions: Transaction[],
  withdrawals: SavingWithdrawal[],
): number => {
  const contributions = transactions.reduce((sum, transaction) => {
    if (transaction.categoryId !== savingDefinition.categoryId) {
      return sum
    }

    if (isFutureDate(transaction.transactionDate)) {
      return sum
    }

    return sum + transaction.amount
  }, 0)

  const withdrawn = withdrawals.reduce((sum, withdrawal) => {
    if (withdrawal.savingDefinitionId !== savingDefinition.id) {
      return sum
    }

    return sum + withdrawal.amount
  }, 0)

  return contributions - withdrawn
}

export const MockFinanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MockFinanceState>(mockFinanceInitialState)
  const idCounterRef = useRef(1000)

  const nextId = useCallback((prefix: string): string => {
    idCounterRef.current += 1

    return `${prefix}-${idCounterRef.current}`
  }, [])

  const createTransaction = useCallback(
    (input: CreateTransactionInput): OperationResult => {
      const category = state.categories.find(
        (item) => item.id === input.categoryId,
      )

      if (category === undefined) {
        return { ok: false, message: 'カテゴリが存在しません' }
      }

      if (category.status !== 'active') {
        return {
          ok: false,
          message: 'アーカイブ済みカテゴリには新規登録できません',
        }
      }

      if (category.type !== input.type) {
        return {
          ok: false,
          message: '取引種別とカテゴリ種別が一致していません',
        }
      }

      if (input.amount <= 0) {
        return { ok: false, message: '金額は1円以上で入力してください' }
      }

      const targetFiscalYear = resolveFiscalYear(input.transactionDate)

      if (
        findFiscalYearStatus(state.fiscalYears, targetFiscalYear) === 'closed'
      ) {
        return {
          ok: false,
          message: `${targetFiscalYear}年度は締め済みのため登録できません`,
        }
      }

      if (category.isSavingCategory && isFutureDate(input.transactionDate)) {
        return {
          ok: false,
          message:
            '積立への拠出は当日または過去日のみ登録できます（未来日は不可）',
        }
      }

      const newTransaction: Transaction = {
        id: nextId('tx'),
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        transactionDate: input.transactionDate,
        eventId: input.eventId,
        memo: input.memo,
        createdAt: new Date().toISOString(),
      }

      setState((prev) => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }))

      return { ok: true }
    },
    [nextId, state.categories, state.fiscalYears],
  )

  const createCategory = useCallback(
    (input: CreateCategoryInput): OperationResult => {
      if (input.name.trim().length === 0) {
        return { ok: false, message: 'カテゴリ名を入力してください' }
      }

      const duplicated = state.categories.some(
        (item) => item.name.trim() === input.name.trim(),
      )

      if (duplicated) {
        return { ok: false, message: '同名カテゴリが既に存在します' }
      }

      if (input.isSavingCategory && input.type !== 'expense') {
        return {
          ok: false,
          message: '積立カテゴリは支出カテゴリでのみ作成できます',
        }
      }

      if (input.isSavingCategory && input.savingType === 'goal') {
        if (input.targetAmount === undefined || input.targetAmount <= 0) {
          return {
            ok: false,
            message: '目標型の積立は目標金額を入力してください',
          }
        }
      }

      const categoryId = nextId('cat')

      const newCategory: Category = {
        id: categoryId,
        name: input.name.trim(),
        type: input.type,
        status: 'active',
        isSavingCategory: input.isSavingCategory,
      }

      setState((prev) => {
        if (!input.isSavingCategory) {
          return {
            ...prev,
            categories: [newCategory, ...prev.categories],
          }
        }

        const newSavingDefinition: SavingDefinition = {
          id: nextId('sav'),
          categoryId,
          type: input.savingType ?? 'free',
          targetAmount:
            input.savingType === 'goal' ? input.targetAmount : undefined,
          deadline: input.savingType === 'goal' ? input.deadline : undefined,
        }

        return {
          ...prev,
          categories: [newCategory, ...prev.categories],
          savingDefinitions: [newSavingDefinition, ...prev.savingDefinitions],
        }
      })

      return { ok: true }
    },
    [nextId, state.categories],
  )

  const archiveCategory = useCallback(
    (categoryId: string): OperationResult => {
      const category = state.categories.find((item) => item.id === categoryId)

      if (category === undefined) {
        return { ok: false, message: 'カテゴリが存在しません' }
      }

      if (category.status === 'archived') {
        return { ok: false, message: 'すでにアーカイブ済みです' }
      }

      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((item) => {
          if (item.id !== categoryId) {
            return item
          }

          return {
            ...item,
            status: 'archived',
          }
        }),
      }))

      return { ok: true }
    },
    [state.categories],
  )

  const upsertBudget = useCallback(
    (input: UpsertBudgetInput): OperationResult => {
      if (input.budgetAmount <= 0) {
        return { ok: false, message: '予算額は1円以上で入力してください' }
      }

      if (
        findFiscalYearStatus(state.fiscalYears, input.fiscalYear) === 'closed'
      ) {
        return {
          ok: false,
          message: `${input.fiscalYear}年度は締め済みのため変更できません`,
        }
      }

      const exists = state.budgets.some(
        (item) =>
          item.fiscalYear === input.fiscalYear &&
          item.categoryId === input.categoryId,
      )

      setState((prev) => {
        if (!exists) {
          return {
            ...prev,
            budgets: [
              ...prev.budgets,
              {
                fiscalYear: input.fiscalYear,
                categoryId: input.categoryId,
                budgetAmount: input.budgetAmount,
              },
            ],
          }
        }

        return {
          ...prev,
          budgets: prev.budgets.map((item): Budget => {
            if (
              item.fiscalYear !== input.fiscalYear ||
              item.categoryId !== input.categoryId
            ) {
              return item
            }

            return {
              ...item,
              budgetAmount: input.budgetAmount,
            }
          }),
        }
      })

      return { ok: true }
    },
    [state.budgets, state.fiscalYears],
  )

  const createEvent = useCallback(
    (input: CreateEventInput): OperationResult => {
      if (input.name.trim().length === 0) {
        return { ok: false, message: 'イベント名を入力してください' }
      }

      const newEvent: Event = {
        id: nextId('evt'),
        name: input.name.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
      }

      setState((prev) => ({
        ...prev,
        events: [newEvent, ...prev.events],
      }))

      return { ok: true }
    },
    [nextId],
  )

  const createSavingWithdrawal = useCallback(
    (input: CreateSavingWithdrawalInput): OperationResult => {
      if (input.amount <= 0) {
        return { ok: false, message: '取り崩し額は1円以上で入力してください' }
      }

      const targetSavingDefinition = state.savingDefinitions.find(
        (item) => item.id === input.savingDefinitionId,
      )

      if (targetSavingDefinition === undefined) {
        return { ok: false, message: '積立定義が見つかりません' }
      }

      const balance = calculateSavingBalance(
        targetSavingDefinition,
        state.transactions,
        state.savingWithdrawals,
      )

      if (input.amount > balance) {
        return {
          ok: false,
          message: '取り崩し額が積立残高を超えています',
        }
      }

      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const newWithdrawal: SavingWithdrawal = {
        id: nextId('with'),
        savingDefinitionId: input.savingDefinitionId,
        amount: input.amount,
        withdrawalDate: today,
        memo: input.memo,
        createdAt: now.toISOString(),
      }

      setState((prev) => ({
        ...prev,
        savingWithdrawals: [newWithdrawal, ...prev.savingWithdrawals],
      }))

      return { ok: true }
    },
    [
      nextId,
      state.savingDefinitions,
      state.savingWithdrawals,
      state.transactions,
    ],
  )

  const value = useMemo<MockFinanceContextValue>(() => {
    return {
      state,
      createTransaction,
      createCategory,
      archiveCategory,
      upsertBudget,
      createEvent,
      createSavingWithdrawal,
    }
  }, [
    state,
    createTransaction,
    createCategory,
    archiveCategory,
    upsertBudget,
    createEvent,
    createSavingWithdrawal,
  ])

  return (
    <MockFinanceContext.Provider value={value}>
      {children}
    </MockFinanceContext.Provider>
  )
}

const useMockFinanceStore = (): MockFinanceContextValue => {
  const context = useContext(MockFinanceContext)

  if (context === undefined) {
    throw new Error(
      'MockFinanceContext が初期化されていません。MockFinanceProvider でラップしてください',
    )
  }

  return context
}

const findCategory = (
  categories: Category[],
  categoryId: string,
): Category | undefined => {
  return categories.find((item) => item.id === categoryId)
}

const sumByCategory = (
  transactions: Transaction[],
  targetType: TransactionType,
  fiscalYear: number,
): Record<string, number> => {
  return transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.type !== targetType) {
      return acc
    }

    if (isFutureDate(transaction.transactionDate)) {
      return acc
    }

    if (resolveFiscalYear(transaction.transactionDate) !== fiscalYear) {
      return acc
    }

    acc[transaction.categoryId] =
      (acc[transaction.categoryId] ?? 0) + transaction.amount

    return acc
  }, {})
}

export const useDashboardQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    const today = getToday()
    const currentFiscalYear =
      today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1

    const internalBalance = calculateTransactionBalance(state.transactions)

    const savingTotal = state.savingDefinitions.reduce((sum, definition) => {
      return (
        sum +
        calculateSavingBalance(
          definition,
          state.transactions,
          state.savingWithdrawals,
        )
      )
    }, 0)

    const fiscalTransactions = state.transactions.filter((transaction) => {
      if (isFutureDate(transaction.transactionDate)) {
        return false
      }

      return (
        resolveFiscalYear(transaction.transactionDate) === currentFiscalYear
      )
    })

    const income = fiscalTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const expense = fiscalTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return {
      internalBalance,
      savingTotal,
      currentFiscalYear,
      fiscalSummary: {
        income,
        expense,
        balance: income - expense,
      },
      futureTransactionCount: state.transactions.filter((transaction) =>
        isFutureDate(transaction.transactionDate),
      ).length,
    }
  }, [state.savingDefinitions, state.savingWithdrawals, state.transactions])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useTransactionListQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    return state.transactions
      .map((transaction) => {
        const category = findCategory(state.categories, transaction.categoryId)

        return {
          ...transaction,
          categoryName: category?.name ?? '不明カテゴリ',
          isFuture: isFutureDate(transaction.transactionDate),
          fiscalYear: resolveFiscalYear(transaction.transactionDate),
          eventName:
            transaction.eventId === undefined
              ? undefined
              : state.events.find((event) => event.id === transaction.eventId)
                  ?.name,
        }
      })
      .sort((a, b) =>
        a.transactionDate === b.transactionDate
          ? b.createdAt.localeCompare(a.createdAt)
          : b.transactionDate.localeCompare(a.transactionDate),
      )
  }, [state.categories, state.events, state.transactions])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useTransactionFormOptionsQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    const activeCategories = state.categories.filter(
      (category) => category.status === 'active',
    )

    return {
      incomeCategories: activeCategories.filter(
        (category) => category.type === 'income',
      ),
      expenseCategories: activeCategories.filter(
        (category) => category.type === 'expense',
      ),
      events: state.events,
    }
  }, [state.categories, state.events])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useTransactionActions = () => {
  const { createTransaction } = useMockFinanceStore()

  return {
    createTransaction,
  }
}

export const useTransactionDetailQuery = (transactionId: string) => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    const transaction = state.transactions.find(
      (item) => item.id === transactionId,
    )

    if (transaction === undefined) {
      return undefined
    }

    const category = findCategory(state.categories, transaction.categoryId)
    const event =
      transaction.eventId === undefined
        ? undefined
        : state.events.find((item) => item.id === transaction.eventId)

    return {
      ...transaction,
      categoryName: category?.name ?? '不明カテゴリ',
      categoryStatus: category?.status,
      isFuture: isFutureDate(transaction.transactionDate),
      fiscalYear: resolveFiscalYear(transaction.transactionDate),
      eventName: event?.name,
    }
  }, [state.categories, state.events, state.transactions, transactionId])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useCategoryListQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    return state.categories.map((category) => {
      const linkedSaving = state.savingDefinitions.find(
        (definition) => definition.categoryId === category.id,
      )

      return {
        ...category,
        savingType: linkedSaving?.type,
      }
    })
  }, [state.categories, state.savingDefinitions])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useCategoryActions = () => {
  const { createCategory, archiveCategory } = useMockFinanceStore()

  return {
    createCategory,
    archiveCategory,
  }
}

export const useBudgetQuery = (fiscalYear: number) => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    const activeCategories = state.categories.filter(
      (category) => category.status === 'active',
    )

    const actualIncomeByCategory = sumByCategory(
      state.transactions,
      'income',
      fiscalYear,
    )
    const actualExpenseByCategory = sumByCategory(
      state.transactions,
      'expense',
      fiscalYear,
    )

    const rows = activeCategories.map((category) => {
      const budget = state.budgets.find(
        (item) =>
          item.fiscalYear === fiscalYear && item.categoryId === category.id,
      )

      const actual =
        category.type === 'income'
          ? (actualIncomeByCategory[category.id] ?? 0)
          : (actualExpenseByCategory[category.id] ?? 0)
      const budgetAmount = budget?.budgetAmount ?? 0

      return {
        category,
        budgetAmount,
        actualAmount: actual,
        variance: budgetAmount - actual,
      }
    })

    const totals = rows.reduce(
      (acc, row) => {
        if (row.category.type === 'income') {
          return {
            ...acc,
            incomeBudget: acc.incomeBudget + row.budgetAmount,
            incomeActual: acc.incomeActual + row.actualAmount,
          }
        }

        return {
          ...acc,
          expenseBudget: acc.expenseBudget + row.budgetAmount,
          expenseActual: acc.expenseActual + row.actualAmount,
        }
      },
      {
        incomeBudget: 0,
        expenseBudget: 0,
        incomeActual: 0,
        expenseActual: 0,
      },
    )

    return {
      rows,
      totals,
      showBudgetWarning: totals.expenseBudget > totals.incomeBudget,
      fiscalYearStatus: findFiscalYearStatus(state.fiscalYears, fiscalYear),
      selectableFiscalYears: [2024, 2025, 2026, 2027],
    }
  }, [
    fiscalYear,
    state.budgets,
    state.categories,
    state.fiscalYears,
    state.transactions,
  ])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useBudgetActions = () => {
  const { upsertBudget } = useMockFinanceStore()

  return {
    upsertBudget,
  }
}

export const useSavingListQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    return state.savingDefinitions.map((definition) => {
      const category = state.categories.find(
        (item) => item.id === definition.categoryId,
      )

      const balance = calculateSavingBalance(
        definition,
        state.transactions,
        state.savingWithdrawals,
      )

      const goalProgress =
        definition.type === 'goal' && definition.targetAmount !== undefined
          ? Math.min((balance / definition.targetAmount) * 100, 100)
          : undefined

      const remainAmount =
        definition.type === 'goal' && definition.targetAmount !== undefined
          ? Math.max(definition.targetAmount - balance, 0)
          : undefined

      const monthlyGuideAmount =
        definition.type === 'goal' &&
        definition.targetAmount !== undefined &&
        definition.deadline !== undefined
          ? (() => {
              const deadline = toDayDate(definition.deadline)
              const today = getToday()

              if (deadline.getTime() <= today.getTime()) {
                return remainAmount
              }

              const monthDiff =
                (deadline.getFullYear() - today.getFullYear()) * 12 +
                (deadline.getMonth() - today.getMonth()) +
                1

              return Math.ceil((remainAmount ?? 0) / Math.max(monthDiff, 1))
            })()
          : undefined

      const monthlyContribution = state.transactions
        .filter((transaction) => {
          if (transaction.categoryId !== definition.categoryId) {
            return false
          }

          if (isFutureDate(transaction.transactionDate)) {
            return false
          }

          const current = getToday()
          const target = toDayDate(transaction.transactionDate)

          return (
            current.getFullYear() === target.getFullYear() &&
            current.getMonth() === target.getMonth()
          )
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0)

      return {
        definition,
        categoryName: category?.name ?? '不明カテゴリ',
        balance,
        goalProgress,
        remainAmount,
        monthlyGuideAmount,
        monthlyGap:
          monthlyGuideAmount === undefined
            ? undefined
            : monthlyContribution - monthlyGuideAmount,
      }
    })
  }, [
    state.categories,
    state.savingDefinitions,
    state.savingWithdrawals,
    state.transactions,
  ])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useSavingActions = () => {
  const { createSavingWithdrawal } = useMockFinanceStore()

  return {
    createSavingWithdrawal,
  }
}

export const useEventListQuery = () => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    return state.events.map((event) => {
      const linkedTransactions = state.transactions.filter(
        (transaction) => transaction.eventId === event.id,
      )

      const totalAmount = linkedTransactions.reduce(
        (sum, transaction) =>
          transaction.type === 'income'
            ? sum + transaction.amount
            : sum - transaction.amount,
        0,
      )

      const byCategory = linkedTransactions.reduce<Record<string, number>>(
        (acc, transaction) => {
          const category = state.categories.find(
            (item) => item.id === transaction.categoryId,
          )
          const key = category?.name ?? '不明カテゴリ'
          const signedAmount =
            transaction.type === 'income'
              ? transaction.amount
              : -transaction.amount

          acc[key] = (acc[key] ?? 0) + signedAmount

          return acc
        },
        {},
      )

      const byFiscalYear = linkedTransactions.reduce<Record<number, number>>(
        (acc, transaction) => {
          const fiscalYear = resolveFiscalYear(transaction.transactionDate)
          const signedAmount =
            transaction.type === 'income'
              ? transaction.amount
              : -transaction.amount

          acc[fiscalYear] = (acc[fiscalYear] ?? 0) + signedAmount

          return acc
        },
        {},
      )

      return {
        ...event,
        transactionCount: linkedTransactions.length,
        totalAmount,
        byCategory,
        byFiscalYear,
      }
    })
  }, [state.categories, state.events, state.transactions])

  return {
    data,
    templates: state.eventTemplates,
    isLoading: false,
    error: null,
  }
}

export const useEventActions = () => {
  const { createEvent } = useMockFinanceStore()

  return {
    createEvent,
  }
}

export const useAnalyticsQuery = (
  fiscalYear: number,
  simulatedExpense: number,
) => {
  const { state } = useMockFinanceStore()

  const data = useMemo(() => {
    const incomeByCategory = sumByCategory(
      state.transactions,
      'income',
      fiscalYear,
    )
    const expenseByCategory = sumByCategory(
      state.transactions,
      'expense',
      fiscalYear,
    )

    const incomeTotal = Object.values(incomeByCategory).reduce(
      (sum, amount) => sum + amount,
      0,
    )
    const expenseTotal = Object.values(expenseByCategory).reduce(
      (sum, amount) => sum + amount,
      0,
    )

    const categoryRows = Object.entries({
      ...incomeByCategory,
      ...expenseByCategory,
    })
      .map(([categoryId]) => {
        const category = state.categories.find((item) => item.id === categoryId)
        const actualAmount =
          category?.type === 'income'
            ? (incomeByCategory[categoryId] ?? 0)
            : (expenseByCategory[categoryId] ?? 0)

        const budget = state.budgets.find(
          (item) =>
            item.fiscalYear === fiscalYear && item.categoryId === categoryId,
        )

        const ratioBase =
          category?.type === 'income' ? incomeTotal : expenseTotal

        return {
          categoryName: category?.name ?? '不明カテゴリ',
          type: category?.type,
          actualAmount,
          budgetAmount: budget?.budgetAmount ?? 0,
          variance: (budget?.budgetAmount ?? 0) - actualAmount,
          ratio: ratioBase === 0 ? 0 : (actualAmount / ratioBase) * 100,
        }
      })
      .sort((a, b) => b.actualAmount - a.actualAmount)

    const yearComparison = [2024, 2025, 2026].map((year) => {
      const income = Object.values(
        sumByCategory(state.transactions, 'income', year),
      ).reduce((sum, amount) => sum + amount, 0)
      const expense = Object.values(
        sumByCategory(state.transactions, 'expense', year),
      ).reduce((sum, amount) => sum + amount, 0)

      return {
        fiscalYear: year,
        income,
        expense,
        balance: income - expense,
      }
    })

    const internalBalance = calculateTransactionBalance(state.transactions)
    const afterSimulation = internalBalance - simulatedExpense

    const savingProgressRows = state.savingDefinitions.map((definition) => {
      const category = state.categories.find(
        (item) => item.id === definition.categoryId,
      )
      const balance = calculateSavingBalance(
        definition,
        state.transactions,
        state.savingWithdrawals,
      )

      return {
        name: category?.name ?? '不明カテゴリ',
        type: definition.type,
        balance,
        targetAmount: definition.targetAmount,
        progress:
          definition.type === 'goal' && definition.targetAmount !== undefined
            ? Math.min((balance / definition.targetAmount) * 100, 100)
            : undefined,
      }
    })

    return {
      categoryRows,
      yearComparison,
      investmentSupport: {
        internalBalance,
        simulatedExpense,
        afterSimulation,
      },
      savingProgressRows,
      incomeTotal,
      expenseTotal,
    }
  }, [fiscalYear, simulatedExpense, state])

  return {
    data,
    isLoading: false,
    error: null,
  }
}

export const useMockMeta = () => {
  const { state } = useMockFinanceStore()

  return {
    data: {
      activeFiscalYears: state.fiscalYears,
      resolveFiscalYear,
      today: getToday(),
    },
    isLoading: false,
    error: null,
  }
}
