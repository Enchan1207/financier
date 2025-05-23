# APIエンドポイントの定義

このドキュメントはバックエンドが提供するAPIエンドポイントを整理したものです。
(本来はOpenAPI等で定義するべきものですが、構想を整理する目的も兼ねてmarkdownとして残しています。)

## Endpoints

### 会計年度

- GET
  - `/financial_year` : 会計年度の一覧を得る
    - パスパラメータ: なし
    - 戻り値: `number[]` : システムに登録されている会計年度の一覧
  - `/financial_year/:year` : ある会計年度における会計月度の一覧を得る
    - パスパラメータ:
      - `:year` : `number` 会計年度
    - 戻り値: `{ year: number; months: FinancialMonth[] }`
    - 例外:
      - `404` : 与えられたパスパラメータに対応する会計年度が定義されていない
  - `/financial_year/:year/:month` : 単一の会計月度を得る
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
    - 戻り値: `FinancialMonth`
    - 例外:
      - `404` : 与えられたパスパラメータに対応する会計月度は存在しない
  - `/financial_year/current` : 現在の会計月度を取得する
    - パスパラメータ: なし
    - 戻り値: `FinancialMonth`
    - 例外:
      - `404` : 現在時刻に対応する会計月度は登録されていない
- POST
  - `/financial_year/:year` : 会計年度を初期化する
    - パスパラメータ:
      - `:year` : `number` 会計年度
    - 戻り値: `{ year: number; months: FinancialMonth[] }`
    - 備考:
      - このエンドポイントを呼び出すと、以下の処理がバッチ実行されます。
        - 単年度分の会計月度 `FinancialMonth[]` の生成・INSERT
        - 勤務日数 `Workday[]` の生成・INSERT
        - その期間に含まれる報酬定義・控除定義に基づき実績値を計算し、INSERT
      - 会計年度が存在しない場合、現在時刻に基づく会計年度のみを初期化できます。
        存在する場合、すでに存在する年度の最大値+1(=翌年度)のものしか対象に取れません。
    - 例外:
      - `400` : 不連続な会計年度を定義しようとしたか、既存の会計年度を初期化しようとした

### 勤務日数

- GET
  - `/workday/:year/:month` : ある月度の勤務日数を得る
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
    - 戻り値: `number`
- PUT
  - `/workday/:year/:month` : ある月度の勤務日数を更新する
    - リクエストボディ:
      - `count` : `number` 更新後の勤務日数
    - 備考: このエンドポイントを呼び出すと、月度に対応する報酬実績・控除実績が再計算されます。
    - 例外:
      - `400` : 勤務日数値が不正

### 報酬定義

- GET
  - `/income_definition` : 報酬定義の一覧を得る
    - パスパラメータ: なし
    - クエリパラメータ:
      - `from` : `{ year: number, month: number }` 期間フィルタ開始
      - `to` : `{ year: number, month: number }` 期間フィルタ終了
      - その他、limit, offset, orderByなど
    - 戻り値: `IncomeDefinition[]`
  - `/income_definition/:id` : 単一の報酬定義を得る
    - パスパラメータ:
      - `:id` : `string` 報酬定義ID
    - 戻り値: `IncomeDefinition`
    - 例外:
      - `404` : 与えられたIDに紐づく報酬定義は存在しない
- POST
  - `/income_definition` : 報酬定義を新規登録する
    - パスパラメータ: なし
    - リクエストボディ: `IncomeDefinition` (エンティティ情報除く)
    - 戻り値: `IncomeDefinition`
    - 備考: このエンドポイントを呼び出すと、既存の会計月度に対応する報酬実績が計算・保存されます。
- PUT
  - `/income_definition/:id` : 特定の報酬定義を更新する
    - パスパラメータ:
      - `:id` : `string` 報酬定義ID
    - リクエストボディ: `IncomeDefinition` (エンティティ情報除く)
    - 戻り値: `IncomeDefinition`
    - 備考: このエンドポイントを呼び出すと、既存の会計月度に対応する報酬実績が計算・保存されます。

### 報酬実績

- GET
  - `/income/:year/:month` : 単一の会計月度における報酬実績の一覧を得る
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
    - クエリパラメータ:
      - limit, offset, orderByなど
    - 戻り値: `IncomeRecord[]`
  - `/income/:year/:month/:definition_id` : 単一の会計月度における単一の定義に基づく報酬実績を得る
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
      - `:definition_id` : `string` 定義ID
    - 戻り値: `IncomeRecord`
    - 例外:
      - `404`
- PUT
  - `/income/:year/:month/:definition_id` : 単一の会計月度における単一の定義に基づく報酬実績を更新する
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
      - `:definition_id` : `string` 定義ID
    - リクエストボディ:
      - `value` : `number` : 更新後の実績値
    - 戻り値: `IncomeRecord`
    - 例外:
      - `404`
- POST
  - `/income/:year/:month/:definition_id/reset` : 記録済みの報酬実績をリセットし、システムにより自動計算されるようにする
    - パスパラメータ:
      - `:year` : `number` 会計年度
      - `:month` : `number` 会計月度
      - `:definition_id` : `string` 定義ID
    - リクエストボディ: なし
    - 戻り値: `IncomeRecord`
    - 例外:
      - `404`
