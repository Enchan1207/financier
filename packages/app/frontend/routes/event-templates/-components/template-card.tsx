import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'

import type { BulkRegisterItem } from './bulk-register-dialog'
import { BulkRegisterDialog } from './bulk-register-dialog'

const PREVIEW_LIMIT = 3

type Props = {
  id: string
  name: string
  items: BulkRegisterItem[]
}

export const TemplateCard: React.FC<Props> = ({ id, name, items }) => {
  const previewItems = items.slice(0, PREVIEW_LIMIT)
  const remaining = items.length - PREVIEW_LIMIT

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          取引定義 {items.length} 件
        </p>
      </CardHeader>
      <CardContent>
        {/* 取引定義プレビュー */}
        <ul className="space-y-1">
          {previewItems.map((item) => (
            <li
              key={item.id}
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>
                {item.categoryName}：{item.name}
              </span>
              <span className="font-mono">
                {item.type === 'income' ? '+' : '-'}¥
                {item.defaultAmount.toLocaleString('ja-JP')}
              </span>
            </li>
          ))}
          {remaining > 0 && (
            <li className="text-xs text-muted-foreground">他 {remaining} 件</li>
          )}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {/* テンプレートからイベント作成（UC-5.5） */}
        <BulkRegisterDialog
          templateName={name}
          items={items}
          trigger={<Button size="sm">イベントを作成</Button>}
        />
        <Button asChild size="sm" variant="ghost">
          <Link to="/event-templates/$id" params={{ id }}>
            詳細を見る
            <ChevronRightIcon />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
