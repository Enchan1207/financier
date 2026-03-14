# カテゴリ アイコン・色対応：フロントエンドモック実装状況

**作成日**: 2026-03-13
**関連仕様**: [機能仕様 § 3.3 アイコン・色](../spec/functions/02-category.md#アイコン色)、[UC-2.1](../spec/usecases/02-category.md#uc-21-カテゴリの作成)、[UC-2.2](../spec/usecases/02-category.md#uc-22-カテゴリの編集)

---

## 実装状況まとめ

| 項目 | 状態 |
| ---- | ---- |
| 型定義（`CategoryIcon` / `CategoryColor`） | ✅ 完了 |
| CSS 変数定義（色・ダークモード対応） | ✅ 完了 |
| `CategoryIcon` コンポーネント | ✅ 完了 |
| `lib/types.ts` の `Category` 型 | ✅ 完了 |
| `routes/index.tsx` モックデータ | ✅ 完了 |
| `routes/categories/index.tsx` の型・表示 | ⬜ 未対応 |
| 作成・編集ダイアログの選択 UI | ⬜ 未対応 |
| `routes/transactions/index.tsx` モックデータ・表示 | ⬜ 未対応 |
| `routes/budget/` モックデータ・表示 | ⬜ 未対応 |
| `routes/savings/` / `routes/events/` 表示 | ⬜ 未対応 |

---

## 完了済み実装

### 型定義

`components/category/types.ts` に `CategoryIcon`（24種）・`CategoryColor`（8色）を定義。
`lib/types.ts` からは re-export し、`Category` 型に `icon: CategoryIcon` / `color: CategoryColor` を追加済み。

### CSS 変数（色）

`styles/categories.css` に `--category-{color}` 変数を定義（ライト・ダークモード両対応）。
TypeScript 側は `\`var(--category-${color})\`` として参照する。

### `CategoryIcon` コンポーネント

`components/category/category-icon.tsx` に実装済み。識別子を受け取り Lucide アイコンをレンダリングする。
マッピングはコンポーネント内部に閉じており、呼び出し元は Lucide を意識しない。

```tsx
<CategoryIcon icon={category.icon} className="size-4" />
```

---

## 残課題

### 1. `routes/categories/index.tsx`

- ページ内ローカルの `Category` 型に `icon` / `color` がない
- カテゴリ一覧の各行にアイコン・色が未表示
- モックデータに `icon` / `color` がない

### 2. 作成・編集ダイアログ（UC-2.1 / UC-2.2 未対応）

**ファイル**: `routes/categories/-components/create-category-dialog.tsx`、`edit-category-dialog.tsx`

- アイコン選択 UI がない（固定セット 24 種から 1 つ選択）
- 色選択 UI がない（固定セット 8 色から 1 つ選択）
- 作成ダイアログ：未選択での保存を防ぐバリデーションが必要
- 編集ダイアログ：現在値のプレビューが必要

### 3. 取引ページ（`routes/transactions/index.tsx`）

- モックデータの `color` が CSS 変数 / OKLch 形式のまま（識別子へ変更必要）
- モックデータに `icon` がない
- カテゴリ選択ドロップダウンにアイコン・色が未表示
- 取引一覧の Badge にアイコンが未表示

### 4. 予算ページ

**ファイル**: `routes/budget/-lib/mock-data.ts`、`routes/budget/-components/category-budget-card.tsx`

- `BudgetItem` 型の `color: string` が識別子型ではない
- モックデータの色フォーマットが CSS 変数形式のまま
- カテゴリ名の左にアイコン表示がない

### 5. 積立・イベント詳細ページ

**ファイル**: `routes/savings/index.tsx`、`routes/events/$id/index.tsx`

- カテゴリ表示箇所にアイコン・色が未使用
