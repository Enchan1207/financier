import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'

import type { BulkRegisterItem } from './-components/bulk-register-dialog'
import { BulkRegisterDialog } from './-components/bulk-register-dialog'

type TemplateSummary = {
  id: string
  name: string
  items: BulkRegisterItem[]
}

// モックデータ：本番ではAPIから /event-templates を取得する
const TEMPLATES: TemplateSummary[] = [
  {
    id: 'tmpl-1',
    name: 'ライブ遠征セット',
    items: [
      {
        id: 'i-1',
        categoryName: '交通費',
        name: '新幹線代',
        defaultAmount: 8000,
      },
      {
        id: 'i-2',
        categoryName: '娯楽・グッズ',
        name: 'ライブグッズ',
        defaultAmount: 10000,
      },
      {
        id: 'i-3',
        categoryName: '外食',
        name: '遠征ご飯',
        defaultAmount: 3000,
      },
    ],
  },
  {
    id: 'tmpl-2',
    name: 'グッズ購入セット',
    items: [
      {
        id: 'i-4',
        categoryName: '娯楽・グッズ',
        name: 'グッズ購入',
        defaultAmount: 5000,
      },
      {
        id: 'i-5',
        categoryName: '交通費',
        name: '交通費',
        defaultAmount: 1000,
      },
    ],
  },
  {
    id: 'tmpl-3',
    name: 'イベント参加セット（日帰り）',
    items: [
      {
        id: 'i-6',
        categoryName: '交通費',
        name: '電車代',
        defaultAmount: 2000,
      },
      {
        id: 'i-7',
        categoryName: '娯楽・グッズ',
        name: 'チケット',
        defaultAmount: 8000,
      },
      { id: 'i-8', categoryName: '外食', name: '食事', defaultAmount: 1500 },
    ],
  },
]

const EventTemplatesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">イベントテンプレート</h1>
        <Button asChild size="sm">
          <Link to="/event-templates/new">
            <PlusIcon />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((tmpl) => (
          <Card key={tmpl.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{tmpl.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    取引定義 {tmpl.items.length} 件
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  テンプレート
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 取引定義プレビュー */}
              <ul className="space-y-1">
                {tmpl.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>
                      {item.categoryName}：{item.name}
                    </span>
                    <span className="font-mono">
                      ¥{item.defaultAmount.toLocaleString('ja-JP')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link to="/event-templates/$id" params={{ id: tmpl.id }}>
                    詳細
                  </Link>
                </Button>
                {/* テンプレートからイベント作成（UC-5.5） */}
                <BulkRegisterDialog
                  templateName={tmpl.name}
                  items={tmpl.items}
                  trigger={<Button size="sm">イベント作成</Button>}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/')({
  component: EventTemplatesPage,
})
