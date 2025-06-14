# 会計月度

会計月度とは、ある会計年度における一つの月を指す。

## ドメインモデル

financierでは、会計月度は **月度コンテキスト _FinancialMonthContext_** という概念で管理する。
コンテキストはその有効期間のほか、勤務日数、参照すべき標準報酬月額テーブルのIDなどを保持する。

# 設計

## 型定義

型を以下のように定義する。

```ts
/** 会計年度 */
type FinancialYear = z.infer<...> // number

/** 月 */
type Month = z.infer<...> // number

/** 会計月度情報 */
type FinancialMonthInfo = {
  year: FinancialYear
  month: Month
}

/** 勤務日数 */
type Workday = z.infer<...> // number

/** 会計月度コンテキスト */
type FinancialMonthContext = {
  /** コンテキストID */
  id: string

  /** 会計月度情報 */
  info: FinancialMonthInfo

  /** 勤務日数 */
  workday: Workday

  /** 標準報酬月額テーブルのID */
  standardIncomeTableId: string
}
```
