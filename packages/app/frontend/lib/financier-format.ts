export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}

export const formatRatio = (value: number): string => {
  return `${value.toFixed(1)}%`
}

export const formatFiscalYear = (year: number): string => {
  return `${year}年度`
}
