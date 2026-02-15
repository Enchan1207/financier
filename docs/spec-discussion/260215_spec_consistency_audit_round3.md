# 260215 仕様整合性監査（docs/spec）第3ラウンド

## 対象

- `docs/spec/requirements.md`
- `docs/spec/functions.md`
- `docs/spec/usecases.md`

## 監査サマリ

- 重大な不整合: 1件
- 中程度の不整合/未定義: 2件
- 軽微な不整合: 0件

## 指摘一覧

### 1. 積立残高における未来日拠出の扱いが、内部残高・予算実績ルールと不整合（重大・解消済み）

**根拠**:

- `docs/spec/requirements.md:60` で未来日トランザクションは予算実績に含めないと定義
- `docs/spec/requirements.md:84` で未来日トランザクションは内部残高に含めないと定義
- `docs/spec/functions.md:51`-`docs/spec/functions.md:52` で同内容を再定義
- `docs/spec/functions.md:236`-`docs/spec/functions.md:242` の積立残高算出式には未来日除外条件がない
- `docs/spec/usecases.md:313` で積立拠出は UC-1.1（未来日入力可）と同じ操作
- `docs/spec/usecases.md:317`-`docs/spec/usecases.md:319` で積立拠出後に積立残高増加・内部残高減少を定義

**問題**:

- 未来日で積立拠出を登録した場合、
  - UC-1.2 の原則では内部残高・予算実績は当日到達まで不変
  - 一方で積立残高は即時増加すると読める
- その結果、同一トランザクションの反映タイミングが指標ごとに分離し、財務指標の整合が崩れる。

**修正方針案**:

- いずれかに統一する。
  1. 積立残高も `transactionDate <= today` の拠出のみを算入する
  2. UC-4.2 を当日/過去日のみ許可に変更し、未来日拠出を禁止する
- 併せて `functions.md`（6.4, 6.5）と `usecases.md`（UC-4.2）の反映タイミングを同一表現で明記する。

**対応結果（2026-02-15）**:

- 方針を「2. UC-4.2 を当日/過去日のみ許可に変更し、未来日拠出を禁止する」に決定
- `docs/spec/requirements.md` に積立拠出の日付制約（未来日不可）を追記
- `docs/spec/functions.md` の 6.4 に `transactionDate <= today` 条件を明記し、6.5 に未来日拒否ルールを追記
- `docs/spec/usecases.md` の UC-4.2 に事前条件・例外フロー（未来日指定時は拒否）を追記
- これにより、積立残高・内部残高・予算実績の反映タイミング不整合は解消


### 2. `Transaction.type` と `Category.type` の一致制約が未定義（中）

**根拠**:

- `docs/spec/functions.md:39` に `Transaction.type` が存在
- `docs/spec/functions.md:80` に `Category.type` が存在
- `docs/spec/usecases.md:21` で取引種別選択、`docs/spec/usecases.md:24` でカテゴリ選択を別操作として定義
- 3文書とも「収入取引は収入カテゴリのみ、支出取引は支出カテゴリのみ」の必須制約を明文化していない

**問題**:

- 実装によっては「収入取引 × 支出カテゴリ」等の不正組み合わせを保存できる。
- 集計（カテゴリ別分析、予算差分、積立算出）の意味が崩れるリスクがある。

**修正方針案**:

- ドメイン不変条件として以下を明記する。
  - `Transaction.type = income -> Category.type = income`
  - `Transaction.type = expense -> Category.type = expense`
- UC-1.1 / UC-1.3 / UC-5.5 にも同制約（および違反時エラー）を追記する。

**対応状況（2026-02-15）**:

- 修正方針案を採用し、以下へ反映済み。
  - `docs/spec/requirements.md`（ドメイン基本概念に種別一致の不変条件を追記）
  - `docs/spec/functions.md`（Transaction仕様に `Transaction.type` と `Category.type` の一致制約を追記）
  - `docs/spec/usecases.md`（UC-1.1 / UC-1.3 / UC-5.5 に一致制約と違反時エラーを追記）

### 3. UC-5.5（テンプレート一括登録）が取引登録の事前条件継承を明記していない（中）

**根拠**:

- `docs/spec/usecases.md:16`-`docs/spec/usecases.md:17` では UC-1.1 の事前条件として「closed年度不可」「activeカテゴリのみ」を定義
- `docs/spec/usecases.md:56`-`docs/spec/usecases.md:57` では UC-1.2 で未生成年度/closed年度の扱いを定義
- `docs/spec/usecases.md:436`-`docs/spec/usecases.md:453` の UC-5.5 には、同等の事前条件・拒否条件が記載されていない

**問題**:

- UC-5.5 実装時に、単一登録と異なるバリデーションを適用してしまう余地がある。
- 具体的には closed年度向け一括登録、`archived` カテゴリを含むテンプレート適用などの挙動が文書だけでは確定しない。

**修正方針案**:

- UC-5.5 の事前条件に「各トランザクションは UC-1.1/UC-1.2 の登録条件を満たすこと」を追記する。
- 併せて「一括内に不正行が含まれる場合の扱い（全件失敗 / 行単位スキップ）」を定義し、保存原子性を明記する。

**対応状況（2026-02-15）**:

- `docs/spec/usecases.md` の UC-5.5 に、UC-1.1 / UC-1.2 の登録条件継承（closed 年度不可、未生成年度は active 相当、`status=active` カテゴリのみ）を追記した。
- 一括登録の保存原子性を追加し、不正行を 1 件でも含む場合はイベント・トランザクションを全件未保存（全件失敗）と明記した。

## 補足

- 本監査は `2026-02-15` 時点の `docs/spec` 記述整合性のみを対象とする。
