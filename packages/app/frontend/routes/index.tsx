import { PageHeader } from '@frontend/components/layout/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { createFileRoute, Link } from '@tanstack/react-router'

const phases = [
  {
    title: '1. 取引入力と可視化',
    to: '/transactions',
  },
  {
    title: '2. 分類と計画',
    to: '/categories',
  },
  {
    title: '3. 意思決定支援',
    to: '/analytics',
  },
] as const

const IndexPage = () => {
  return (
    <div className="grid gap-4">
      <PageHeader title="家計管理を始める" />

      <Card>
        <CardContent className="grid gap-3 pt-6">
          <Link
            to="/dashboard"
            className="bg-primary text-primary-foreground inline-flex w-fit rounded-md px-4 py-2 text-sm font-medium"
          >
            ダッシュボードへ
          </Link>
          <p className="text-muted-foreground text-sm">
            取引・カテゴリ・予算・積立・イベントを順に登録すると、分析画面まで連動して確認できます。
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {phases.map((phase) => (
          <Card key={phase.title}>
            <CardHeader>
              <CardTitle className="text-base">{phase.title}</CardTitle>
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
