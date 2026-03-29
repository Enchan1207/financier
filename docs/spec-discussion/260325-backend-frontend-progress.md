---
# バックエンド・フロントエンド接続進捗

**作成日**: 2026-03-25
**参照元**: [フロントエンドモック→API 置換対象一覧](./260312-mock-api-calls.md)

フロントエンドのモックを実際のバックエンド API に接続する作業の進捗を追跡する。

---

## 凡例

| 記号 | 意味                                                     |
| ---- | -------------------------------------------------------- |
| ✅   | バックエンド実装済み・フロントエンド接続済み             |
| 🔧   | バックエンド実装済み・フロントエンド未接続（モック残存） |
| ❌   | バックエンド未実装                                       |

---

## バックエンド実装状況

### 実装済みエンドポイント

| 機能             | エンドポイント             | 備考                 |
| ---------------- | -------------------------- | -------------------- |
| カテゴリ         | `GET /categories`          |                      |
| カテゴリ         | `POST /categories`         |                      |
| カテゴリ         | `PUT /categories/:id`      |                      |
| カテゴリ         | `DELETE /categories/:id`   |                      |
| トランザクション | `GET /transactions`        |                      |
| トランザクション | `POST /transactions`       |                      |
| トランザクション | `PUT /transactions/:id`    |                      |
| トランザクション | `DELETE /transactions/:id` |                      |
| イベント         | `GET /events`              |                      |
| イベント         | `POST /events`             |                      |
| イベント         | `PUT /events/:id`          |                      |
| イベント         | `DELETE /events/:id`       |                      |
| イベントページ   | `GET /pages/events`        | 集計付き一覧         |
| イベントページ   | `GET /pages/events/:id`    | 詳細・カテゴリ別内訳 |

### 未実装エンドポイント

予算・積立・イベントテンプレートのバックエンドは未実装。

---

## フロントエンド接続状況

### 1. トランザクション（routes/transactions/）

| #   | 種別   | 内容                 | 対応 API                   | 状態 |
| --- | ------ | -------------------- | -------------------------- | ---- |
| 1   | DATA   | カテゴリ一覧         | `GET /categories`          | ✅   |
| 2   | DATA   | トランザクション一覧 | `GET /transactions`        | ✅   |
| 3   | DATA   | イベント一覧         | `GET /pages/events`        | ✅   |
| 4   | CREATE | `handleAdd`          | `POST /transactions`       | ✅   |
| 5   | UPDATE | `handleSave`         | `PUT /transactions/:id`    | ✅   |
| 6   | DELETE | `handleDelete`       | `DELETE /transactions/:id` | ✅   |

### 2. カテゴリ（routes/categories/）

| #   | 種別   | 内容           | 対応 API                 | 状態 |
| --- | ------ | -------------- | ------------------------ | ---- |
| 7   | DATA   | カテゴリ一覧   | `GET /categories`        | ✅   |
| 8   | CREATE | `handleCreate` | `POST /categories`       | ✅   |
| 9   | UPDATE | `handleSave`   | `PUT /categories/:id`    | ✅   |
| 10  | DELETE | `handleDelete` | `DELETE /categories/:id` | ✅   |

### 3. 予算（routes/budget/）

| #   | 種別   | 内容                 | 対応 API                               | 状態 |
| --- | ------ | -------------------- | -------------------------------------- | ---- |
| 11  | DATA   | 収支別年額・月次実績 | `GET /budgets/:year`                   | ❌   |
| 12  | CREATE | 年度予算作成         | `POST /budgets`                        | ❌   |
| 13  | UPDATE | 予算項目更新         | `PUT /budgets/:year/items/:categoryId` | ❌   |
| 14  | UPDATE | 予算全体編集         | `PUT /budgets/:year`                   | ❌   |
| 15  | ACTION | 年度締め             | `POST /budgets/:year/close`            | ❌   |

### 4. 積立（routes/savings/）

| #   | 種別   | 内容                               | 対応 API                             | 状態 |
| --- | ------ | ---------------------------------- | ------------------------------------ | ---- |
| 16  | DATA   | 積立定義一覧                       | `GET /savings`                       | ❌   |
| 17  | DATA   | 積立定義詳細                       | `GET /savings/:id`                   | ❌   |
| 18  | DATA   | 関連トランザクション・取り崩し履歴 | `GET /savings/:id/transactions` 等   | ❌   |
| 19  | CREATE | 積立新規作成                       | `POST /categories` + `POST /savings` | ❌   |
| 20  | CREATE | 拠出実行                           | `POST /savings/:id/contributions`    | ❌   |
| 21  | CREATE | 取り崩し実行                       | `POST /savings/:id/withdrawals`      | ❌   |
| 22  | UPDATE | 積立設定編集                       | `PUT /savings/:id`                   | ❌   |

### 5. イベント（routes/events/）

| #   | 種別          | 内容                       | 対応 API                | 状態 |
| --- | ------------- | -------------------------- | ----------------------- | ---- |
| 23  | DATA          | イベント一覧               | `GET /pages/events`     | ✅   |
| 24  | DATA          | イベント詳細               | `GET /pages/events/:id` | ✅   |
| 25  | CREATE        | イベント作成               | `POST /events`          | ✅   |
| 26  | UPDATE        | イベント編集               | `PUT /events/:id`       | ✅   |
| 27  | DELETE        | イベント削除               | `DELETE /events/:id`    | ✅   |
| 28  | CREATE/UPDATE | 既存トランザクション紐付け | `PUT /transactions/:id` | ✅   |

### 6. イベントテンプレート（routes/event-templates/）

| #   | 種別   | 内容                         | 対応 API                                     | 状態 |
| --- | ------ | ---------------------------- | -------------------------------------------- | ---- |
| 29  | DATA   | テンプレート一覧             | `GET /event-templates`                       | ❌   |
| 30  | DATA   | テンプレート詳細             | `GET /event-templates/:id`                   | ❌   |
| 31  | DATA   | テンプレート詳細（編集画面） | `GET /event-templates/:id`                   | ❌   |
| 32  | CREATE | テンプレート新規作成         | `POST /event-templates`                      | ❌   |
| 33  | UPDATE | テンプレート編集             | `PUT /event-templates/:id`                   | ❌   |
| 34  | CREATE | 一括登録                     | `POST /event-templates/:id/register`（仮称） | ❌   |

---

## サマリ

| 区分                 | 全項目数 | 接続済み | 未接続（バックエンドあり） | 未接続（バックエンドなし） |
| -------------------- | -------- | -------- | -------------------------- | -------------------------- |
| トランザクション     | 6        | 6        | 0                          | 0                          |
| カテゴリ             | 4        | 4        | 0                          | 0                          |
| 予算                 | 5        | 0        | 0                          | 5                          |
| 積立                 | 7        | 0        | 0                          | 7                          |
| イベント             | 6        | 6        | 0                          | 0                          |
| イベントテンプレート | 6        | 0        | 0                          | 6                          |
| **合計**             | **34**   | **16**   | **0**                      | **18**                     |

---

## 次の作業候補

バックエンド実装 → フロントエンド接続の順で進める。優先度は要件・依存関係を踏まえて検討すること。

1. **予算** — 年度予算管理は独立した機能であり、他への依存が少ない
2. **積立** — カテゴリとトランザクションへの依存あり（両方接続済みなので実装可能）
3. **イベントテンプレート** — イベント実装済みのため着手可能

---

## 参照

- [フロントエンドモック→API 置換対象一覧](./260312-mock-api-calls.md)
- [機能仕様書](../spec/functions.md)
- [ユースケース定義書](../spec/usecases.md)
