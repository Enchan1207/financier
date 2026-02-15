# 260215 仕様整合性監査（docs/spec）第4ラウンド

## 対象

- `docs/spec/requirements.md`
- `docs/spec/functions.md`
- `docs/spec/usecases.md`

## 監査サマリ

- 重大な不整合: 1件
- 中程度の不整合/未定義: 3件
- 軽微な不整合: 0件

## 指摘一覧

### 1. UC-1.3 が「編集後の年度」に対する closed 判定を定義しておらず、締め済み年度へ更新を書き込める解釈になる（重大）

**根拠**:

- `docs/spec/usecases.md:76` で UC-1.3 の事前条件は「対象トランザクションが属する年度が closed でない」
- `docs/spec/usecases.md:83` で UC-1.3 は `transactionDate` の編集を許可
- `docs/spec/functions.md:129` で closed 年度のトランザクションは一切変更不可

**問題**:

- 現在は active 年度に属する取引を編集し、`transactionDate` を closed 年度へ変更するケースを文書上で禁止しきれていない。
- その結果、「締め済み年度へ新しい内容を書き込めない」という年度ロックの中核ルールを、更新操作で実質的に回避できる読解余地が残る。

**修正方針案**:

- UC-1.3 に「更新後 `transactionDate` で解決される年度も closed でないこと」を事前条件として追加する。
- 併せて例外フローに「更新後年度が closed の場合は保存拒否」を追加する。
- `docs/spec/functions.md` の Transaction 仕様にも「更新時は更新後日付で年度可否判定する」旨を追記する。

**対応状況（2026-02-15）**:

- PO確認不要のため修正方針を採用。
- `docs/spec/usecases.md` の UC-1.3 に、更新後年度の closed 判定（事前条件・例外フロー）を追記。
- `docs/spec/functions.md` の Transaction 仕様に、更新後 `transactionDate` 基準での保存拒否条件を追記。

### 2. テンプレート一括登録（UC-5.5）が積立拠出の日付制約（未来日不可）を継承しておらず、積立ルールと衝突する（中）

**根拠**:

- `docs/spec/requirements.md:68` で積立拠出日は当日/過去日のみ許可
- `docs/spec/functions.md:248` でも同制約を再定義
- `docs/spec/usecases.md:317` と `docs/spec/usecases.md:331` で UC-4.2 は未来日拠出を拒否
- `docs/spec/usecases.md:455` の UC-5.5 は UC-1.1 / UC-1.2 の条件継承のみを明記（UC-4.2 の制約は未継承）
- `docs/spec/usecases.md:53` の UC-1.2 は未来日取引を許可

**問題**:

- テンプレートに積立カテゴリが含まれる場合、UC-5.5 の記述だけでは未来日一括登録を拒否すべきか判断できない。
- 単体登録（UC-4.2）と一括登録（UC-5.5）で積立拠出ルールが分岐する実装リスクがある。

**修正方針案**:

- UC-5.5 に「積立カテゴリ行は UC-4.2 の日付制約を適用する」を追記する。
- 代替として「テンプレートでは積立カテゴリを使用不可」と明記する方針でも可。
- いずれの方針でも、違反時の扱い（全件失敗）を保存原子性の節に明記する。

**対応状況（2026-02-15）**:

- PO判断により「テンプレートでは積立カテゴリを使用不可」を採用。
- `docs/spec/usecases.md` の UC-5.4 / UC-5.5 に、積立カテゴリ除外条件を追記。
- `docs/spec/functions.md` の EventTemplate 仕様に同条件を追記。

### 3. `EventTemplate.defaultTransactions` の項目定義が不足しており、`Transaction.type` の決定規則が未定義（中）

**根拠**:

- `docs/spec/functions.md:39` で `Transaction.type` は必須属性
- `docs/spec/functions.md:334`-`docs/spec/functions.md:338` では `defaultTransactions` を「配列」とのみ定義し、要素スキーマ未記載
- `docs/spec/usecases.md:441` の UC-5.4 はテンプレート定義を「カテゴリ・金額のセット」と記載
- `docs/spec/usecases.md:454` の UC-5.5 は取引種別とカテゴリ種別の一致チェックを要求

**問題**:

- テンプレート起点で生成される各取引の `Transaction.type` を、入力値として持つのか `Category.type` から導出するのかが不明。
- 結果として、UC-5.5 の種別一致チェックの実装方式が定まらない（必須バリデーションなのか、構造上常に成立するのかが不明）。

**修正方針案**:

- `defaultTransactions` 要素のスキーマを明示する（例: `categoryId`, `type`, `amount`, `memo`）。
- もしくは「`type` は保存時に `Category.type` から決定する」と統一し、UC-5.5 の一致チェック文言を「カテゴリ種別に従って `Transaction.type` を決定する」へ置換する。

**対応状況（2026-02-15）**:

- PO判断により「`type` は保存時に `Category.type` から決定する」を採用。
- `docs/spec/functions.md` に `TemplateTransaction` の要素スキーマを追加し、`type` 非保持・カテゴリ由来決定を明記。
- `docs/spec/usecases.md` の UC-5.5 へ、`Transaction.type` の自動決定ルールを追記。

### 4. 「入力を強制停止しない」の適用範囲が広すぎ、ドメイン制約による拒否ルールと読解上矛盾する（中）

**根拠**:

- `docs/spec/requirements.md:103`-`docs/spec/requirements.md:107` で「入力を強制停止しない」と記載
- 一方で、`docs/spec/usecases.md:39`, `docs/spec/usecases.md:59`, `docs/spec/usecases.md:93`, `docs/spec/usecases.md:331` では保存拒否/操作拒否を明示

**問題**:

- 現行文言は「システムは入力拒否しない」という包括ルールに読めるため、整合性制約（closed 年度、種別不一致、未来日積立拠出など）による拒否と衝突して見える。
- 実装者が「警告中心設計」と「不変条件違反の拒否」の境界を誤解する余地がある。

**修正方針案**:

- `requirements.md` の制約思想を次のように限定記述する。
  - 予算超過・積立不足など「財務状態の良否」は警告のみ（入力拒否しない）
  - 参照整合性・会計境界・型整合性など「ドメイン不変条件」は拒否する

**対応状況（2026-02-15）**:

- PO確認不要のため修正方針を採用。
- `docs/spec/requirements.md` の制約思想を、「財務状態の良否は警告中心」「ドメイン不変条件違反は拒否」へ明確化。
- これにより、UCで明記している保存拒否ルールとの読解上の衝突を解消。

## 補足

- 本監査は `2026-02-15` 時点の `docs/spec` 記述整合性のみを対象とする。
