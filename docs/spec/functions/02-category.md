# 3. カテゴリ（Category）

- 索引: [機能仕様書](../functions.md)
- 関連要件: [要求仕様書](../requirements.md)
- 関連ユースケース: [ユースケース定義書](../usecases.md)

---

## 3.1 定義

トランザクションを分類するためのラベル。年度に依存せずシステム全体で共通。

## 3.2 属性

| 属性名 | 型                | 必須 | 説明                        |
| ------ | ----------------- | ---- | --------------------------- |
| id     | ID                | ○    | 一意識別子                  |
| name   | 文字列            | ○    | カテゴリ名                  |
| type   | income / expense  | ○    | カテゴリ種別                |
| status | active / archived | ○    | 利用状態（有効/削除済み）   |
| icon   | CategoryIcon      | ○    | 表示アイコン識別子          |
| color  | CategoryColor     | ○    | 表示色識別子                |

## 3.3 仕様

- 階層構造は持たない（フラット）
- ユーザによる追加・編集が可能
- 編集（名称変更）は `status=active` のカテゴリのみ可能
- カテゴリ名は空文字不可、前後空白除去後に一意
- `status` は `active` / `archived` を取る
- `archived` のカテゴリは新規トランザクション作成・編集時の選択肢に表示しない
- `archived` のカテゴリへの新規指定・変更を伴うトランザクション登録・更新は業務ルール違反として拒否する
- 既存トランザクションが `archived` のカテゴリを参照している場合、カテゴリ変更なしの更新は許可する
- 既存トランザクション・予算の参照先としては保持する（履歴保全）
- カテゴリ削除は物理削除とし、トランザクション・予算・積立定義の参照がすべて 0 件の場合のみ許可する
- カテゴリ種別（income / expense）は作成時に決定し、変更不可
- 支出カテゴリ作成時には「積立として作成する」を選択できる
- 積立として作成するかどうかはカテゴリ作成時にのみ決定でき、作成後は変更不可
- カテゴリ自体にはメタデータを持たせない（積立情報等は積立定義エンティティが保持）
- 積立定義が紐づくカテゴリは UI 上「積立カテゴリ」として扱う
- 積立カテゴリの削除時に積立専用の追加確認・追加警告は行わない

### アイコン・色

- `icon` と `color` はカテゴリの視覚的識別性を高めるための属性であり、UI 表示にのみ利用する
- 作成時に選択必須とする（デフォルト値は選択させ、空のまま保存を許可しない）
- 作成後も編集可能（種別とは異なり変更制限なし）
- `status=archived` のカテゴリでも `icon` / `color` の値は保持する（参照中のトランザクション等で引き続き表示に使用）

#### CategoryIcon（アイコン識別子）

識別子は Lucide React のコンポーネント名を snake_case に変換したもの。
使用可能な識別子は以下の固定セットに限定する。

| 識別子            | Lucide コンポーネント | 用途例               |
| ----------------- | --------------------- | -------------------- |
| `tag`             | `Tag`                 | 汎用・その他         |
| `wallet`          | `Wallet`              | 財布・支出一般       |
| `trending_up`     | `TrendingUp`          | 収入・増加           |
| `trending_down`   | `TrendingDown`        | 支出・減少           |
| `piggy_bank`      | `PiggyBank`           | 積立・貯金           |
| `house`           | `House`               | 住居・家賃           |
| `utensils`        | `Utensils`            | 食費                 |
| `shopping_cart`   | `ShoppingCart`        | 買い物               |
| `car`             | `Car`                 | 車・交通費           |
| `bus`             | `Bus`                 | 公共交通             |
| `plane`           | `Plane`               | 旅行                 |
| `heart_pulse`     | `HeartPulse`          | 医療・健康           |
| `graduation_cap`  | `GraduationCap`       | 教育                 |
| `briefcase`       | `Briefcase`           | 仕事・副業           |
| `music`           | `Music`               | 娯楽・音楽           |
| `zap`             | `Zap`                 | 光熱費               |
| `wifi`            | `Wifi`                | 通信費               |
| `shirt`           | `Shirt`               | 衣類                 |
| `dumbbell`        | `Dumbbell`            | フィットネス         |
| `coffee`          | `Coffee`              | カフェ・外食         |
| `gift`            | `Gift`                | 贈り物               |
| `book`            | `Book`                | 書籍・メディア       |
| `baby`            | `Baby`                | 育児                 |
| `plus`            | `Plus`                | その他（予備）       |

#### CategoryColor（色識別子）

使用可能な識別子は以下の 8 色に限定する。
各識別子は TailwindCSS のカラー名（`-500` 相当）に対応させる。

| 識別子   | 対応 Tailwind カラー |
| -------- | -------------------- |
| `red`    | `red-500`            |
| `orange` | `orange-500`         |
| `yellow` | `yellow-500`         |
| `green`  | `green-500`          |
| `teal`   | `teal-500`           |
| `blue`   | `blue-500`           |
| `purple` | `purple-500`         |
| `pink`   | `pink-500`           |

---
