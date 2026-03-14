# カテゴリ アイコン・色対応：フロントエンドモック実装状況

**作成日**: 2026-03-13
**更新日**: 2026-03-14
**関連仕様**: [機能仕様 § 3.3 アイコン・色](../spec/functions/02-category.md#アイコン色)、[UC-2.1](../spec/usecases/02-category.md#uc-21-カテゴリの作成)、[UC-2.2](../spec/usecases/02-category.md#uc-22-カテゴリの編集)

---

## 実装状況まとめ

| 項目                                               | 状態    |
| -------------------------------------------------- | ------- |
| 型定義（`CategoryIconType` / `CategoryColor`）     | ✅ 完了 |
| CSS 変数定義（色・ダークモード対応）               | ✅ 完了 |
| `CategoryIcon` コンポーネント                      | ✅ 完了 |
| `lib/types.ts` の `Category` 型                    | ✅ 完了 |
| `routes/index.tsx` モックデータ                    | ✅ 完了 |
| `routes/categories/index.tsx` の型・表示           | ✅ 完了 |
| 作成・編集ダイアログの選択 UI                      | ✅ 完了 |
| `routes/transactions/index.tsx` モックデータ・表示 | ✅ 完了 |
| `routes/budget/` モックデータ・表示                | ✅ 完了 |
| `routes/savings/` / `routes/events/` 表示          | ✅ 完了 |

---

## 実装内容

### 型定義

`components/category/types.ts` に `CategoryIconType`（24種）・`CategoryColor`（8色）を定義。
`lib/types.ts` の `Category` 型・`SavingDefinition` 型に `categoryIcon: CategoryIconType` / `categoryColor: CategoryColor` を追加済み。

> **変更点**: 型名を `CategoryIcon` → `CategoryIconType` にリネーム（`category-icon.tsx` コンポーネント名との衝突回避）。

### CSS 変数（色）

`styles/categories.css` に `--category-{color}` 変数を定義（ライト・ダークモード両対応）。
TypeScript 側は `` `var(--category-${color})` `` として参照する。
Recharts など生の CSS カラー値が必要な箇所のみこの形式を使用し、それ以外は識別子 (`CategoryColor`) で扱う。

### `CategoryIcon` コンポーネント

`components/category/category-icon.tsx` に実装済み。識別子を受け取り Lucide アイコンをレンダリングする。
マッピングはコンポーネント内部に閉じており、呼び出し元は Lucide を意識しない。

```tsx
<CategoryIcon icon={category.icon} color={category.color} className="size-4" />
```

### `CategoryAppearanceSelector` コンポーネント（新規）

`routes/categories/-components/category-appearance-selector.tsx` に共通 UI を実装。
色（8色）・アイコン（24種）をそれぞれ `ToggleGroup` で選択できる。
カテゴリ作成ダイアログ・編集ダイアログ・積立新規作成ページの 3 箇所で共有。

### `routes/categories/index.tsx`

- ページ内ローカルの `Category` 型に `icon: CategoryIconType` / `color: CategoryColor` を追加
- モックデータに識別子形式で `icon` / `color` を追加
- カテゴリ一覧の各行に `CategoryIcon` を表示

### 作成・編集ダイアログ（UC-2.1 / UC-2.2）

- `CategoryAppearanceSelector` を組み込み、アイコン・色の選択 UI を追加
- `@tanstack/react-form` の `form.Field` ネスト構造で `icon` / `color` フィールドを管理
- 作成ダイアログ：未選択時に保存を禁止するバリデーション済み
- 編集ダイアログ：現在値のプレビュー（`CategoryIcon` + カテゴリ名）を表示

### `routes/transactions/index.tsx`

- モックデータの `color` を CSS 変数形式から識別子（`CategoryColor`）に変更
- モックデータに `icon: CategoryIconType` を追加
- カテゴリ選択ドロップダウンに `CategoryIcon` を表示
- 取引一覧の Badge に `CategoryIcon` を表示

### 予算ページ

- `BudgetItem` 型の `color: string` → `color: CategoryColor`、`icon: CategoryIconType` を追加
- モックデータを識別子形式に変更
- `ColoredProgress`（インラインスタイル使用）を廃止し、`CategoryIcon` + 標準 `Progress` で置換
- `SummaryBarItem`（Recharts 用）生成時のみ `` `var(--category-${color})` `` に変換

### `routes/savings/` / `routes/events/` 表示

- `SavingDefinition` 型に `categoryIcon` / `categoryColor` を追加
- 積立一覧カード（モバイル・デスクトップ）・積立詳細ページのヘッダーに `CategoryIcon` を表示
- 積立新規作成ページに `CategoryAppearanceSelector` を追加（アイコン・色の選択・バリデーション）
- 積立新規作成ページの「積立の型」セレクタに `md:flex-none md:min-w-[100px]` を追加し予算ページと統一
- イベント詳細ページの取引テーブル・カテゴリ内訳に `CategoryIcon` を表示
