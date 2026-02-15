import { PageHeader } from '@frontend/components/layout/page-header'
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
      <PageHeader
        title="家計管理を始める"
        description="収支の記録から予算管理、分析までを一つの画面構成で確認できます。"
      />

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
