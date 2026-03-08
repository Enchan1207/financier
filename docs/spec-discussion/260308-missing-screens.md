# 未実装・作りかけ画面の実装方針（UI モック）

**作成日**: 2026-03-08

仕様書（UC系・機能仕様書）とフロントエンドの `routes/` を照合し、未実装または作りかけの画面・機能と、そのモック実装方針をまとめる。

バックエンドは現フェーズのスコープ外。既存ページと同様にルートごとにモックデータをインラインで定義して実装する。

---

## サマリ

| 区分 | ユースケース | 状態 | 優先度 |
|------|-------------|------|--------|
| トランザクション編集・削除 | UC-1.3, UC-1.4 | ❌ 未実装 | 高 |
| カテゴリ管理 | UC-2.1〜2.3 | ❌ 未実装 | 高 |
| 年度予算作成 | UC-3.1 | ⚠️ 工事中 | 高 |
| カテゴリ予算の設定・変更 | UC-3.2 | ❌ 未実装 | 高 |
| 予算の再配分 | UC-3.3 | ❌ 未実装 | 中 |
| 年度締め | UC-6.1 | ❌ 未実装 | 中 |
| 分析・可視化 | UC-7.1〜7.7 | ❌ 未実装 | 低 |

---

## 1. トランザクション編集・削除（UC-1.3, UC-1.4）

### 現状

`routes/transactions/index.tsx` は一覧表示と新規追加ダイアログのみ実装。モックデータとフォームはインラインで定義（TanStack Form 未使用）。既存取引の行クリックで何も起きない。

### 必要な機能

**UC-1.3（取引編集）**:

- 取引行クリック → 編集ダイアログを開く
- 金額・日付・カテゴリ・イベント・名前を編集可能
- カテゴリ変更時は `status=active` のカテゴリのみ選択可能
- 対象年度が closed なら編集不可（ダイアログを読み取り専用にする）

**UC-1.4（取引削除）**:

- 編集ダイアログ内に削除ボタンを配置
- `AlertDialog` で確認を挟んでから削除実行
- 対象年度が closed なら削除ボタンを非表示

### 補足

- UC-1.3 には「イベントを紐付ける」操作（UC-5.2）も含まれる。既存の新規追加フォームにイベント選択フィールドがあるため、同様に編集フォームにも含める
- 既存の `AddTransactionDialog` は `useState` ベースなので、TanStack Form への移行もこのタイミングで行う

### 実装手順

1. `routes/transactions/-components/edit-transaction-dialog.tsx` を新規作成
   - 既存の `AddTransactionDialog` と同じフォーム構造（種別・カテゴリ・金額・名前・日付・イベント）を TanStack Form で実装
   - `target` prop で初期値を受け取り、`defaultValues` に展開する
   - フッターに「削除」ボタンを追加し、クリックで `AlertDialog` を開く
2. `routes/transactions/index.tsx` を改修
   - `AddTransactionDialog` を TanStack Form ベースに統一（`-components/` に切り出し）
   - `TableRow` に `onClick` を追加し、対象取引を state に保持してダイアログを開く
   - モックの取引一覧を `useState` で管理し、編集・削除時にローカル更新する

### ファイル構成

```
routes/transactions/
├── index.tsx                             ← 改修
└── -components/
    ├── add-transaction-dialog.tsx        ← 切り出し・TanStack Form 化
    └── edit-transaction-dialog.tsx       ← 新規（編集・削除）
```

---

## 2. カテゴリ管理（UC-2.1〜2.3）

### 現状

`routes/categories/` ディレクトリが存在しない。`nav-items.ts` にもカテゴリへのリンクがない。

### 必要な画面・機能

**`/categories` （カテゴリ一覧）**:

- 支出カテゴリ・収入カテゴリをタブ切り替えで表示（shadcn/ui `Tabs`）
- `status=archived` のカテゴリは薄く表示し「削除済み」バッジを付与
- 積立紐付きカテゴリは「積立」バッジで識別
- 各行に「編集」ボタン（→ UC-2.2）と「削除」ボタン（→ UC-2.3）
- ページ右上に「新規作成」ボタン（→ UC-2.1）

**UC-2.1（カテゴリ作成）の注意点**:

- 支出カテゴリの場合、「このカテゴリを積立として作成する」チェックボックスを設ける
- チェック時は積立設定フォームを展開（`form.Subscribe` で条件付き表示）
- 積立設定は `savingType`（`goal` / `free`）、`targetAmount`（任意）、`deadline`（任意）
- モック段階では保存時にローカル状態のカテゴリ一覧に追加するだけでよい

**UC-2.3（削除）の注意点**:

- 参照あり → `status` を `archived` に変更（新規選択不可だが行は残る）
- 参照なし → 一覧から除去（物理削除相当）
- モックでは「参照あり」固定にして archived 変更のみ実装してもよい
- 削除ボタンクリック時は `AlertDialog` で確認を挟む

### 実装手順

1. `routes/categories/index.tsx` を新規作成
   - モックのカテゴリ一覧を `useState` で管理
   - `Tabs` で支出・収入を切り替え
2. `routes/categories/-components/create-category-dialog.tsx` を新規作成
   - 積立オプションの条件付きフォームを `form.Subscribe` で実装
3. `routes/categories/-components/edit-category-dialog.tsx` を新規作成
   - 名称変更のみ（シンプルなフォーム）
4. `frontend/components/layout/nav-items.ts` に `/categories` を「管理」グループに追加

### ファイル構成

```
routes/categories/
├── index.tsx
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

- `/budget/$year` の各カテゴリ行に「編集」ボタンを追加し、ダイアログで編集
- 予算定義ヘルパを提供：「月額固定」タブ（入力値 × 12）と「月ごと変動」タブ（12か月分を入力して合算）
- 支出予算合計 > 収入予算合計のとき、ページ上部に警告バナーを表示（操作は止めない）

**UC-3.3（予算の再配分）**:

- 再配分元カテゴリ・減額幅と再配分先カテゴリ・増額幅を指定するダイアログ
- ダイアログ内に変更前後の差分プレビューを表示してから保存

### 実装手順

1. `routes/budget/new/index.tsx` を実装（UC-3.1）
   - モックのカテゴリ一覧をインラインで定義し、配列フィールドとして並べる
   - 保存後は `/budget/$year` へ遷移（モックのため実際の保存は不要）
2. `routes/budget/-components/budget-input-dialog.tsx` を新規作成（UC-3.2）
   - タブ切り替えで「月額固定」と「月ごと変動」を提供
   - 変動タブでは 12 か月分の入力フィールドを並べ、合算を `form.Subscribe` でリアルタイム表示
3. `routes/budget/-components/reallocation-dialog.tsx` を新規作成（UC-3.3）
   - 差分プレビューは再配分前後の年額を横並びで表示する
4. `routes/budget/$year/index.tsx` を改修
   - 各カテゴリ行に「編集」ボタン追加（→ `budget-input-dialog.tsx`）
   - ページ上部に「再配分」ボタン追加（→ `reallocation-dialog.tsx`）
   - 収支バランス警告バナーをページ上部に追加

### ファイル構成

```
routes/budget/
├── new/index.tsx                         ← 工事中 → 実装
├── $year/index.tsx                       ← 改修（編集・再配分ボタン追加）
└── -components/
    ├── budget-table.tsx                  ← 既存（改修して編集ボタンを追加）
    ├── budget-input-dialog.tsx           ← 新規（UC-3.2）
    └── reallocation-dialog.tsx           ← 新規（UC-3.3）
```

---

## 4. 年度締め（UC-6.1）

### 現状

年度締め機能に対応する画面・操作が一切ない。

### 必要な機能

- `/budget/$year` ページに「年度を締める」ボタンを追加
- `AlertDialog` で「締めると編集・削除が不可になります」を明示してから実行
- ダイアログ内に「次年度へ予算をコピーする」チェックボックスを設ける
- モックでは締め後に年度の `status` を `closed` に変えてローカル状態を更新し、編集系ボタンを非表示にする

### 実装手順

1. `routes/budget/-components/fiscal-year-close-dialog.tsx` を新規作成
   - `AlertDialog` をベースに確認メッセージを表示
   - 「次年度へ予算をコピーする」チェックボックスを追加（モックでは表示のみ）
2. `routes/budget/$year/index.tsx` を改修
   - ページ上部に「年度を締める」ボタンを追加（`status=active` のときのみ表示）
   - 締め後は `useState` で `status` を `closed` に更新し、編集・削除ボタンを非表示化

### ファイル構成

```
routes/budget/
├── $year/index.tsx                       ← 改修（締めボタン追加）
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
