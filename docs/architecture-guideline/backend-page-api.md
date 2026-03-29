# バックエンド実装ガイドライン（ページ API 層）

> このガイドラインは [バックエンド実装ガイドライン](./backend.md) のサブガイドラインです。
> 基本原則・レイヤ定義・命名規則は親ガイドラインに従います。

---

## 概要

SPA において古典的な REST API を用いると、1 画面の表示に複数の API コールが直列・並列混在で発生し、ローディング状態の管理が複雑になる（popcorn UI）。

これを防ぐため、**ページの表示に必要なデータを組み立てて返す Query 専用のエンドポイント層**として `pages/` を設ける。

---

## API 区分の判断基準

| 区分                        | 配置先      | 例                          |
| --------------------------- | ----------- | --------------------------- |
| Command（登録・更新・削除） | `features/` | `POST /api/transactions`    |
| Query（ページ表示用）       | `pages/`    | `GET /api/pages/categories` |

**判断の原則**: ページの表示に必要なデータを組み立てて返す Query は `pages/` に置く。Command（登録・更新・削除）は `features/` に置く。

---

## ディレクトリ構造

```
backend/
├── features/              # ドメイン単位（Command + 単純 Query）
│   └── <feature>/
│       ├── repository.ts
│       ├── workflow.ts
│       └── route.ts
│
└── pages/                 # UI 単位（複合 Query のみ）
    ├── dashboard/
    │   └── route.ts       # GET /api/pages/dashboard
    ├── analytics/
    │   ├── categories/
    │   │   └── route.ts   # GET /api/pages/analytics/categories
    │   ├── savings/
    │   │   └── route.ts   # GET /api/pages/analytics/savings
    │   ├── events/
    │   │   └── route.ts   # GET /api/pages/analytics/events
    │   └── fiscal-years/
    │       └── route.ts   # GET /api/pages/analytics/fiscal-years
    └── scenario/
        └── route.ts       # GET /api/pages/scenario
```

ディレクトリ名はフロントエンドのルート名と一致させる。

---

## 依存関係ルール

```
# features/（既存）
route.ts → workflow.ts ← repository.ts (注入)
              ↓
          domains/

# pages/（追加）
route.ts → features/*/repository.ts（複数可）
         → domains/（型参照のみ）
```

- `pages/` の route.ts は **`features/` の repository.ts を直接呼び出してよい**
- `pages/` の route.ts は **workflow.ts を呼び出してはならない**
- `pages/` の route.ts は **他の `pages/` モジュールに依存してはならない**

---

## `pages/*/route.ts` のルール

### 必須

- Hono インスタンスをメソッドチェーン形式で定義する（`features/` と同様）
- レスポンス型はそのファイル内にページ固有の集約型として定義する
- ページング用エンドポイントが必要な場合は同一ディレクトリ内に追加する

### 禁止事項

| #   | 禁止内容                                                              |
| --- | --------------------------------------------------------------------- |
| 1   | ❌ ワークフローの定義（副作用・ビジネスロジックを持たせない）         |
| 2   | ❌ Command 系処理（登録・更新・削除）の実装                           |
| 3   | ❌ `features/` のドメインモデルをそのままレスポンスとして返却         |
| 4   | ❌ 他の `pages/` モジュールへの依存                                   |
| 5   | ❌ ルート定義を変数に代入してからメソッド呼び出し（型補完が効かない） |

---

## 命名規則

### エンドポイント URL

- プレフィックス: `/api/pages/`
- パス: フロントエンドのルートパスと対応させる

```
ダッシュボード         GET /api/pages/dashboard
カテゴリ別年度分析     GET /api/pages/analytics/categories
積立進捗分析           GET /api/pages/analytics/savings
イベント別分析         GET /api/pages/analytics/events
年度間比較             GET /api/pages/analytics/fiscal-years
投資判断支援           GET /api/pages/scenario
```

### 集約型

ページ固有の集約型は `PascalCase` で命名し、`Response` サフィックスを付ける。

```typescript
// ✅
type DashboardResponse = {
  balance: { internal: number; savings: number }
  budgetProgress: { actual: number; budget: number; rate: number }
  // ...
}

// ❌ features/ のドメインモデルをそのまま使用
type DashboardResponse = {
  transactions: Transaction[]
  budgets: Budget[]
}
```

---

## 実装チェックリスト

- [ ] 対象ページの表示項目を UC・機能仕様で確認し、必要なドメインを列挙する
- [ ] 必要なドメインが複数にまたがることを確認する（単一なら `features/` に置く）
- [ ] `pages/<page>/route.ts` を作成する
- [ ] ページ固有の集約型（`*Response`）をファイル内に定義する
- [ ] 各 feature のリポジトリを呼び出し、集約型に変換して返す
- [ ] ページングが必要な場合はサブエンドポイントを追加する
- [ ] `index.ts` で route を統合する

---

## 参照

- [バックエンド実装ガイドライン](./backend.md)
- [ページ API 戦略（策定経緯）](../spec-discussion/260315-page-api-strategy.md)
- [ユースケース定義書](../spec/usecases.md)
