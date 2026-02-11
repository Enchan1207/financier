# バックエンド実装ガイドライン

## アーキテクチャ概要

本バックエンドは**関数型ドメインモデリング**（Scott Wlaschin）の原則に従います。

### 基本原則

1. **データと振る舞いの分離**: ドメインモデルは処理を持たない純粋な型定義
2. **ドメインイベント駆動**: Command → Workflow → Event の流れ
3. **副作用の分離**: 副作用はワークフローの外側に追いやり、必要な場合は依存性注入
4. **レイヤ独立性**: ワークフローはドメインモデルを除く他のレイヤに依存しない
5. **シンプルさ優先**: 参照のみの処理はワークフローを作らずrouteレイヤで実施

## ディレクトリ構造

```
backend/
├── domains/              # ドメインモデル定義
│   ├── user.ts          # Userドメイン
│   └── post.ts          # Postドメイン
├── features/            # 機能別レイヤ
│   └── <feature-name>/
│       ├── repository.ts  # 永続化層
│       ├── workflow.ts    # ビジネスロジック
│       └── route.ts       # HTTPエンドポイント
├── middlewares/         # 横断的関心事
│   ├── auth.ts         # 認証ミドルウェア
│   └── db.ts           # DB接続ミドルウェア
├── schemas/            # データベーススキーマ
│   └── posts.ts       # Postsテーブル定義
├── lib/               # 共通ユーティリティ
│   └── brand.ts       # Branded Type定義
└── index.ts           # エントリポイント
```

## レイヤ定義

### 1. Domain Layer (`domains/`)

**責務**: ドメインモデルの型定義のみ

**ルール**:

- 純粋な型定義のみ（処理を持たない）
- 他のレイヤへの依存なし
- ドメイン固有のプリミティブ値には`Brand`型を使用
- プリミティブと区別する必要がない型はプリミティブを直接使用

**例**:

```typescript
import type { Brand } from '../lib/brand'

/** ユーザID */
export type UserId = Brand<string, 'UserId'>

/** ユーザドメインモデル */
export type User = {
  readonly id: UserId
  readonly idpSubject: IdPSubject
}
```

### 2. Workflow Layer (`features/<feature>/workflow.ts`)

**責務**: ドメインイベントの処理（ビジネスロジック）

**ルール**:

- Command → Event の変換を実施
- 副作用（永続化、外部API呼び出し等）は関数として注入
- ドメイン層のみに依存
- ワークフロー固有の型（Command, Event）はここで定義

**命名規則**:

- ワークフロー: `build<Action><Entity>Workflow`
- Command: `<Action><Entity>Command`
- Event: `<Entity><Action>edEvent`

**例**:

```typescript
/** 投稿作成コマンド */
export type CreatePostCommand = {
  readonly input: {
    readonly userId: UserId
    readonly title: string
    readonly content: string
  }
}

/** 投稿作成完了イベント */
export type PostCreatedEvent = {
  readonly created: Post
}

type SavePostFn = (post: Post) => Promise<Post>

export const buildCreatePostWorkflow =
  (savePost: SavePostFn) =>
  async (command: CreatePostCommand): Promise<PostCreatedEvent> => {
    const newPost: Post = {
      id: crypto.randomUUID() as PostId,
      userId: command.input.userId,
      title: command.input.title,
      content: command.input.content,
    }

    const created = await savePost(newPost)
    return { created }
  }
```

### 3. Repository Layer (`features/<feature>/repository.ts`)

**責務**: ドメインモデルの永続化

**ルール**:

- ドメインモデルを入出力とする関数を定義
- Drizzleへのアクセスはここでのみ許可
- DBレコード ⇄ ドメインモデルの変換を担当
- カリー化により依存性注入を実現

**命名規則**:

- 取得: `find<Entity>By<Condition>`
- 保存: `save<Entity>`
- 削除: `delete<Entity>`

**例**:

```typescript
export const findPostsByUserId =
  (db: DrizzleD1Database) =>
  async (userId: UserId): Promise<Post[]> => {
    const records = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.user_id, userId))

    return records.map((record) => ({
      id: record.id as PostId,
      userId: record.user_id as UserId,
      title: record.title,
      content: record.content,
    }))
  }
```

### 4. Route Layer (`features/<feature>/route.ts`)

**責務**: HTTPエンドポイントの定義

**ルール**:

- Honoインスタンスをメソッドチェーン形式で定義（型補完のため）
- 参照のみの処理はここで直接実施（ワークフローを作らない）
- 更新系の処理はワークフローを呼び出す
- バリデーションはzodで実施

**例**:

```typescript
const postsApp = new Hono<{ Variables: Variables }>()
  .get('/', async (c) => {
    const userId = c.get('jwtPayload').sub
    const db = c.get('drizzle')
    const posts = await findPostsByUserId(db)(userId)
    return c.json({ items: posts })
  })
  .post(
    '/',
    zValidator('json', z.object({ /* ... */ })),
    async (c) => {
      const event = await buildCreatePostWorkflow(savePost(db))(command)
      return c.json(event.created, 201)
    },
  )

export default postsApp
```

### 5. Schema Layer (`schemas/`)

**責務**: データベーステーブル定義

**ルール**:

- Drizzle ORMのスキーマ定義のみ
- 機能ごとにファイルを分割
- エクスポートするのはテーブル定義のみ

**例**:

```typescript
/** Posts テーブル定義 */
export const postsTable = sqliteTable(
  'posts',
  {
    id: text().notNull(),
    user_id: text().notNull(),
    title: text().notNull(),
    content: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id, table.user_id] })],
)
```

### 6. Entry Point (`index.ts`)

**責務**: 各featureのルートを統合

**ルール**:

- Honoインスタンスの作成
- 共通ミドルウェアの適用
- 各featureのrouteを`.route()`で統合
- `AppType`のエクスポート（フロントエンド連携用）

**例**:

```typescript
const app = new Hono()
  .basePath('/api')
  .use(jwkMiddleware)
  .use(dbMiddleware)
  .route('/posts', postsApp)

export default app
export type AppType = typeof app
```

## 命名規則

### ファイル・ディレクトリ

- モジュール: `kebab-case`
- 機能ディレクトリ: 複数形（例: `posts`, `users`）

### 変数・関数

- 変数・関数: `lowerCamelCase`
- クラス・コンポーネント: `PascalCase`
- 定数: `PascalCase`

### 型

- ドメインモデル: `PascalCase`
- Command: `<Action><Entity>Command`
- Event: `<Entity><Action>edEvent`
- Branded Type: `<Entity><Property>` (例: `UserId`, `PostId`)

## 型の使用方針

### Branded Type

ドメイン固有のプリミティブ値に使用：

```typescript
export type UserId = Brand<string, 'UserId'>
export type PostId = Brand<string, 'PostId'>
```

### プリミティブ型

プリミティブと区別する必要がない場合は直接使用：

```typescript
// ❌ 不要な型エイリアス
export type PostTitle = string

// ✅ プリミティブを直接使用
export type Post = {
  readonly title: string
  readonly content: string
}
```

## JSDoc規約

### 1行で済む場合

```typescript
/** ユーザID */
export type UserId = Brand<string, 'UserId'>
```

### 複数行が必要な場合

```typescript
/**
 * 投稿作成ワークフロー
 * @param savePost 永続化関数
 * @returns ワークフロー実行関数
 */
export const buildCreatePostWorkflow = /* ... */
```

## 依存関係ルール

```
route.ts
  ↓ 呼び出し
workflow.ts ← repository.ts (注入)
  ↓ 使用
domains/
```

- **Route**: Workflow, Repositoryを呼び出す
- **Workflow**: Domainのみに依存し、Repositoryは注入される
- **Repository**: Domainに依存
- **Domain**: 他に依存しない

## 実装チェックリスト

新機能追加時:

- [ ] ドメインモデルを`domains/`に定義
- [ ] テーブル定義を`schemas/`に作成
- [ ] リポジトリ関数を`features/<feature>/repository.ts`に実装
- [ ] 更新系の場合、ワークフローを`features/<feature>/workflow.ts`に実装
- [ ] ルートを`features/<feature>/route.ts`にメソッドチェーンで定義
- [ ] `index.ts`で新しいrouteを統合
- [ ] `drizzle.config.ts`がschemaを認識していることを確認

## 禁止事項

1. ❌ ドメインモデルにメソッドを持たせる
2. ❌ ワークフローから直接DBアクセス
3. ❌ ルート層にビジネスロジックを記述
4. ❌ スキーマ定義をrepository内に混在
5. ❌ 不要な型エイリアス（プリミティブのラップ）
6. ❌ ルート定義で変数に代入してからメソッド呼び出し（型補完が効かない）
