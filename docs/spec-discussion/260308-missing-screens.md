# 未実装・作りかけ画面の実装方針（UI モック）

**作成日**: 2026-03-08

仕様書（UC系・機能仕様書）とフロントエンドの `routes/` を照合し、未実装または作りかけの画面・機能と、そのモック実装方針をまとめる。

バックエンドは現フェーズのスコープ外。既存ページと同様にルートごとにモックデータをインラインで定義して実装する。

---

## サマリ

| 区分 | ユースケース | 状態 | 優先度 |
|------|-------------|------|--------|
| トランザクション編集・削除 | UC-1.3, UC-1.4 | ✅ 実装済み | 高 |
| カテゴリ管理 | UC-2.1〜2.3 | ✅ 実装済み | 高 |
| 年度予算作成 | UC-3.1 | ✅ 実装済み | 高 |
| カテゴリ予算の設定・変更 | UC-3.2 | ✅ 実装済み | 高 |
| 予算の再配分 | UC-3.3 | ⏸️ 保留 | 中 |
| 年度締め | UC-6.1 | ✅ 実装済み | 中 |
| 分析・可視化 | UC-7.1〜7.7 | ❌ 未実装 | 低 |

---

## 1. トランザクション編集・削除（UC-1.3, UC-1.4）✅ 実装済み

### 実装内容

`routes/transactions/index.tsx` に編集・削除機能を追加した。

**UI**:

- 各取引行の末尾に編集（鉛筆）・削除（ゴミ箱）のアイコンボタンを配置
- 編集ボタン → `EditTransactionDialog`（種別・カテゴリ・金額・名前・日付・イベントをすべて編集可能）
- 削除ボタン → `AlertDialog` で取引名を表示して確認 → ローカル state から除去

**フォーム**:

- `AddTransactionDialog` と `EditTransactionDialog` の共通フィールドを `TransactionFormFields` コンポーネントに切り出し
- `useTransactionForm`（TanStack Form + Zod）で状態・バリデーションを管理し、`AddTransactionDialog` も統一して移行
- カテゴリは `form.Subscribe` で種別（収支）連動フィルタリング
- `EditTransactionDialog` は `key={transaction.id}` でリマウントし、`defaultValues` で初期値を設定

**state 管理**:

- 取引一覧を `TransactionsPage` の `useState` で管理
- `editingTransaction` / `deletingTransaction` を同じく state で持ち、各ダイアログの開閉を制御

### 実装上の判断

当初の方針（行クリックでダイアログ表示 / 編集ダイアログ内に削除ボタン）から変更した点:

- **操作UI**: 行クリックではなく行末のアイコンボタンを採用。意図しない操作を防ぐため
- **削除確認**: 編集ダイアログ内ではなく独立した `AlertDialog` として切り出し
- **ファイル分割**: `-components/` への切り出しは行わず、`index.tsx` 内にインラインで定義。規模として適切と判断

### ファイル構成（実装後）

```
routes/transactions/
└── index.tsx    ← Transaction 型・スキーマ・モックデータ・全コンポーネントを含む
```

---

## 2. カテゴリ管理（UC-2.1〜2.3）✅ 実装済み

### 実装内容

**UI:**

- `Tabs` で支出・収入を切り替え表示
- `status=archived` のカテゴリは `opacity-50` で薄く表示し「削除済み」バッジを付与
- 積立紐付きカテゴリは「積立」バッジで識別
- `active` カテゴリの各行末尾に「編集」（鉛筆）・「削除」（ゴミ箱）のアイコンボタンを配置
- ページ右上に「新規作成」ボタン
- `nav-items.ts` の「管理」グループに `/categories` を追加

**UC-2.1（カテゴリ作成）:**

- `CreateCategoryDialog` はカテゴリ名 Input のみのシンプルなフォーム
- 積立カテゴリは `/savings/new` リンクで誘導する方式を採用（ダイアログ内でのチェックボックス展開は見送り）
- TanStack Form + Zod で状態・バリデーションを管理

**UC-2.3（削除）:**

- モックでは参照チェックを省略し、常に `status: 'archived'` に変更する実装
- `AlertDialog` で削除前確認を表示

**state 管理:**

- カテゴリ一覧を `CategoriesPage` の `useState` で管理
- `editingCategory` / `deletingCategory` を同じく state で持ち、各ダイアログの開閉を制御

### 実装上の判断

- **積立カテゴリ作成フォーム**: 当初方針（ダイアログ内チェックボックスで積立フォームを展開）から変更し、フッターの `/savings/new` リンクで誘導する方式を採用。ダイアログの複雑化を避けるため

### ファイル構成（実装後）

```
routes/categories/
├── index.tsx    ← Category 型・スキーマ・モックデータ・CategoryTable を含む
└── -components/
    ├── create-category-dialog.tsx
    └── edit-category-dialog.tsx
```

---

## 3. 年度予算の作成・編集（UC-3.1〜3.3）

### 現状

- `routes/budget/$year/index.tsx` は予算実績の確認（UC-3.4）を実装済み（モックデータ使用）
- `routes/budget/new/index.tsx` は「（工事中）」プレースホルダー
- 予算の作成・編集・再配分に対応する UI がない

### 必要な機能

**UC-3.1（年度予算の作成）**:

- `/budget/new` に年度指定（セレクトまたは数値入力）とカテゴリ別年額入力テーブルを実装
- TanStack Form + 配列フィールドでカテゴリ行を管理する
- 「前年度からコピー」ボタンで前年度のモック値を `form.setFieldValue` で反映

**UC-3.2（カテゴリ予算の設定・変更）**:

- `/budget/$year` の各カテゴリ行に「編集（鉛筆）」ボタンを追加し、`BudgetInputDialog` でダイアログ編集
- 予算定義ヘルパを提供：「年額」「月額固定」（入力値 × 12）「月ごと変動」（12か月分を入力して合算）タブ
- 支出予算合計 > 収入予算合計のとき、ページ上部に警告バナーを表示
- 保存時に収支チェックを行い、超過する場合はエラー表示・保存ブロック
- ヘッダー右上の「編集」ボタン → `/budget/$year/edit` へ遷移し、`/budget/new` フォームを流用した全体編集ページで一括変更可能（こちらも保存時に収支バリデーション）

**UC-3.3（予算の再配分）**:

> ⏸️ **実装保留**（2026-03-12）
>
> UC-3.2 の個別編集を「先に減らして後で増やす」順番で実行すれば機能的にほぼ代替できる。
> UC-3.3 固有の価値は「収支上限いっぱいの状態でも減額・増額を一括アトミックに処理できる点」と「複数カテゴリの差分を一覧確認できる点」に限られる。
> プロダクトのフェーズを踏まえた優先度判断が定まるまで保留とする。

- 再配分元カテゴリ・減額幅と再配分先カテゴリ・増額幅を指定するダイアログ
- ダイアログ内に変更前後の差分プレビューを表示してから保存

### 実装手順

1. ~~`routes/budget/new/index.tsx` を実装（UC-3.1）~~ → **実装済み**
2. ~~`routes/budget/-components/budget-input-dialog.tsx` を新規作成（UC-3.2）~~ → **実装済み**
3. `routes/budget/-components/reallocation-dialog.tsx` を新規作成（UC-3.3）← **保留**
   - 差分プレビューは再配分前後の年額を横並びで表示する
4. ~~`routes/budget/$year/index.tsx` を改修~~ → **実装済み**（鉛筆ダイアログ・収支バリデーション・編集ボタン接続）

### 実装済み内容（UC-3.1）

Container-Presentation パターンで分割して実装した。

```
routes/budget/new/
├── index.tsx                              ← 薄いコンテナ
└── -components/
    ├── use-budget-new-form.ts             ← フォームフック・スキーマ・モックデータ
    └── budget-new-form/
        ├── index.tsx                      ← BudgetNewFormFields（年度フィールド + 合成）
        ├── budget-entries-section.tsx     ← AddCategorySelect + BudgetEntriesSection
        └── budget-summary.tsx            ← BudgetSummary
```

**設計上の決定事項**:

- カテゴリ一覧は空スタートとし、`Select` から自由に追加・削除できる（全カテゴリに一括表示しない）
- 収入・支出セクションはタブではなく縦並びで表示し、ひと目で両方の合計が把握できるようにした
- 各セクションの末尾に合計行（`TableFooter`）を表示
- ページ末尾の収支サマリに積み上げ横棒グラフを表示。`BudgetSummaryBar` を `$year/` ページと共通化し、収支逆転時は「不足分」を収入バーへ、余剰時は「未割り当て」を支出バーへ追加して両バーの軸スケールを揃える

### 実装済み内容（UC-3.2）

Container-Presentation パターンで実装。

```
routes/budget/
├── $year/
│   ├── index.tsx                         ← 改修（鉛筆ダイアログ統合・編集ボタン接続・収支バリデーション）
│   └── edit/
│       └── index.tsx                     ← 新規（全体編集ページ）
└── -components/
    └── budget-input-dialog.tsx           ← 新規（カテゴリ個別編集ダイアログ）
```

また `budget/new` フォームを全体編集ページで流用するため以下も改修した：

```
routes/budget/new/
└── -components/
    ├── use-budget-new-form.ts            ← 改修（initialEntries オプション追加）
    └── budget-new-form/
        └── index.tsx                     ← 改修（showYearField / showCopyButton props 追加）
```

**設計上の決定事項**:

- 2つのエントリポイントを整備：鉛筆ダイアログ（1カテゴリをサクッと調整）と全体編集ページ（複数カテゴリを一括見直し）
- どちらも保存時に収支バリデーションを実施し、支出 > 収入なら保存ブロック
- 閲覧ページの収支超過警告バナーは引き続き維持（状況把握用）
- `checkBalance` コールバックをダイアログに渡す方式でカテゴリ種別（収入/支出）の判定を親に委譲

### 保留中の実装（UC-3.3）

⏸️ 保留につき、現時点でのファイル追加予定はなし。解除後に着手する。

```
routes/budget/
└── -components/
    └── reallocation-dialog.tsx           ← 新規（UC-3.3、保留中）
```

---

## 4. 年度締め（UC-6.1）✅ 実装済み

### 実装内容

**UI:**

- `status === 'active'` のとき: ヘッダー右端に「編集」ボタン（既存）と「年度を締める」ボタン（`variant="destructive"`）を表示
- 「年度を締める」クリック → `FiscalYearCloseDialog` を表示
- `status === 'closed'` のとき: ボタン類を非表示にし「締め済み」バッジを表示

**ダイアログ（`FiscalYearCloseDialog`）:**

- 説明文と「次年度の予算設定をコピーする」チェックボックスを表示
- 「締める」クリック中は `Loader2` スピナーを表示し、ボタン・チェックボックス・キャンセルをすべて無効化
- ESC・背景クリックによる中断を処理中は防止（`onOpenChange` ガード）
- `onConfirm` の型は `(copyBudget: boolean) => Promise<void>`

**state 管理:**

- `status: 'active' | 'closed'` と `closeDialogOpen: boolean` を `BudgetYearPage` の `useState` で管理
- モックの待機は `setTimeout(800ms)` で表現

### ファイル構成（実装後）

```
routes/budget/
└── $year/
    ├── index.tsx                             ← 改修
    └── -components/
        └── fiscal-year-close-dialog.tsx      ← 新規
```

---

## 5. 分析・可視化（UC-7.1〜7.7）

### 現状

ホーム画面（`/`）に内部残高・当月支出・予算進捗の基本サマリが表示されている（UC-7.1 の部分対応）。専用の分析ページは存在しない。

UC-7.3（イベント別分析）は `/events/$id/` で合計・カテゴリ別・年度別内訳を表示しており**部分的に対応済み**。

### 実装方針

以下の分割を採用する：

- **既存ページに追加するもの**（頻度の高い参照系）
  - UC-7.2（カテゴリ別年度分析）→ `/budget/$year/` のタブや下部セクションに追加
  - UC-7.4（積立進捗分析）→ `/savings/` にサマリカードとして追加

- **専用ページ `/analytics` を新設するもの**（長期・横断的な分析）
  - UC-7.5（年度間比較）
  - UC-7.6（財政体力の推移）
  - UC-7.7（投資判断支援）

### 必要な機能詳細

| UC | 追加先 | 表示内容 |
|----|--------|---------|
| UC-7.2 | `/budget/$year/` | 円グラフ（支出構成比）、棒グラフ（実績 vs 予算） |
| UC-7.4 | `/savings/` | 各積立の残高・進捗率・月次目安との乖離 |
| UC-7.5 | `/analytics` | 年度別収入・支出・差分の推移グラフ |
| UC-7.6 | `/analytics` | 内部残高の時系列折れ線グラフ |
| UC-7.7 | `/analytics` | 任意金額を入力 → 支出後残高・積立充足率をシミュレーション |

### チャートライブラリ

shadcn/ui の Chart（Recharts ベース）を使用する。他のページですでに `recharts` が使われているか確認してから追加すること。

### 実装手順

1. `routes/analytics/index.tsx` を新規作成
   - 年度別・内部残高のモックデータをインラインで定義
   - タブで UC-7.5 / UC-7.6 / UC-7.7 を切り替え
2. `routes/analytics/-components/` に以下を作成
   - `annual-comparison-chart.tsx` — 棒グラフ（UC-7.5）
   - `balance-trend-chart.tsx` — 折れ線グラフ（UC-7.6）
   - `investment-simulation-form.tsx` — 金額入力 → 残高・充足率の計算表示（UC-7.7、純粋な計算なので API 不要）
3. `nav-items.ts` に分析グループを追加

```typescript
{
  label: '分析',
  items: [
    { to: '/analytics', label: '分析', icon: BarChart2, visibility: 'public' },
  ],
},
```

### ファイル構成

```
routes/analytics/
├── index.tsx
└── -components/
    ├── annual-comparison-chart.tsx
    ├── balance-trend-chart.tsx
    └── investment-simulation-form.tsx
```

---

## 参照

- [ユースケース 1章 トランザクション系](../spec/usecases/01-transaction.md)
- [ユースケース 2章 カテゴリ系](../spec/usecases/02-category.md)
- [ユースケース 3章 予算系](../spec/usecases/03-budget.md)
- [ユースケース 6章 年度締め系](../spec/usecases/06-fiscal-year-close.md)
- [ユースケース 7章 分析・可視化系](../spec/usecases/07-analytics.md)
- [フロントエンド実装ガイドライン](../architecture-guideline/frontend.md)
- [フロントエンド UI 再設計](./260216-frontend-rebuild.md)
- [イベント関連画面構成](./260306-event-screens.md)
