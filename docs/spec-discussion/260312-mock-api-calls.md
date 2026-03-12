# フロントエンドモック→API 置換対象一覧

**作成日**: 2026-03-12

現在フロントエンドはすべてモックデータ・モックハンドラで動作している。本ドキュメントでは、実際の API 呼び出しに置き換えるべき箇所を網羅的に整理する。

バックエンド実装フェーズに入った際の作業リストとして活用すること。

---

## 凡例

| 記号 | 意味 |
|------|------|
| `[DATA]` | ハードコードされたモックデータ（GET 相当） |
| `[CREATE]` | 作成処理（POST 相当） |
| `[UPDATE]` | 更新処理（PUT/PATCH 相当） |
| `[DELETE]` | 削除処理（DELETE 相当） |
| `[ACTION]` | その他の状態変更アクション |

---

## 1. トランザクション（routes/transactions/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 1 | `[DATA]` | `index.tsx` | カテゴリ一覧 13件をインラインで定義 | `GET /categories` |
| 2 | `[DATA]` | `index.tsx` | トランザクション 22件をインラインで定義 | `GET /transactions` |
| 3 | `[DATA]` | `index.tsx` | イベント 3件をインラインで定義 | `GET /events` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 4 | `[CREATE]` | `index.tsx` | `handleAdd` | ローカル state に追加するのみ | `POST /transactions` |
| 5 | `[UPDATE]` | `index.tsx` | `handleSave` | ローカル state を更新するのみ | `PUT /transactions/{id}` |
| 6 | `[DELETE]` | `index.tsx` | `handleDelete` | ローカル state から削除するのみ | `DELETE /transactions/{id}` |

---

## 2. カテゴリ（routes/categories/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 7 | `[DATA]` | `index.tsx` | カテゴリ 8件（`initialCategories`）をインラインで定義 | `GET /categories` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 8 | `[CREATE]` | `index.tsx` | `handleCreate` | `setTimeout(800ms)` 後にローカル state へ追加 | `POST /categories` |
| 9 | `[UPDATE]` | `index.tsx` | `handleSave` | `setTimeout` 後にローカル state を更新 | `PUT /categories/{id}` |
| 10 | `[DELETE]` | `index.tsx` | `handleDelete` | `status: 'archived'` に変更するのみ（参照チェックなし） | `DELETE /categories/{id}` または soft-delete エンドポイント |

---

## 3. 予算（routes/budget/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 11 | `[DATA]` | `-lib/mock-data.ts` | 収入・支出カテゴリ別の年額・月次実績をすべてハードコード | `GET /budgets/{year}` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 12 | `[CREATE]` | `new/index.tsx` | `onSubmit`（フォーム送信） | コメント「モック：APIを呼び出して年度予算を作成する」。ナビゲートするのみ | `POST /budgets` |
| 13 | `[UPDATE]` | `$year/index.tsx` | `handleSaveItem` | `setTimeout(800ms)` 後にローカル state を更新 | `PUT /budgets/{year}/items/{categoryId}` |
| 14 | `[UPDATE]` | `$year/edit/index.tsx` | `onSubmit`（全体編集フォーム送信） | コメント「モック：APIを呼び出して保存する」。ナビゲートするのみ | `PUT /budgets/{year}` |
| 15 | `[ACTION]` | `$year/index.tsx` | `handleClose`（年度締め） | `setTimeout(800ms)` 後に `status: 'closed'` へ変更 | `POST /budgets/{year}/close` |

---

## 4. 積立（routes/savings/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 16 | `[DATA]` | `index.tsx` | 積立定義 5件をインラインで定義 | `GET /savings` |
| 17 | `[DATA]` | `$id/index.tsx` | 同じ積立定義 5件を再度インラインで定義 | `GET /savings/{id}` |
| 18 | `[DATA]` | `$id/index.tsx` | 関連トランザクション 14件・取り崩し履歴 2件をインラインで定義 | `GET /savings/{id}/transactions`、`GET /savings/{id}/withdrawals` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 19 | `[CREATE]` | `new/index.tsx` | `onSubmit`（新規作成フォーム送信） | コメント「モック：カテゴリと積立定義を同時に作成する」。ナビゲートするのみ | `POST /categories` + `POST /savings` |
| 20 | `[CREATE]` | `$id/index.tsx` | `handleContribute`（拠出実行） | コメント「モック：支出トランザクションを作成する」。`setTimeout` 後にローカル state を更新 | `POST /savings/{id}/contributions` |
| 21 | `[CREATE]` | `$id/index.tsx` | `handleWithdraw`（取り崩し実行） | コメント「モック：SavingWithdrawal を作成する」。`setTimeout` 後にローカル state を更新 | `POST /savings/{id}/withdrawals` |
| 22 | `[UPDATE]` | `$id/index.tsx` | `handleEditSave`（積立設定編集） | コメント「モック：積立定義を更新する」。ローカル state を更新するのみ | `PUT /savings/{id}` |

---

## 5. イベント（routes/events/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 23 | `[DATA]` | `index.tsx` | イベント 4件（`MOCK_EVENTS`）をインラインで定義 | `GET /events` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 24 | `[CREATE]` | `index.tsx` | `handleCreate` | コメント「モック：APIを呼び出してイベントを作成する（UC-5.1）」。`setTimeout` 後にローカル state へ追加 | `POST /events` |
| 25 | `[UPDATE]` | `-components/event-edit-dialog.tsx` | `onSave`（編集ダイアログ確定） | コールバックは呼び出し側で実装。呼び出し側もローカル state 更新のみ | `PUT /events/{id}` |

---

## 6. イベントテンプレート（routes/event-templates/）

### モックデータ

| # | 種別 | ファイル | 内容 | 置換先 API |
|---|------|----------|------|-----------|
| 26 | `[DATA]` | `index.tsx` | テンプレート一覧 4件（`TEMPLATES`）をインラインで定義 | `GET /event-templates` |
| 27 | `[DATA]` | `-components/template-data.ts` | テンプレート詳細（items 含む）をインラインで定義 | `GET /event-templates/{id}` |
| 28 | `[DATA]` | `$id/edit/index.tsx` | `template-data.ts` からメモリで詳細を取得 | `GET /event-templates/{id}` |

### ハンドラ

| # | 種別 | ファイル | ハンドラ名 | 現在の実装 | 置換先 API |
|---|------|----------|-----------|-----------|-----------|
| 29 | `[CREATE]` | `new/index.tsx` | `onSubmit`（新規作成フォーム送信） | コメント「モック：APIを呼び出してテンプレートを作成する」。`setTimeout` 後にナビゲート | `POST /event-templates` |
| 30 | `[UPDATE]` | `$id/edit/index.tsx` | `onSubmit`（編集フォーム送信） | コメント「モック：APIを呼び出してテンプレートを更新する」。`setTimeout` 後にナビゲート | `PUT /event-templates/{id}` |
| 31 | `[CREATE]` | `$id/register/index.tsx` | `onSubmit`（一括登録フォーム送信） | コメント「モック：APIを呼び出してトランザクションを一括作成する」。`setTimeout` 後にナビゲート | `POST /event-templates/{id}/register`（仮称） |

---

## サマリ

| 区分 | DATA | CREATE | UPDATE | DELETE | ACTION | 計 |
|------|------|--------|--------|--------|--------|-----|
| トランザクション | 3 | 1 | 1 | 1 | 0 | 6 |
| カテゴリ | 1 | 1 | 1 | 1 | 0 | 4 |
| 予算 | 1 | 1 | 2 | 0 | 1 | 5 |
| 積立 | 3 | 3 | 1 | 0 | 0 | 7 |
| イベント | 1 | 1 | 1 | 0 | 0 | 3 |
| イベントテンプレート | 3 | 2 | 1 | 0 | 0 | 6 |
| **合計** | **12** | **9** | **7** | **2** | **1** | **31** |

---

## 注意事項

- **削除（カテゴリ）**: 現在のモック実装は常に `status: 'archived'`（soft delete）に変更している。API 側でも参照チェック（トランザクション・予算・積立が紐付いているか）を行う必要がある。詳細は [機能仕様 3章 カテゴリ](../spec/functions/02-category.md) を参照。
- **積立新規作成**: カテゴリ作成と積立定義作成を同時に行う必要がある。バックエンドでトランザクション管理するか、フロントエンドで 2 回 API を叩くかは実装時に決定する。
- **イベントテンプレート一括登録**: `$id/register` の API エンドポイント設計は仕様書に明記されていない。バックエンド設計時に詳細を検討すること。

---

## 参照

- [ユースケース定義書](../spec/usecases.md)
- [機能仕様書](../spec/functions.md)
- [未実装・作りかけ画面の実装方針](./260308-missing-screens.md)
- [バックエンド実装ガイドライン](../architecture-guideline/backend.md)
