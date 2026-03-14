import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'

import type { BulkRegisterItem } from './-components/template-card'
import { TemplateCard } from './-components/template-card'

type TemplateSummary = {
  id: string
  name: string
  items: BulkRegisterItem[]
}

// モックデータ：本番ではAPIから /event-templates を取得する
const TEMPLATES: TemplateSummary[] = [
  {
    id: 'tmpl-1',
    name: 'ライブ遠征',
    items: [
      {
        id: 'i-1',
        categoryName: '交通費',
        name: '新幹線代',
        defaultAmount: 8000,
        type: 'expense',
      },
      {
        id: 'i-2',
        categoryName: '娯楽・グッズ',
        name: 'ライブグッズ',
        defaultAmount: 10000,
        type: 'expense',
      },
      {
        id: 'i-3',
        categoryName: '外食',
        name: '遠征ご飯',
        defaultAmount: 3000,
        type: 'expense',
      },
    ],
  },
  {
    id: 'tmpl-2',
    name: 'グッズ購入',
    items: [
      {
        id: 'i-4',
        categoryName: '娯楽・グッズ',
        name: 'グッズ購入',
        defaultAmount: 5000,
        type: 'expense',
      },
      {
        id: 'i-5',
        categoryName: '交通費',
        name: '交通費',
        defaultAmount: 1000,
        type: 'expense',
      },
    ],
  },
  {
    id: 'tmpl-3',
    name: 'イベント参加（日帰り）',
    items: [
      {
        id: 'i-6',
        categoryName: '交通費',
        name: '電車代',
        defaultAmount: 2000,
        type: 'expense',
      },
      {
        id: 'i-7',
        categoryName: '娯楽・グッズ',
        name: 'チケット',
        defaultAmount: 8000,
        type: 'expense',
      },
      {
        id: 'i-8',
        categoryName: '外食',
        name: '食事',
        defaultAmount: 1500,
        type: 'expense',
      },
    ],
  },
  {
    id: 'tmpl-4',
    name: '給料日',
    items: [
      {
        id: 'i-9',
        categoryName: '給与・賞与',
        name: '給与',
        defaultAmount: 250000,
        type: 'income',
      },
      {
        id: 'i-10',
        categoryName: '給与・賞与',
        name: 'RW手当',
        defaultAmount: 5000,
        type: 'income',
      },
      {
        id: 'i-11',
        categoryName: '社会保険料',
        name: '厚生年金',
        defaultAmount: 15000,
        type: 'expense',
      },
      {
        id: 'i-12',
        categoryName: '税金',
        name: '住民税',
        defaultAmount: 8000,
        type: 'expense',
      },
      {
        id: 'i-13',
        categoryName: '税金',
        name: '市県民税',
        defaultAmount: 5000,
        type: 'expense',
      },
    ],
  },
]

const EventTemplatesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テンプレート</h1>
        <Button asChild size="sm">
          <Link to="/event-templates/new">
            <PlusIcon />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((tmpl) => (
          <TemplateCard
            key={tmpl.id}
            id={tmpl.id}
            name={tmpl.name}
            items={tmpl.items}
          />
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/')({
  component: EventTemplatesPage,
})
