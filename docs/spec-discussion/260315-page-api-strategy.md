# ページ API 戦略

**作成日**: 2026-03-15
**関連 issue**: #8

バックエンド実装フェーズ開始にあたり、Query 系 API の設計方針として「ページ API 戦略」を採用する。本ドキュメントでその内容と理由、ディレクトリ構成への反映を記録する。

---

## 背景・課題

古典的な REST API を SPA で使用すると、1 画面の表示に複数の API コールが発生し、ウォーターフォール状のリクエスト連鎖（いわゆる "popcorn UI"）に陥りやすい。

TanStack Query を採用しているこのプロジェクトでも、`useQuery` が画面内に散在すると以下の問題が生じる：

- 複数のローディング状態・エラー状態の管理が複雑になる
- N+1 的なリクエストが発生する
- 画面とは無関係なドメイン境界で API が分割されているため、何をフェッチすれば画面が完成するか把握しにくい

特に financier のダッシュボード（UC-7.1）や分析系画面（UC-7.2〜7.7）は、複数ドメインのデータを集約して表示するため、この問題が顕著になる。

---

## 採用する方針

### Query 系：ページ API

「このページを表示するのに必要なデータをまとめて返す」エンドポイントを用意する。

- リクエスト 1 本で画面全体の初期表示が完結する
- ローディング状態が画面単位で 1 つに収まる
- フロントエンドの repository は `GET /api/pages/{page}` を呼び出すだけになる

ページングが必要な一覧（例：ダッシュボードの「もっと見る」）は、ページ専用のサブエンドポイントを追加する。

### Command 系：従来の REST API

登録・更新・削除などの Command 系操作は、ドメイン境界が明確であるため引き続き `features/` のエンドポイントで処理する。

| 区分 | 設計 | 例 |
|------|------|----|
| Query（複合） | ページ API（`pages/`） | `GET /api/pages/dashboard` |
| Query（単純） | `features/` エンドポイント | `GET /api/categories` |
| Command | `features/` エンドポイント | `POST /api/transactions` |

---

## ディレクトリ構成

`backend/` 直下に `pages/` ディレクトリを新設し、ページ API を配置する。既存の `features/` 構造は変更しない。

```
backend/
├── domains/               # 変更なし
├── schemas/               # 変更なし
├── middlewares/           # 変更なし
├── lib/                   # 変更なし
│
├── features/              # ドメイン単位（Command + 単純 Query）
│   ├── transactions/
│   │   ├── repository.ts
│   │   ├── workflow.ts
│   │   └── route.ts       # /api/transactions
│   ├── categories/
│   ├── budgets/
│   ├── savings/
│   ├── events/
│   ├── event-templates/
│   └── fiscal-years/
│
└── pages/                 # ← 新規追加：UI 単位（複合 Query）
    ├── dashboard/
    │   └── route.ts       # GET /api/pages/dashboard
    ├── analytics/
    │   ├── categories/
    │   │   └── route.ts   # GET /api/pages/analytics/categories?fiscalYear=&month=
    │   ├── savings/
    │   │   └── route.ts   # GET /api/pages/analytics/savings
    │   ├── events/
    │   │   └── route.ts   # GET /api/pages/analytics/events
    │   └── fiscal-years/
    │       └── route.ts   # GET /api/pages/analytics/fiscal-years
    └── scenario/
        └── route.ts       # GET /api/pages/scenario?amount=  (UC-7.7)
```

---

## `pages/` のルール

既存のバックエンドガイドライン（[backend.md](../architecture-guideline/backend.md)）を踏襲しつつ、以下の制約を追加する。

### 許可

- 複数の `features/*/repository.ts` を直接呼び出す（cross-domain aggregation がこの層の存在意義）
- ページ固有の集約型をファイル内に定義する
- ページング用サブエンドポイントを同ディレクトリに追加する

### 禁止

- ワークフローの定義（read-only のため副作用・ビジネスロジックは不要）
- `features/` のドメインモデルをそのまま返却すること（ページ用の集約型を必ず定義する）
- Command 系の処理を `pages/` に実装すること

### 依存関係

```
# 既存
route.ts (features) → workflow.ts ← repository.ts
                          ↓
                      domains/

# 追加
route.ts (pages) → features/*/repository.ts（複数可）
                 → domains/（型参照のみ）
```

---

## ガイドライン更新について

`backend.md` の「シンプルさ優先: 参照のみの処理はワークフローを作らずrouteレイヤで実施」という原則の延長線上にある設計であり、ガイドラインの基本方針とは矛盾しない。ただし、クロスドメイン集約を行う層として `pages/` が明示的に加わるため、実装開始前に `backend.md` のディレクトリ構造図と依存関係図を更新すること。

---

## 参照

- [バックエンド実装ガイドライン](../architecture-guideline/backend.md)
- [ユースケース定義書](../spec/usecases.md)（特に 7. 分析・可視化系）
- [フロントエンドモック→API 置換対象一覧](./260312-mock-api-calls.md)
