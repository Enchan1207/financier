import dayjs from '@frontend/lib/date'

export const formatCurrency = (amount: number) =>
  `¥${amount.toLocaleString('ja-JP')}`

export const formatDate = (dateStr: string) => {
  const d = dayjs(dateStr)
  return `${d.month() + 1}/${d.date()}`
}
