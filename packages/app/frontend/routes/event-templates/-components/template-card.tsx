import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import { RegisterEventButton } from './register-event-button'

export type BulkRegisterItem = {
  id: string
  categoryName: string
  name: string
  defaultAmount: number
  type: 'income' | 'expense'
}

type Props = {
  id: string
  name: string
  items: BulkRegisterItem[]
}

export const TemplateCard: React.FC<Props> = ({ id, name, items }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base truncate">{name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          取引定義 {items.length} 件
        </p>
      </CardHeader>
      <CardContent>
        {/* 取引定義プレビュー */}
        <div className="relative h-15 overflow-hidden">
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span className="truncate max-w-[80%]">
                  {item.categoryName}：{item.name}
                </span>
                <span className="truncate font-mono">
                  {item.type === 'income' ? '+' : '-'}¥
                  {item.defaultAmount.toLocaleString('ja-JP')}
                </span>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {/* テンプレートからイベント作成（UC-5.5） */}
        <RegisterEventButton id={id} size="sm" />
        <Button asChild size="sm" variant="ghost">
          <Link to="/event-templates/$id" params={{ id }}>
            詳細
            <ArrowRightIcon />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
