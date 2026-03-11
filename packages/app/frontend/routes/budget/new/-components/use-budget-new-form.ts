import dayjs from '@frontend/lib/date'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const budgetEntrySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  annualBudget: z
    .string()
    .refine(
      (v) => v === '' || parseInt(v, 10) >= 0,
      '0以上の金額を入力してください',
    ),
})

export const budgetNewFormSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, '4桁の年度を入力してください')
    .refine((v) => {
      const n = parseInt(v, 10)
      return n >= 2000 && n <= 2100
    }, '有効な年度を入力してください'),
  incomeEntries: z.array(budgetEntrySchema),
  expenseEntries: z.array(budgetEntrySchema),
})

export type BudgetEntry = {
  categoryId: string
  categoryName: string
  annualBudget: string
}

export type AvailableCategory = {
  id: string
  name: string
}

export const AVAILABLE_INCOME_CATEGORIES: AvailableCategory[] = [
  { id: 'cat-inc-01', name: '給与' },
  { id: 'cat-inc-02', name: '副業' },
  { id: 'cat-inc-03', name: '配当' },
]

export const AVAILABLE_EXPENSE_CATEGORIES: AvailableCategory[] = [
  { id: 'cat-exp-01', name: '光熱費' },
  { id: 'cat-exp-02', name: '衣服' },
  { id: 'cat-exp-03', name: '医療費' },
  { id: 'cat-exp-04', name: '通信費' },
  { id: 'cat-exp-05', name: '食費' },
  { id: 'cat-exp-06', name: '外食' },
  { id: 'cat-exp-07', name: '日用品' },
  { id: 'cat-exp-08', name: '娯楽・グッズ' },
  { id: 'cat-exp-09', name: '美容' },
  { id: 'cat-exp-10', name: '交通費' },
  { id: 'cat-exp-11', name: '書籍・教育' },
  { id: 'cat-exp-12', name: 'サブスク' },
  { id: 'cat-exp-13', name: '保険' },
  { id: 'cat-exp-14', name: '家賃' },
  { id: 'cat-exp-15', name: '積立：遠征費' },
  { id: 'cat-exp-16', name: '積立：グッズ' },
]

// 前年度からコピーするためのモックデータ
export const PREV_YEAR_ENTRIES = {
  income: [
    { categoryId: 'cat-inc-01', categoryName: '給与', annualBudget: '5000000' },
    { categoryId: 'cat-inc-02', categoryName: '副業', annualBudget: '120000' },
    { categoryId: 'cat-inc-03', categoryName: '配当', annualBudget: '24000' },
  ] satisfies BudgetEntry[],
  expense: [
    {
      categoryId: 'cat-exp-01',
      categoryName: '光熱費',
      annualBudget: '36000',
    },
    { categoryId: 'cat-exp-02', categoryName: '衣服', annualBudget: '120000' },
    { categoryId: 'cat-exp-03', categoryName: '医療費', annualBudget: '42000' },
    {
      categoryId: 'cat-exp-04',
      categoryName: '通信費',
      annualBudget: '156000',
    },
    { categoryId: 'cat-exp-05', categoryName: '食費', annualBudget: '264000' },
    { categoryId: 'cat-exp-06', categoryName: '外食', annualBudget: '96000' },
    { categoryId: 'cat-exp-07', categoryName: '日用品', annualBudget: '60000' },
    {
      categoryId: 'cat-exp-08',
      categoryName: '娯楽・グッズ',
      annualBudget: '216000',
    },
    { categoryId: 'cat-exp-09', categoryName: '美容', annualBudget: '84000' },
    {
      categoryId: 'cat-exp-10',
      categoryName: '交通費',
      annualBudget: '120000',
    },
    {
      categoryId: 'cat-exp-11',
      categoryName: '書籍・教育',
      annualBudget: '48000',
    },
    {
      categoryId: 'cat-exp-12',
      categoryName: 'サブスク',
      annualBudget: '24000',
    },
    { categoryId: 'cat-exp-13', categoryName: '保険', annualBudget: '360000' },
    { categoryId: 'cat-exp-14', categoryName: '家賃', annualBudget: '960000' },
    {
      categoryId: 'cat-exp-15',
      categoryName: '積立：遠征費',
      annualBudget: '360000',
    },
    {
      categoryId: 'cat-exp-16',
      categoryName: '積立：グッズ',
      annualBudget: '120000',
    },
  ] satisfies BudgetEntry[],
}

export type FormInstance = ReturnType<typeof useBudgetNewForm>

export const useBudgetNewForm = (
  onSubmit: (value: {
    year: string
    incomeEntries: BudgetEntry[]
    expenseEntries: BudgetEntry[]
  }) => void | Promise<void>,
  initialEntries?: {
    year?: string
    incomeEntries?: BudgetEntry[]
    expenseEntries?: BudgetEntry[]
  },
) => {
  return useForm({
    defaultValues: {
      year: initialEntries?.year ?? String(dayjs().year() + 1),
      incomeEntries: initialEntries?.incomeEntries ?? ([] as BudgetEntry[]),
      expenseEntries: initialEntries?.expenseEntries ?? ([] as BudgetEntry[]),
    },
    validators: {
      onSubmit: budgetNewFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })
}
