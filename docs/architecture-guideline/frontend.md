# フロントエンド実装ガイドライン

## アーキテクチャ概要

- TanStack Routerによるファイルベースルーティング
  - 常に `/path/to/route/index.tsx` を採用 `/path/to/route.tsx` の形式は認めない
- バックエンドとの通信は、 TanStack Query を経由し、Hono client を使用
- 全体で共通化できるコンポーネントのみ `frontend/components` へ配置し、
  それ以外のページ固有コンポーネントはページと同じディレクトリに `-components` ディレクトリを作成して配置する
- モックアップ実装時はルートごとにサンプルデータを作成
- lib/ ディレクトリにはモジュールを追加しない
- バックエンドとの通信は "repository" (= ドメインモデルのやり取り)であるため、呼び出すルートと同じディレクトリに `-repositories` ディレクトリを作成して配置する
  - 複数ルートから呼び出されるものに限り `frontend/repositories` に配置する
