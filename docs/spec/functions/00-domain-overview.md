# 1. ドメインモデル概要

- 索引: [機能仕様書](../functions.md)
- 関連要件: [要求仕様書](../requirements.md)
- 関連ユースケース: [ユースケース定義書](../usecases.md)

---

本システムは以下のエンティティ・概念で構成される。

```
Transaction ──── Category ──── SavingDefinition ──── SavingWithdrawal
    │                │
    │                └──── Budget ──── FiscalYear
    │                    （年度×カテゴリ）
    ├──── Event
    │
    ╰╌╌╌╌ FiscalYear（transactionDate により帰属。直接参照は持たない）

EventTemplate（独立）

内部残高（派生値）
```

---
