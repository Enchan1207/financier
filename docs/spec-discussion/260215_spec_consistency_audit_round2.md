# 260215 仕様整合性監査（docs/spec）追加指摘

## 対象

- `docs/spec/requirements.md`
- `docs/spec/functions.md`
- `docs/spec/usecases.md`

## 監査サマリ

- 重大な不整合: 1件
- 中程度の不整合: 2件
- 未定義/曖昧: 0件

## 指摘一覧

### 1. Category物理削除条件が参照整合性を壊しうる（重大）

**根拠**:

- `docs/spec/functions.md:89` で「既存トランザクション・予算の参照先として保持」と定義
- `docs/spec/functions.md:90` でカテゴリ削除許可条件を「トランザクション参照 0 件のみ」と定義
- `docs/spec/functions.md:207` で `SavingDefinition.categoryId` は必須
- `docs/spec/usecases.md:168` でも同じ削除条件（トランザクション参照 0 件のみ）

**問題**:

- トランザクション参照が 0 件でも、予算参照や積立定義参照が残るケースを排除していない。
- この状態でカテゴリを物理削除すると、参照整合性の破壊、または想定外の連鎖削除が発生する。

**修正方針案**:

- カテゴリ物理削除条件を「トランザクション参照 0 件」から「トランザクション・予算・積立定義の参照がすべて 0 件」に拡張する。
- もしくは、カテゴリは原則物理削除せず `archived` のみを正式な退役手段とする。

**対応状況（2026-02-15）**:

- 対応済み。
- 物理削除条件を「トランザクション・予算・積立定義の参照がすべて 0 件」に更新。
- 反映先: `docs/spec/functions.md`, `docs/spec/usecases.md`

### 2. UC-3.1 に closed年度の更新禁止条件が明記されていない（中）

**根拠**:

- `docs/spec/functions.md:124` で closed 年度の予算は一切変更不可と定義
- `docs/spec/usecases.md:206` と `docs/spec/usecases.md:233` では UC-3.2/3.3 に active 条件を明記
- `docs/spec/usecases.md:180` の UC-3.1 には同等の事前条件がない

**問題**:

- UC-3.1 だけ読むと、closed 年度への予算作成・更新可否を誤読できる。
- 予算系UC間で年度状態の制約レベルが揃っていない。

**修正方針案**:

- UC-3.1 にも UC-3.2/3.3 と同等の事前条件（active または未生成年度は active 相当）を追記する。

**対応状況（2026-02-15）**:

- 対応済み。
- UC-3.1 に事前条件（active、未生成年度は active 相当）を追記。
- 反映先: `docs/spec/usecases.md`

### 3. archivedカテゴリと取引編集可否のルールが衝突する（中）

**根拠**:

- `docs/spec/usecases.md:74` で UC-1.3 は「対象年度が closed でなければ編集可能」
- `docs/spec/usecases.md:166`-`docs/spec/usecases.md:168` で archived カテゴリは編集時の選択肢非表示かつ更新拒否
- `docs/spec/functions.md:87`-`docs/spec/functions.md:89` で同様のルール

**問題**:

- active 年度の既存トランザクションが archived カテゴリを参照している場合、
  - 「年度条件上は編集可能」
  - 「カテゴリ条件上は更新拒否」
 となり、部分更新（メモ修正など）の可否が仕様上判定できない。

**修正方針案**:

- 「archived カテゴリへの**新規指定/変更**を禁止」と定義を狭め、既存参照を維持したままの更新可否を明示する。
- 併せて UC-1.3 の事前条件にカテゴリ状態の扱い（既存参照は許容するか）を追記する。

**対応状況（2026-02-15）**:

- 対応済み。
- 「archived カテゴリへの新規指定/変更を拒否」「既存参照トランザクションのカテゴリ変更なし更新は許可」を明記。
- UC-1.3 にカテゴリ状態の事前条件を追記。
- 反映先: `docs/spec/functions.md`, `docs/spec/usecases.md`

## 補足

- 本監査は 2026-02-15 時点の `docs/spec` 記述整合性のみを対象とする。
- 備考（UC-6.1 年度締め）: 現行仕様では「`FiscalYear.status` の `active -> closed` 遷移」と「次年度 `FiscalYear` の生成（必要時）」が中核であり、当該年度の全トランザクション/全予算を一括更新する前提ではないため、大規模なDBトランザクションは必須ではない。
