# 260214 仕様整合性監査（docs/spec）再確認

## 対象

- `docs/spec/requirements.md`
- `docs/spec/functions.md`
- `docs/spec/usecases.md`

## 再確認結果サマリ

- 重大な不整合: 0件
- 中程度の不整合/未定義: 0件
- 前回指摘 4件はすべて解消済み

## 解消確認一覧

### 1. 積立状態と拠出可否の矛盾（重大）

**確認結果**: 解消済み

**確認根拠**:

- `docs/spec/functions.md` の `SavingDefinition` から `status` 属性が削除され、積立状態遷移の概念が廃止された
- `docs/spec/functions.md` から積立の状態遷移節（旧 6.8）が削除され、年度との関係節に整理された
- `docs/spec/usecases.md` から UC-4.5（積立のアーカイブ）が削除され、積立ユースケースは状態非依存の記述に統一された

### 2. 単一ユーザ前提と管理者解除ユースケースの矛盾（重大）

**確認結果**: 解消済み

**確認根拠**:

- `docs/spec/usecases.md` から UC-6.2（管理者操作による解除）が削除済み
- 年度締め後の扱いは `closed` の不変条件に統一され、管理者ロール依存の記述は存在しない

### 3. 取り崩し日の入力責務未定義（中）

**確認結果**: 解消済み

**確認根拠**:

- `docs/spec/functions.md:260` で `withdrawalDate` は実行時サーバ日付を自動設定と明記
- `docs/spec/usecases.md:325` で UC-4.4 の入力責務に同内容を反映

### 4. 未来年度大量登録と年度ライフサイクルの未整合（中）

**確認結果**: 解消済み

**確認根拠**:

- `docs/spec/usecases.md:16` で取引登録前提を「closed でない（未生成年度は active 相当）」に変更
- `docs/spec/usecases.md:53` で UC-1.2 に年度解決ルールを追加
- `docs/spec/functions.md:132` に「4.7 年度解決と生成ポリシー」を追加し、未生成年度の扱いと FiscalYear 遅延生成契機を明記

## 補足

- 本再確認は、`2026-02-14` 時点の `docs/spec` 記述整合性のみを対象とする。
