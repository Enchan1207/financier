import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { createFileRoute, Link } from '@tanstack/react-router'

const phases = [
  {
    title: '1. 取引入力と可視化',
    description:
      '日々の収支記録（収入/支出、カテゴリ、未来日、イベント紐付け）を先に固めます。',
    to: '/transactions',
  },
  {
    title: '2. 分類と計画',
    description: 'カテゴリ・予算・積立を整備し、年度単位の差分を把握します。',
    to: '/categories',
  },
  {
    title: '3. 意思決定支援',
    description: 'イベント集計と分析画面で、財政体力と将来判断を支援します。',
    to: '/analytics',
  },
] as const

const IndexPage = () => {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>モック実装の進め方</CardTitle>
          <CardDescription>
            仕様に沿って、根幹機能から順に画面遷移と基本UIを確認できる構成にしています。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Link
            to="/dashboard"
            className="bg-primary text-primary-foreground inline-flex w-fit rounded-md px-4 py-2 text-sm font-medium"
          >
            ダッシュボードへ
          </Link>
          <p className="text-muted-foreground text-sm">
            現在はバックエンド接続を行わず、全データを hooks
            内のダミー実装で返します。
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {phases.map((phase) => (
          <Card key={phase.title}>
            <CardHeader>
              <CardTitle className="text-base">{phase.title}</CardTitle>
              <CardDescription>{phase.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={phase.to} className="text-primary text-sm underline">
                画面を開く
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})
