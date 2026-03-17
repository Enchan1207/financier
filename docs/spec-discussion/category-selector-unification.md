# カテゴリセレクタ統一化

**作成日**: 2026-03-14

---

## 目的

カテゴリセレクタが複数箇所に重複実装されており、アイコン・色の表示有無や値の持ち方に不整合が生じているため、共通コンポーネント `CategorySelect` として統一する。

---

## 現状調査

### 対象箇所一覧

| 箇所                           | ファイル                                                                   | アイコン表示 |              フィルタリング               | 値                                         |
| ------------------------------ | -------------------------------------------------------------------------- | :----------: | :---------------------------------------: | ------------------------------------------ |
| 取引フォーム                   | `routes/transactions/index.tsx`                                            |      ✅      | `type`（収入/支出）で絞り込み（親で処理） | `categoryId`                               |
| 年度予算作成                   | `routes/budget/new/-components/budget-new-form/budget-entries-section.tsx` |      ✅      |       追加済みIDを除外（親で処理）        | `categoryId`                               |
| イベントテンプレート作成・編集 | `routes/event-templates/-components/template-form-item.tsx`                |      ✅      |            なし（固定リスト）             | `categoryId`                               |
| イベント・取引追加ダイアログ   | `routes/events/-components/event-add-transaction-dialog.tsx`               |      ❌      |            なし（固定リスト）             | `categoryName`（⚠️ ID 代わりに名前を使用） |
| ホーム・クイック支出           | `routes/index.tsx`                                                         |      ❌      |           支出のみ（親で処理）            | `categoryId`                               |

### 各実装の詳細

#### 取引フォーム（`routes/transactions/index.tsx`）

- `Category[]`型（`id`, `name`, `icon`, `color`, `type`, `isSaving`）を持つローカルモックから Select を構築
- `CategoryIcon` を使ってアイコン・色を表示
- `type` に連動して `categories.filter(c => c.type === type)` でフィルタリングした結果を渡している

```tsx
<Select value={field.state.value} onValueChange={field.handleChange}>
  <SelectTrigger id="tx-category" className="w-full">
    <SelectValue placeholder="カテゴリを選択" />
  </SelectTrigger>
  <SelectContent>
    {filteredCategories.map((c) => (
      <SelectItem key={c.id} value={c.id}>
        <span className="flex items-center gap-2">
          <CategoryIcon
            icon={c.icon}
            color={c.color}
            className="size-4 shrink-0"
          />
          {c.name}
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 年度予算作成（`budget-entries-section.tsx`）

- `AvailableCategory[]`型（`id`, `name`, `icon`, `color`）を親から受け取る
- `AddCategorySelect` サブコンポーネント内にローカル state (`value`) を持ち、選択後にリセット
- `CategoryIcon` でアイコン・色を表示

#### イベントテンプレート（`template-form-item.tsx`）

- `SELECTABLE_CATEGORIES`（`id`, `name`, `icon`, `color` の配列定数）を使用
- `CategoryIcon` でアイコン・色を表示

#### イベント・取引追加ダイアログ（`event-add-transaction-dialog.tsx`）

- ローカル定数 `SELECTABLE_CATEGORIES`（`id`, `name` のみ、アイコン・色なし）を使用
- **問題点①**: `CategoryIcon` を使用していないためアイコン・色が表示されない
- **問題点②**: `<SelectItem value={c.name}>` とカテゴリ名を値として使用しており、フォーム値も `categoryName` という文字列として管理している。ID を使うべき箇所にカテゴリ名が混入している

#### ホーム・クイック支出（`routes/index.tsx`）

- `Category[]`型のローカルモックから支出カテゴリのみをフィルタして使用
- アイコン・色のデータは持っているが、`CategoryIcon` を使っておらずアイコンが非表示

---

## 統一方針

### 作成するコンポーネント

`components/category/category-select.tsx`

#### インターフェース

```tsx
type CategorySelectItem = Pick<Category, 'id' | 'name' | 'icon' | 'color'>

type Props = {
  categories: CategorySelectItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string // デフォルト: "カテゴリを選択"
  id?: string // SelectTrigger の id
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string // SelectTrigger の className（幅指定等）
  onOpenChange?: (open: boolean) => void
}
```

#### 責務

- `categories` 配列の各要素をアイコン付きで SelectItem として描画するのみ
- フィルタリング・リセット・バリデーションなどのロジックは一切持たない

### イベント・取引追加ダイアログの修正方針

- フォームフィールドを `categoryName`（名前文字列）→ `categoryId`（ID）に変更
- `onSubmit` 内で `SELECTABLE_CATEGORIES.find(c => c.id === value.categoryId)?.name` によってカテゴリ名を解決し、`onAdd` に渡す
- あわせて `SELECTABLE_CATEGORIES` にアイコン・色を追加する
