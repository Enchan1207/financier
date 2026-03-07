import { Button } from '@frontend/components/ui/button'
import { Field } from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import { Separator } from '@frontend/components/ui/separator'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

type SavingType = 'goal' | 'free'

const SavingNewPage: React.FC = () => {
  const navigate = useNavigate()
  const [categoryName, setCategoryName] = useState('')
  const [savingType, setSavingType] = useState<SavingType>('goal')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  const isValid =
    categoryName.trim().length > 0 &&
    (savingType === 'free' || parseInt(targetAmount, 10) > 0)

  const handleSave = () => {
    // モック：実際にはAPIを呼び出してカテゴリと積立定義を同時に作成する
    void navigate({ to: '/savings' })
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/savings">
            <ArrowLeftIcon />
            積立一覧へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">積立新規作成</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="space-y-1.5">
          <Label htmlFor="category-name">カテゴリ名 *</Label>
          <Input
            id="category-name"
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value)
            }}
            placeholder="例：旅行積立"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-sm font-medium">積立設定</h2>

          <div className="space-y-1.5">
            <Label>積立の型 *</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={savingType}
              className="w-full md:w-fit"
              onValueChange={(val) => {
                if (val) setSavingType(val as SavingType)
              }}
            >
              <ToggleGroupItem value="goal" className="flex-1 md:min-w-[100px]">
                目標型
              </ToggleGroupItem>
              <ToggleGroupItem value="free" className="flex-1 md:min-w-[100px]">
                自由型
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {savingType === 'goal'
                ? '目標金額と期限（任意）を設定します。'
                : '目標金額なし。累積額のみを管理します。'}
            </p>
          </div>

          {savingType === 'goal' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="target-amount">目標金額 *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ¥
                  </span>
                  <Input
                    id="target-amount"
                    type="number"
                    min="1"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(e.target.value)
                    }}
                    placeholder="100000"
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deadline">期限（任意）</Label>
                <Field orientation="horizontal">
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value)
                    }}
                  />
                  {deadline && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeadline('')
                      }}
                      aria-label="期限をクリア"
                    >
                      <XIcon />
                    </Button>
                  )}
                </Field>
                <p className="text-xs text-muted-foreground">
                  期限を設定すると月次目安額が算出されます。
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!isValid}>
            積立を作成
          </Button>
          <Button asChild variant="ghost">
            <Link to="/savings">キャンセル</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/savings/new/')({
  component: SavingNewPage,
})
