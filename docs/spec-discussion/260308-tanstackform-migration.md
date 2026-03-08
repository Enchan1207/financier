# TanStack Form 未移行フォームの現状と対応方針

**作成日**: 2026-03-08

---

## 概要

フロントエンドのフォーム実装を調査した結果、現時点で TanStack Form を使用していないフォームが複数存在する。本ドキュメントでは各フォームの現状と移行方針をまとめる。

### TanStack Form 移行済み（参照用）

| コンポーネント | パス |
|---|---|
| EventCreateDialog | `routes/events/-components/event-create-dialog.tsx` |
| EventEditDialog | `routes/events/-components/event-edit-dialog.tsx` |
| EventAddTransactionDialog | `routes/events/-components/event-add-transaction-dialog.tsx` |

---

## 未移行フォーム一覧

### 1. SavingEditDialog

**パス**: `routes/savings/$id/-components/saving-edit-dialog.tsx`

**現在の実装**:

- `useState` による制御コンポーネント
- `useEffect` でダイアログ開閉時にフォームをリセット
- バリデーションは手動（`parseInt(targetAmount) > 0` のチェックのみ）
- エラーメッセージの表示なし

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| targetAmount | 数値 | 必須、1以上 |
| deadline | 日付文字列 | 任意 |

**課題**:

- バリデーションエラーが UI に表示されない
- `useEffect` によるリセットロジックが分散している

**対応方針**: **TanStack Form へ移行する**

Zod スキーマで `targetAmount` の必須・正整数バリデーションを定義し、エラーメッセージを `FieldError` で表示する。`deadline` は任意項目のため `z.string().optional()` で扱う。ダイアログ開閉時のリセットは `form.reset()` で一元管理できる。

---

### 2. SavingContributionDialog

**パス**: `routes/savings/$id/-components/saving-contribution-dialog.tsx`

**現在の実装**:

- `useState` による制御コンポーネント
- 開閉・送信の両方でリセット処理（`handleOpenChange`・`handleSubmit` 内で重複）
- バリデーションは手動（`isValid` フラグ）、エラー表示なし

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| amount | 数値 | 必須、1以上 |
| date | 日付文字列 | 必須、本日以前 |
| name | テキスト | 必須、空白不可 |

**課題**:

- `date <= TODAY` の制約が Zod で表現されておらず、手動チェックに留まっている
- リセット処理が重複している

**対応方針**: **TanStack Form へ移行する**

`date` の「本日以前」制約は Zod の `z.string().refine(d => d <= TODAY, ...)` で表現する。フォームリセットは `onSubmit` 後および `onOpenChange(false)` 時に `form.reset()` で統一する。

---

### 3. SavingWithdrawalDialog

**パス**: `routes/savings/$id/-components/saving-withdrawal-dialog.tsx`

**現在の実装**:

- `useState` による制御コンポーネント
- `balance`（積立残高）を上限値として動的に使用
- バリデーションは手動、エラー表示なし

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| amount | 数値 | 必須、1以上、balance以下 |
| memo | テキスト | 任意 |

**課題**:

- `amount <= balance` の動的制約が props 依存のため、Zod スキーマとして閉じた形で表現しにくい
- エラーメッセージが表示されない

**対応方針**: **TanStack Form へ移行する**

`balance` は props から受け取るため、Zod スキーマを `useForm` 内でクロージャとして定義し `z.number().max(balance, ...)` のように参照する。または `validators.onSubmit` の `value` と `balance` を比較するカスタムバリデーションを `form.Field` の `validators.onChange` に渡す方法でも対応できる。

---

### 4. EventLinkTransactionDialog

**パス**: `routes/events/-components/event-link-transaction-dialog.tsx`

**現在の実装**:

- `useState` による選択状態管理（リストから1件を選ぶ UI）
- モックデータを使用（`UNLINKED_TRANSACTIONS` 定数）
- テキスト入力フィールドなし

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| selectedId | 文字列 | 必須（null でないこと） |

**課題**:

- 現時点はモックデータ使用でありAPI非接続
- 選択リスト UI はテキスト入力ではなくボタンのリスト

**対応方針**: **現状維持（useState のまま）**

このコンポーネントはテキスト入力を持たない選択 UI であり、TanStack Form の恩恵（Zod バリデーション・フィールドエラー表示）が薄い。`selectedId !== null` という単純な有効性チェックは `useState` で十分。API 接続実装時にも同じ方針を維持する。

---

### 5. SavingNewPage

**パス**: `routes/savings/new/index.tsx`

**現在の実装**:

- `useState` による制御コンポーネント（フルページフォーム）
- `savingType`（`'goal'` | `'free'`）に応じてフィールドを条件表示
- `handleSave` はモック実装（API 未接続、ナビゲートのみ）
- バリデーションは手動、エラー表示なし

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| categoryName | テキスト | 必須、空白不可 |
| savingType | `'goal'` \| `'free'` | 必須 |
| targetAmount | 数値 | `savingType === 'goal'` のとき必須・1以上 |
| deadline | 日付文字列 | 任意（`savingType === 'goal'` のときのみ表示） |

**課題**:

- 条件付きバリデーション（`savingType` に依存）が手動 `isValid` に埋め込まれている
- エラーメッセージ表示なし
- API 未接続（モック）

**対応方針**: **TanStack Form へ移行する**

Zod の `z.object().superRefine()` で `savingType` に応じた条件付きバリデーションを表現する。`savingType` フィールドは `form.Subscribe` で購読し、条件に応じて `targetAmount` / `deadline` フィールドを表示・非表示にする。モック実装のまま移行しても問題ない。

---

### 6. useTemplateForm ＋ TemplateFormFields（イベントテンプレートフォーム）

**パス**:

- `routes/event-templates/-components/use-template-form.ts`（カスタムフック）
- `routes/event-templates/-components/template-form-fields.tsx`（表示コンポーネント）
- `routes/event-templates/-components/template-form-item.tsx`（行コンポーネント）
- `routes/event-templates/new/index.tsx`（作成ページ）
- `routes/event-templates/$id/edit/index.tsx`（編集ページ）

**現在の実装**:

- カスタムフック `useTemplateForm` が `useState` で動的配列フォームを管理
- `items` の追加（`addItem`）・削除（`removeItem`）・更新（`updateItem`）を提供
- 表示は `TemplateFormFields` → `TemplateFormItem` に分離されたプレゼンテーション構造

**フィールド**:

| フィールド | 型 | バリデーション |
|---|---|---|
| templateName | テキスト | 必須、空白不可 |
| items[].categoryId | 文字列 | 必須 |
| items[].name | テキスト | 必須、空白不可 |
| items[].amount | 数値文字列 | 必須、1以上 |
| items[].type | `'income'` \| `'expense'` | 必須 |

**課題**:

- 動的配列の管理ロジックが手動で冗長（追加・削除・更新のメソッドを個別実装）
- 各行のバリデーションエラー表示なし
- `uid` をランダム生成（`Math.random()`）して配列を識別しており、リスト更新に副作用がある

**対応方針**: **TanStack Form へ移行する（配列フィールド方式）**

TanStack Form のフィールドアレイ機能（`form.Field` + `field.pushValue` / `field.removeValue`）で動的行を管理する。現在の分離構造（Hook + Fields + Item）は以下のように再設計する：

- `useTemplateForm` フック: `useState` を廃止し、`useForm` を返すだけのラッパーにする
- `TemplateFormFields`: `items` 配列とコールバックの代わりに `form` オブジェクトを受け取り、`form.Field name="items"` で配列フィールドを展開する
- `TemplateFormItem`: `item` と `onUpdate` コールバックの代わりに `form` と `index` を受け取り、`form.Field name={`items[${index}].name`}` 形式で各サブフィールドをバインドする
- `uid` は TanStack Form が配列インデックスで管理するため不要になる

---

## 移行対象まとめ

| # | コンポーネント | 移行方針 | 実装上の注意点 |
|---|---|---|---|
| 1 | SavingEditDialog | TanStack Form へ移行 | シンプル、即移行可能 |
| 2 | SavingContributionDialog | TanStack Form へ移行 | `date <= TODAY` を Zod で表現 |
| 3 | SavingWithdrawalDialog | TanStack Form へ移行 | `balance` 制約をクロージャで Zod スキーマに組み込む |
| 4 | EventLinkTransactionDialog | **現状維持** | 選択 UI、TanStack Form 不要 |
| 5 | SavingNewPage | TanStack Form へ移行 | `savingType` 依存の条件付きバリデーションを `superRefine` で表現 |
| 6 | useTemplateForm 系 | TanStack Form へ移行 | 配列フィールド方式で再設計（5ファイル変更） |

---

## 実装計画

### 実装順序

シンプルなダイアログから着手し、複雑な配列フォームを最後に行う。

```
1. SavingEditDialog
2. SavingContributionDialog
3. SavingWithdrawalDialog
4. SavingNewPage
5. useTemplateForm 系（useTemplateForm / TemplateFormFields / TemplateFormItem / new / edit）
```

---

### 1. SavingEditDialog の実装詳細 ✅ 完了

```ts
const formSchema = z.object({
  targetAmount: z
    .string()
    .min(1, '目標金額を入力してください')
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
  deadline: z.string(),  // 任意のため最小バリデーションなし
})
```

- `useEffect` によるリセットを `handleOpenChange` 内の `form.reset(...)` に置き換えた
- `deadline` は `<input type="date">` から Calendar/Popover（DatePicker）に変更した
- クリアボタンは `Field orientation="horizontal"` で横並びに配置した
- `onSave` コールバックは sync のため `onSubmit` も sync で実装した

---

### 2. SavingContributionDialog の実装詳細 ✅ 完了

```ts
const formSchema = z.object({
  amount: z
    .string()
    .min(1, '金額を入力してください')
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
  date: z
    .string()
    .min(1, '日付を入力してください')
    .refine(
      (d) => d <= dayjs().format('YYYY-MM-DD'),
      '本日以前の日付を入力してください',
    ),
  name: z.string().min(1, '内容を入力してください'),
})
```

- `defaultName`・`defaultValues.date` は `TODAY` 定数を廃止し `dayjs()` を使用した
- 重複していたリセット処理を `handleOpenChange` 内の `form.reset()` に統一した
- 金額フィールドに `InputGroup` + `InputGroupAddon` で `¥` プレフィックスを追加した（`input-group` コンポーネントを新規インストール）

---

### 3. SavingWithdrawalDialog の実装詳細 ✅ 完了

`balance` は props であり動的なため、Zod スキーマをコンポーネント関数内（`balance` のスコープ内）で定義してクロージャとして参照する。

```ts
// コンポーネント内で定義
const formSchema = z.object({
  amount: z
    .string()
    .min(1, '取り崩し額を入力してください')
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください')
    .refine(
      (v) => parseInt(v, 10) <= balance,
      `上限（${formatCurrency(balance)}）以下の金額を入力してください`,
    ),
  memo: z.string(),
})
```

- `balance` props のクロージャとして Zod スキーマをコンポーネント内で定義した
- 金額フィールドに `InputGroup` + `InputGroupAddon` で `¥` プレフィックスを追加した
- `memo` フィールドは任意のため `z.string()` のみ（min なし）
- `form.Subscribe` で `[amount, isSubmitting]` を購読し送信ボタンの disabled 状態を制御した

---

### 4. SavingNewPage の実装詳細 ✅ 完了

`savingType` に応じた条件付きバリデーションを `superRefine` で実装する。

```ts
const formSchema = z
  .object({
    categoryName: z.string().min(1, 'カテゴリ名を入力してください'),
    savingType: z.enum(['goal', 'free']),
    targetAmount: z.string(),
    deadline: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.savingType === 'goal' && parseInt(val.targetAmount, 10) <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: '1以上の目標金額を入力してください',
        path: ['targetAmount'],
      })
    }
  })
```

`targetAmount` / `deadline` フィールドの表示制御には `form.Subscribe selector={s => s.values.savingType}` を使う。`savingType` の切り替え時は `form.setFieldValue('targetAmount', '')` でリセットする。

- `superRefine` で `savingType === 'goal'` のとき `targetAmount` を必須・正整数バリデーションとした
- `form.Subscribe` で `savingType` を購読し、`goal` のときのみ `targetAmount` / `deadline` フィールドを表示した
- 金額フィールドに `InputGroup` + `InputGroupAddon` で `¥` プレフィックスを追加した
- `deadline` は Calendar/Popover（DatePicker）と横並びクリアボタンで実装した
- ナビゲートのみのモック `onSubmit` のため async 化は行わなかった

---

### 5. useTemplateForm 系の実装詳細 ✅ 完了

#### ファイル構成の変更

| ファイル | 変更内容 |
|---|---|
| `use-template-form.ts` | `useState` を廃止し `useForm` を返すラッパーにする |
| `template-form-fields.tsx` | Props を `form` オブジェクト受け取りに変更、配列フィールド展開 |
| `template-form-item.tsx` | Props を `form` + `index` 受け取りに変更、`uid` を削除 |
| `new/index.tsx` | `useTemplateForm` の戻り値変更に追従 |
| `$id/edit/index.tsx` | 同上 |

#### Zod スキーマ

```ts
const itemSchema = z.object({
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  name: z.string().min(1, '内容名を入力してください'),
  amount: z
    .string()
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
  type: z.enum(['income', 'expense']),
})

const formSchema = z.object({
  templateName: z.string().min(1, 'テンプレート名を入力してください'),
  items: z.array(itemSchema).min(1, '取引を1件以上追加してください'),
})
```

#### 配列フィールドの操作

```tsx
// TemplateFormFields 内
<form.Field name="items" mode="array">
  {(field) => (
    <>
      {field.state.value.map((_, index) => (
        <TemplateFormItem
          key={index}
          form={form}
          index={index}
          canRemove={field.state.value.length > 1}
          onRemove={() => field.removeValue(index)}
        />
      ))}
      <Button onClick={() => field.pushValue(newFormItem())}>追加</Button>
    </>
  )}
</form.Field>
```

- `useTemplateForm` は `initialValues` と `onSubmit` を引数として受け取り、`useForm` の結果をそのまま返すラッパーに変更した
- `FormItem` 型と `newFormItem` 関数を廃止し、`FormItemValues`（`uid` なし）と `newFormItemValues` を `use-template-form.ts` に移した
- `TemplateFormFields` の Props を `form` オブジェクト受け取りに変更し、`form.Field name="items" mode="array"` で配列フィールドを展開した
- `TemplateFormItem` の Props を `form` + `index` 受け取りに変更し、`form.Field name={`items[${index}].xxx`}` 形式でサブフィールドをバインドした
- `uid` による識別を廃止し、配列インデックスで管理するようになった
- 各ページでは `<form onSubmit>` 要素でラップし、`form.Subscribe` で `isSubmitting` を購読して送信ボタンを制御した

---

## 移行時の共通パターン

TanStack Form への移行時は、移行済みの Event 系ダイアログ（`event-create-dialog.tsx` 等）を参考にする。

```ts
useForm({
  defaultValues: { ... },
  validators: { onSubmit: zodSchema },
  onSubmit: async ({ value }) => { ... },
})
```

- バリデーションは `validators.onSubmit` に Zod スキーマを渡す
- フィールドエラーは `<FieldError errors={field.state.meta.errors} />` で表示
- ダイアログリセットは `form.reset()` を使用（`useEffect` 不要）
- `isSubmitting` フラグで送信ボタンを無効化し二重送信を防止
- 日付フィールドは既存の `<input type="date">` 形式を維持（CalendarPicker 変更はスコープ外）
