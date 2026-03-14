# カテゴリ アイコン・色対応：フロントエンドモック未実装箇所

**作成日**: 2026-03-13
**関連仕様**: [機能仕様 § 3.3 アイコン・色](../spec/functions/02-category.md#アイコン色)、[UC-2.1](../spec/usecases/02-category.md#uc-21-カテゴリの作成)、[UC-2.2](../spec/usecases/02-category.md#uc-22-カテゴリの編集)

---

## 現状まとめ

| 属性    | 型定義             | 作成 UI | 編集 UI | 各ページ表示 |
| ------- | ------------------ | ------- | ------- | ------------ |
| `icon`  | なし               | なし    | なし    | なし         |
| `color` | `string`（不一致） | なし    | なし    | 一部あり     |

- `icon` はフロントエンド全体で **完全未実装**
- `color` は一部ページのモックデータに存在するが、型・フォーマットが仕様と不一致（後述）

---

## 未実装・未対応箇所

### 1. 型定義の不一致・不足

#### `lib/types.ts`（共通 Category 型）

```typescript
// 現状
export type Category = {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  color: string   // ← string のまま（識別子 union 型ではない）
}
// icon フィールドがない
```

**必要な対応**:

- `icon: CategoryIcon` を追加
- `color` を `CategoryColor` 型（識別子 union）に変更

```typescript
// 目標型
export type CategoryIcon =
  | 'tag' | 'wallet' | 'trending_up' | 'trending_down' | 'piggy_bank'
  | 'house' | 'utensils' | 'shopping_cart' | 'car' | 'bus' | 'plane'
  | 'heart_pulse' | 'graduation_cap' | 'briefcase' | 'music' | 'zap'
  | 'wifi' | 'shirt' | 'dumbbell' | 'coffee' | 'gift' | 'book' | 'baby' | 'plus'

export type CategoryColor =
  | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink'

export type Category = {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  icon: CategoryIcon
  color: CategoryColor
}
```

#### `routes/categories/index.tsx`（カテゴリ管理ページ専用型）

```typescript
// 現状
type Category = {
  id: string
  type: CategoryType
  name: string
  status: CategoryStatus
  isSaving: boolean
  // icon・color がない
}
```

**必要な対応**: `icon: CategoryIcon`、`color: CategoryColor` を追加。

---

### 2. モックデータの色フォーマット不一致

現状のモックデータが使用している色フォーマットは仕様と異なる。

| ファイル | 現状の色フォーマット | 必要なフォーマット |
| -------- | -------------------- | ------------------ |
| `routes/transactions/index.tsx` | `'var(--chart-1)'`、`'oklch(0.65 0.2 290)'` 等 | `'red'` 等の識別子 |
| `routes/index.tsx` | 同上 | 同上 |
| `routes/budget/-lib/mock-data.ts` | `'var(--chart-1)'` 等 | 同上 |

すべてのモックデータを `CategoryColor` 識別子（`'red'` / `'blue'` 等）に統一する必要がある。

---

### 3. カテゴリ作成ダイアログ（UC-2.1 未対応）

**ファイル**: `routes/categories/-components/create-category-dialog.tsx`

**現状**: カテゴリ名・種別・積立フラグのみ。アイコン・色の選択 UI がない。

**必要な対応**:

- アイコン選択 UI（`CategoryIcon` 固定セット 24 種から 1 つ選択）
- 色選択 UI（`CategoryColor` 固定セット 8 色から 1 つ選択）
- 未選択状態での保存を防ぐバリデーション

---

### 4. カテゴリ編集ダイアログ（UC-2.2 未対応）

**ファイル**: `routes/categories/-components/edit-category-dialog.tsx`

**現状**: カテゴリ名のみ編集可能。アイコン・色の変更 UI がない。

**必要な対応**:

- アイコン変更 UI（現在値をプレビューしつつ変更可能）
- 色変更 UI（同上）

---

### 5. カテゴリ一覧表示（カテゴリ管理ページ）

**ファイル**: `routes/categories/index.tsx`

**現状**: カテゴリ名・種別のみ表示。アイコン・色が一切表示されない。

**必要な対応**:

- 一覧の各行にアイコン・色を表示（例: カラードットとアイコンを名前の左に併置）

---

### 6. 取引ページ（`routes/transactions/index.tsx`）

**現状の問題**:

1. カテゴリ選択ドロップダウンにアイコン・色が未表示
2. 取引一覧のカテゴリ Badge にアイコンが未表示
3. モックデータの色フォーマットが不一致（CSS変数 / OKLch → 識別子へ変更必要）

**必要な対応**:

- カテゴリ選択ドロップダウンの各選択肢にアイコン・色スウォッチを追加
- 取引一覧の Badge にアイコンを追加
- モックデータの `color` を識別子形式に修正

---

### 7. ホームページ（`routes/index.tsx`）

**現状の問題**:

1. クイック支出登録セレクトのカテゴリ選択肢にアイコン・色が未表示
2. 取引一覧のカテゴリ表示にアイコンが未表示
3. モックデータの色フォーマット不一致

**必要な対応**:

- セレクトの選択肢にアイコン・色を追加
- 取引一覧のカテゴリ表示にアイコンを追加
- モックデータの `color` を識別子形式に修正

---

### 8. 予算ページ

**ファイル**: `routes/budget/-lib/mock-data.ts`、`routes/budget/-components/category-budget-card.tsx`、`routes/budget/$year/index.tsx`

**現状の問題**:

1. `BudgetItem` 型の `color: string` が識別子型ではない
2. ドーナツチャートへの色渡し方法が CSS変数参照のまま
3. カテゴリアイコンが未使用（カテゴリ名のみ表示）

**必要な対応**:

- モックデータの `color` を識別子形式に修正
- `CategoryColor` → 実際の CSS 値への変換ロジックを共通化（後述）
- カテゴリ名の左にアイコン表示を追加

---

### 9. 積立ページ・イベント詳細ページ

**ファイル**: `routes/savings/index.tsx`、`routes/events/$id/index.tsx`

**現状の問題**: カテゴリ名のみ表示。アイコン・色が未使用。

**必要な対応**: カテゴリ表示箇所にアイコン・色を追加。

---

## 共通実装として検討すべき事項

### CategoryIcon → Lucide コンポーネントのマッピング

24種の識別子と Lucide コンポーネントのマッピングを共通モジュールとして定義し、全ページから参照できるようにする。

```typescript
// 例: 識別子 → コンポーネント
import { Tag, Wallet, TrendingUp, ... } from 'lucide-react'

const ICON_MAP = {
  tag: Tag,
  wallet: Wallet,
  trending_up: TrendingUp,
  // ...
} satisfies Record<CategoryIcon, LucideIcon>
```

### CategoryColor → Tailwind クラスのマッピング

色識別子を UI 表示用の Tailwind クラスに変換するマッピングを共通化する。

```typescript
// 例: 識別子 → Tailwind クラス
const COLOR_CLASS_MAP = {
  red: 'text-red-500',
  orange: 'text-orange-500',
  // ...
} satisfies Record<CategoryColor, string>
```

Tailwind の動的クラス生成を避けるため、クラス名は文字列テンプレートではなく **完全な文字列** として定義する（purge 対策）。

---

## 対応優先度案

| 優先度 | 対応内容 |
| ------ | -------- |
| 高     | 型定義の修正（`lib/types.ts`、`categories/index.tsx`） |
| 高     | アイコン・色の共通マッピングモジュール作成 |
| 高     | 作成・編集ダイアログへの選択 UI 追加 |
| 中     | モックデータの色フォーマット統一 |
| 中     | カテゴリ一覧・取引・ホームページでの表示対応 |
| 低     | 予算・積立・イベント詳細での表示対応 |
