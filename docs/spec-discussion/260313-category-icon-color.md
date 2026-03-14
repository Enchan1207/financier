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

### アイコン：`CategoryIcon` コンポーネント

#### 配置場所

`lib/` ディレクトリはサードパーティライブラリのラッパーを置く場所であり、ドメイン固有の実装の置き場として不適切。
複数ページ（カテゴリ管理・取引・予算・積立・ホーム）から参照されるため、`frontend/components/` が適切。

```
frontend/components/
  category-icon.tsx   ← 新設
```

#### 実装方針

識別子 → Lucide コンポーネントのマッピングオブジェクトを外部に公開するのではなく、**識別子を受け取ってアイコンをレンダリングするコンポーネント**として実装する。
こうすることで、呼び出し側は Lucide の型・コンポーネント名を意識せず `CategoryIcon` だけを import すればよくなり、将来のアイコンライブラリ変更にも対応しやすい。

```tsx
// components/category-icon.tsx
import { Tag, Wallet, ... } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { CategoryIcon as CategoryIconType } from '@/lib/types'

// マッピングは内部に閉じる（外部から直接アクセスさせない）
const IconMap = { ... } satisfies Record<CategoryIconType, React.FC<LucideProps>>

type Props = LucideProps & { icon: CategoryIconType }

export function CategoryIcon({ icon, ...props }: Props) {
  const Icon = IconMap[icon]
  return <Icon {...props} />
}
```

利用例:

```tsx
<CategoryIcon icon={category.icon} className="size-4" />
```

---

### 色：`CategoryColor` の表示方法

#### 課題：ダークモード対応

色識別子を Tailwind クラス文字列（`'bg-red-500'` 等）に単純マッピングする方法では、ダークモード時の調整（彩度・明度の変更）が困難。
用途ごとに `dark:` バリアントを持つ文字列を複数管理しなければならず、メンテナンスコストが高い。

#### 案A：Tailwind クラス文字列マッピング

```typescript
const BG_MAP: Record<CategoryColor, string> = {
  red: 'bg-red-500 dark:bg-red-400',
  ...
}
```

- **メリット**: CSS ファイル追加不要、シンプル
- **デメリット**: ダークモード用 `dark:` バリアントを用途ごとに重複定義が必要。Tailwind purge のため完全文字列が必須であり、組み合わせが増えると煩雑

#### 案B：CSS 変数定義（`globals.css` への追記）

```css
/* globals.css */
:root {
  --category-red: oklch(0.637 0.237 25.331);
}
.dark {
  --category-red: oklch(0.704 0.191 22.216);
}
```

```typescript
// 識別子 → CSS 変数名に変換するだけ
const cssVar = (color: CategoryColor) => `var(--category-${color})`
```

- **メリット**: ダークモード対応を CSS 側に集約できる。スクリプト側は変数名参照のみで済む。チャート（recharts）等の `fill` / `stroke` 属性にも CSS 変数として直接渡せる
- **デメリット**: `globals.css` への追記が必要（プロジェクトの CSS 追加制約との整合性要確認）

> **⚠️ 制約確認が必要**: プロジェクトガイドラインは「CSS を追加しない」旨を定めている。`globals.css` への追記がこの制約に抵触するか否かを判断する必要がある。既存 CSS ファイルへの追記を「カスタム CSS ファイルの追加」と区別して許容するかの合意を得ること。

#### 推奨方針

**案B（CSS 変数）を推奨**。理由：

1. ダークモード対応がスクリプト側の変更なしに CSS 側だけで完結する
2. チャートライブラリ（recharts）が `fill="var(--category-red)"` のように CSS 変数を直接受け取れるため、用途ごとのマッピング定義が不要になる
3. 将来的な色の調整が CSS 1箇所の変更で済む

CSS 変数の追記が制約上認められない場合は案Aにフォールバックし、アイコンと同様に **色スウォッチを表示するコンポーネント**（`CategoryColorDot` 等）として実装することで、マッピングの変更を1箇所に閉じ込める。

---

## 対応優先度案

| 優先度 | 対応内容 |
| ------ | -------- |
| 高     | 型定義の修正（`lib/types.ts`、`categories/index.tsx`） |
| 高     | `CategoryIcon` コンポーネント新設（`components/category-icon.tsx`） |
| 高     | 色の実装方針確定（CSS 変数 or Tailwind クラスマッピング） |
| 高     | 作成・編集ダイアログへの選択 UI 追加 |
| 中     | モックデータの色フォーマット統一（識別子に書き換え） |
| 中     | カテゴリ一覧・取引・ホームページでの表示対応 |
| 低     | 予算・積立・イベント詳細での表示対応 |
